import { NextRequest, NextResponse } from "next/server";
import { validateCoupon } from "@/lib/coupons";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, cartItems, subtotal, customerEmail, customerPhone } = body;

    if (!code || typeof subtotal !== "number" || !Array.isArray(cartItems)) {
      return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 });
    }

    const result = await validateCoupon({
      code,
      cartItems,
      subtotal,
      customerEmail,
      customerPhone,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Coupon validation endpoint error:", error);
    return NextResponse.json({ error: error.message || "Failed to validate coupon" }, { status: 500 });
  }
}
