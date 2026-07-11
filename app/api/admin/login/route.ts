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

  const { email, password } = body;
  const configuredEmail = process.env.ADMIN_EMAIL || "admin@dermadental360.com";
  const configuredPassword = process.env.ADMIN_PASSWORD || "admin12345";
  let ok = email === configuredEmail && password === configuredPassword;

  try {
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (admin) {
      ok = await bcrypt.compare(password, admin.passwordHash);
    } else {
      const count = await prisma.admin.count();
      if (count === 0) {
        ok = email === configuredEmail && password === configuredPassword;
      } else {
        ok = false;
      }
    }
  } catch (err) {
    console.warn("Prisma admin check failed, using environment credentials fallback:", err);
    ok = email === configuredEmail && password === configuredPassword;
  }

  if (!ok) {
    await logAction("Admin Login Fail", `Failed admin login attempt using email: "${email}".`);
    return NextResponse.json({ error: "Invalid login" }, { status: 401 });
  }

  await logAction("Admin Login Success", `Administrator "${email}" logged in successfully.`);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookieName, signAdminToken(email), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return response;
}
