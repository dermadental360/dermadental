import { NextRequest, NextResponse } from "next/server";
import { saveOrUpdateAbandonedCart } from "@/lib/abandonedCart";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, customerName, email, phone, items, cartValue } = body;

    if (!sessionId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Session ID and cart items are required" }, { status: 400 });
    }

    const saved = await saveOrUpdateAbandonedCart({
      sessionId,
      customerName,
      email,
      phone,
      items,
      cartValue: parseFloat(cartValue || 0),
    });

    return NextResponse.json({ success: true, cart: saved });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to record cart state" }, { status: 500 });
  }
}
