import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { fallbackStore } from "@/lib/fallbackStore";
import { logAction } from "@/lib/auditLogger";

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
  } catch (error) {
    console.error("GET /api/inquiries failed:", error);
    return NextResponse.json(fallbackStore.inquiries);
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

    let saved: any = null;
    try {
      const inq = await prisma.inquiry.create({
        data: {
          name,
          phone,
          email,
          message,
          status: "New"
        }
      });
      saved = {
        _id: inq.id,
        name: inq.name,
        phone: inq.phone,
        email: inq.email,
        message: inq.message,
        status: inq.status,
        createdAt: inq.createdAt.toISOString()
      };
    } catch (error) {
      console.warn("Failed to save inquiry to SQLite, using fallback:", error);
      saved = {
        _id: "inq-" + Date.now(),
        name,
        phone,
        email,
        message,
        status: "New",
        createdAt: new Date().toISOString()
      };
      fallbackStore.inquiries.push(saved);
    }

    await logAction("Create Inquiry", `Inquiry ID "${saved._id}" submitted by "${name}" (${email}).`);

    return NextResponse.json({ success: true, inquiry: saved });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}
