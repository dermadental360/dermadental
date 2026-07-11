import { NextResponse } from "next/server";
import { getCustomer } from "@/lib/auth";

export async function GET() {
  const customer = await getCustomer();
  if (!customer) {
    return NextResponse.json(null, { status: 401 });
  }
  return NextResponse.json(customer);
}
