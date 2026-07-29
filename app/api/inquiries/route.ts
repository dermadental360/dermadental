import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAction } from "@/lib/auditLogger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
  } catch (error: any) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const inquiries = await prisma.inquiry.findMany({
      orderBy: { createdAt: "desc" }
    });
    const formatted = inquiries.map(i => ({
      id: i.id,
      _id: i.id,
      name: i.name,
      phone: i.phone,
      email: i.email,
      message: i.message,
      status: i.status,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString()
    }));
    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("GET /api/inquiries MySQL failed:", error?.message || error);
    return NextResponse.json({ error: "Failed to fetch inquiries from database" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, phone, email, message } = await request.json();

    if (!name || !phone || !email || !message) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const inq = await prisma.inquiry.create({
      data: {
        name,
        phone,
        email,
        message,
        status: "New"
      }
    });

    const saved = {
      id: inq.id,
      _id: inq.id,
      name: inq.name,
      phone: inq.phone,
      email: inq.email,
      message: inq.message,
      status: inq.status,
      createdAt: inq.createdAt.toISOString()
    };

    await logAction("Create Inquiry", `Inquiry ID "${saved._id}" submitted by "${name}" (${email}).`);

    // Create DB Notification & Broadcast real-time event
    try {
      const { createNotification } = await import("@/lib/notifications");
      await createNotification({
        title: "📩 New Customer Inquiry",
        message: `Inquiry received from ${name} (${email}): "${message.slice(0, 70)}${message.length > 70 ? "..." : ""}"`,
        category: "INQUIRIES",
        priority: "MEDIUM",
        link: "/admin/inquiries"
      });
    } catch (err) {
      console.warn("Failed to trigger inquiry notification:", err);
    }

    return NextResponse.json({ success: true, inquiry: saved });
  } catch (error: any) {
    console.error("POST /api/inquiries MySQL failed:", error?.message || error);
    return NextResponse.json({ error: error.message || "Failed to submit inquiry" }, { status: 500 });
  }
}
