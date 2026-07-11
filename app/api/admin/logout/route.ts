import { NextResponse } from "next/server";
import { cookieName } from "@/lib/auth";
import { logAction } from "@/lib/auditLogger";

export async function POST() {
  await logAction("Admin Logout", "Administrator logged out.");
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(cookieName);
  return response;
}
