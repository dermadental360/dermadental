import { NextResponse } from "next/server";
import { customerCookieName } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(customerCookieName);
  return response;
}
