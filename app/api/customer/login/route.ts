import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { customerCookieName, signCustomerToken } from "@/lib/auth";
import { fallbackStore } from "@/lib/fallbackStore";
import { logAction } from "@/lib/auditLogger";

export async function POST(request: NextRequest) {
  try {
    const { identifier, password } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json({ error: "Missing identifier or password" }, { status: 400 });
    }

    try {
      const normalizedIdentifier = identifier.toLowerCase();
      const customer = await prisma.customer.findFirst({
        where: {
          OR: [
            { email: normalizedIdentifier },
            { phone: identifier }
          ]
        }
      });

      if (customer) {
        const match = await bcrypt.compare(password, customer.passwordHash);
        if (!match) {
          await logAction("Customer Login Fail", `Failed password verification for: "${customer.email}".`);
          return NextResponse.json({ error: "Invalid email/phone or password" }, { status: 401 });
        }

        await logAction("Customer Login Success", `Customer "${customer.email}" logged in successfully.`);

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
      }
    } catch (err) {
      console.warn("Prisma customer login check failed, using fallback:", err);
    }

    const normalizedIdentifier = identifier.toLowerCase();
    const customer = fallbackStore.customers.find((c: any) => 
      c.email === normalizedIdentifier || c.phone === identifier
    );

    if (!customer) {
      await logAction("Customer Login Fail", `Failed login attempt for identifier: "${identifier}" (Offline).`);
      return NextResponse.json({ error: "Invalid email/phone or password" }, { status: 401 });
    }

    const match = await bcrypt.compare(password, customer.passwordHash);
    if (!match) {
      await logAction("Customer Login Fail", `Failed password verification for: "${customer.email}" (Offline).`);
      return NextResponse.json({ error: "Invalid email/phone or password" }, { status: 401 });
    }

    await logAction("Customer Login Success", `Customer "${customer.email}" logged in successfully (Offline).`);

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
