import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { customerCookieName, signCustomerToken } from "@/lib/auth";
import { logAction } from "@/lib/auditLogger";

export async function POST(request: NextRequest) {
  try {
    const { identifier, password } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json({ error: "Missing identifier or password" }, { status: 400 });
    }

    const normalizedIdentifier = String(identifier).trim().toLowerCase();
    const customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { email: normalizedIdentifier },
          { phone: identifier }
        ]
      }
    });

    if (!customer) {
      await logAction("Customer Login Fail", `Failed login attempt for identifier: "${identifier}".`);
      return NextResponse.json({ error: "Invalid email/phone or password" }, { status: 401 });
    }

    const match = await bcrypt.compare(password, customer.passwordHash);
    if (!match) {
      await logAction("Customer Login Fail", `Failed password verification for: "${customer.email}".`);
      return NextResponse.json({ error: "Invalid email/phone or password" }, { status: 401 });
    }

    await logAction("Customer Login Success", `Customer "${customer.email}" logged in successfully.`);

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
    console.error("POST /api/customer/login error:", error?.message || error);
    return NextResponse.json({ error: error.message || "Failed to process login" }, { status: 500 });
  }
}
