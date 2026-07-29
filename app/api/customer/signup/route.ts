import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { customerCookieName, signCustomerToken } from "@/lib/auth";
import { logAction } from "@/lib/auditLogger";

export async function POST(request: NextRequest) {
  try {
    const { name, phone, email, password } = await request.json();

    if (!name || !phone || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const emailClean = String(email).trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, 10);

    const existing = await prisma.customer.findUnique({
      where: { email: emailClean }
    });
    if (existing) {
      return NextResponse.json({ error: "Email is already registered" }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        phone,
        email: emailClean,
        passwordHash
      }
    });

    await logAction("Customer Signup", `New customer registered: "${name}" (${emailClean}).`);

    // Create DB Notification & Broadcast real-time event
    try {
      const { createNotification } = await import("@/lib/notifications");
      await createNotification({
        title: "👤 New Customer Registration",
        message: `${name} (${emailClean}) created an account.`,
        category: "CUSTOMERS",
        priority: "LOW",
        link: "/admin/notifications"
      });
    } catch (err) {
      console.warn("Failed to trigger customer notification:", err);
    }

    const response = NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        _id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone
      }
    });

    response.cookies.set(customerCookieName, signCustomerToken(customer.id, customer.email), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });

    return response;
  } catch (error: any) {
    console.error("POST /api/customer/signup error:", error?.message || error);
    return NextResponse.json({ error: error.message || "Failed to register customer" }, { status: 500 });
  }
}
