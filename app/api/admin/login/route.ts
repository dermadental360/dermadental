import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { cookieName, signAdminToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/auditLogger";

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawEmail = (body.email || "").trim();
  const password = body.password || "";
  const configuredEmail = (process.env.ADMIN_EMAIL || "admin@dermadental360.com").trim().toLowerCase();
  const configuredPassword = process.env.ADMIN_PASSWORD || "admin12345";
  const inputEmailLower = rawEmail.toLowerCase();

  let ok = false;

  // 1. Direct match with configured environment credentials
  if (inputEmailLower === configuredEmail && password === configuredPassword) {
    ok = true;
  }

  // 2. Database Admin user verification
  if (!ok) {
    try {
      const admin = await prisma.admin.findFirst({
        where: {
          OR: [
            { email: rawEmail },
            { email: inputEmailLower }
          ]
        }
      });

      if (admin) {
        ok = await bcrypt.compare(password, admin.passwordHash);
      }
    } catch (err) {
      console.warn("Prisma admin check error:", err);
    }
  }

  if (!ok) {
    await logAction("Admin Login Fail", `Failed admin login attempt using email: "${rawEmail}".`);
    return NextResponse.json({ error: "Invalid login" }, { status: 401 });
  }

  await logAction("Admin Login Success", `Administrator "${rawEmail}" logged in successfully.`);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookieName, signAdminToken(rawEmail), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return response;
}
