import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, cookieName } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { logAction } from "@/lib/auditLogger";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (error: any) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Missing password fields" }, { status: 400 });
  }

  // Get current admin email from token
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let email = "";
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    email = decoded.email;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify current password
  let currentPasswordValid = false;
  let adminId = "";

  const configuredEmail = process.env.ADMIN_EMAIL || "admin@dermadental360.com";
  const configuredPassword = process.env.ADMIN_PASSWORD || "admin12345";

  try {
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (admin) {
      adminId = admin.id;
      currentPasswordValid = await bcrypt.compare(currentPassword, admin.passwordHash);
    } else {
      // If no admin in database yet, verify against default config credentials
      if (email === configuredEmail && currentPassword === configuredPassword) {
        currentPasswordValid = true;
      }
    }
  } catch (err) {
    console.error("Prisma lookup failed during change-password:", err);
    if (email === configuredEmail && currentPassword === configuredPassword) {
      currentPasswordValid = true;
    }
  }

  if (!currentPasswordValid) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  // Hash new password and save/update database record
  try {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    if (adminId) {
      await prisma.admin.update({
        where: { id: adminId },
        data: { passwordHash }
      });
    } else {
      // Create new Admin record if it didn't exist in DB yet
      await prisma.admin.create({
        data: {
          email,
          passwordHash
        }
      });
    }

    await logAction("Change Password", `Admin password updated successfully for "${email}".`);
    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (error: any) {
    console.error("Failed to update password hash:", error);
    return NextResponse.json({ error: "Failed to update password in database" }, { status: 500 });
  }
}
