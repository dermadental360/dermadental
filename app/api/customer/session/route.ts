import { NextResponse } from "next/server";
import { getCustomer } from "@/lib/auth";

export async function GET() {
  const customer = await getCustomer();
  if (!customer) {
    return NextResponse.json({ authenticated: false, customer: null });
  }
  return NextResponse.json({ authenticated: true, customer });
}

export const dynamic = "force-dynamic";

