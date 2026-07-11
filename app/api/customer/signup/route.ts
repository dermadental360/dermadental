import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { customerCookieName, signCustomerToken } from "@/lib/auth";
import { fallbackStore } from "@/lib/fallbackStore";
import { logAction } from "@/lib/auditLogger";

export async function POST(request: NextRequest) {
  try {
    const { name, phone, email, password } = await request.json();

    if (!name || !phone || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    try {
      const existing = await prisma.customer.findUnique({
        where: { email: email.toLowerCase() }
      });
      if (existing) {
        return NextResponse.json({ error: "Email is already registered" }, { status: 400 });
      }

      const customer = await prisma.customer.create({
        data: {
          name,
          phone,
          email: email.toLowerCase(),
          passwordHash
        }
      });

      await logAction("Customer Signup", `New customer registered: "${name}" (${email}).`);

      const response = NextResponse.json({
        success: true,
        customer: {
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
    } catch (err) {
      console.warn("Prisma customer creation failed, using fallback:", err);
    }

    const existing = fallbackStore.customers.find((c: any) => c.email === email.toLowerCase());
    if (existing) {
      return NextResponse.json({ error: "Email is already registered" }, { status: 400 });
    }
    
    const customerId = "c-" + Date.now();
    const customer = {
      _id: customerId,
      name,
      phone,
      email: email.toLowerCase(),
      passwordHash,
      createdAt: new Date().toISOString()
    };
    fallbackStore.customers.push(customer);

    await logAction("Customer Signup", `New customer registered: "${name}" (${email}) (Offline).`);

    const response = NextResponse.json({
      success: true,
      customer: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone
      }
    });

    response.cookies.set(customerCookieName, signCustomerToken(customer._id, customer.email), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}
