import { NextRequest, NextResponse } from "next/server";
import { getRazorpayInstance } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimiter";
import { logAction } from "@/lib/auditLogger";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
  const rateLimit = checkRateLimit(ip, 15, 60 * 1000);
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many payment requests. Please try again in a minute." }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { customer, items } = body;

  if (!customer?.name || !customer?.phone || !customer?.address || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Missing required customer or items details." }, { status: 400 });
  }

  try {
    // Fetch product details from DB to calculate exact price on the server (in Paise)
    const itemIds = items.map((i: any) => String(i.productId || i.id));
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: itemIds } }
    });

    const productMap = new Map(dbProducts.map(p => [p.id, p]));

    let calculatedTotalPaise = 0;
    const verifiedItems = [];

    for (const item of items) {
      const pid = String(item.productId || item.id);
      const product = productMap.get(pid);
      const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);

      // Determine unit price: use discountedPrice if valid, else price
      const unitPrice = product ? (product.discountedPrice > 0 ? product.discountedPrice : product.price) : Number(item.price || 0);
      const unitPricePaise = Math.round(unitPrice * 100);
      const itemTotalPaise = unitPricePaise * quantity;

      calculatedTotalPaise += itemTotalPaise;

      verifiedItems.push({
        productId: pid,
        name: product ? product.name : (item.name || "Product"),
        price: unitPrice,
        quantity,
        total: itemTotalPaise / 100
      });
    }

    if (calculatedTotalPaise <= 0) {
      return NextResponse.json({ error: "Invalid order amount calculation." }, { status: 400 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    if (!keyId) {
      console.error("RAZORPAY_KEY_ID missing from environment variables");
      return NextResponse.json({ error: "Payment gateway configuration error." }, { status: 500 });
    }

    // Initialize Razorpay SDK instance
    const razorpay = getRazorpayInstance();

    // Create Razorpay Order securely on backend (Amount in Paise)
    const razorpayOrder = await razorpay.orders.create({
      amount: calculatedTotalPaise,
      currency: "INR",
      receipt: `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      notes: {
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email || ""
      }
    });

    // Save internal Order (Total in Rupees for UI/Invoice) & Payment record (Amount in Paise)
    const totalRupees = calculatedTotalPaise / 100;

    const order = await prisma.order.create({
      data: {
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email || null,
        customerAddress: customer.address,
        notes: customer.notes || null,
        items: verifiedItems,
        total: totalRupees,
        status: "PENDING"
      }
    });

    await prisma.payment.create({
      data: {
        orderId: order.id,
        razorpayOrderId: razorpayOrder.id,
        amount: calculatedTotalPaise,
        currency: razorpayOrder.currency || "INR",
        status: "CREATED",
        customerName: customer.name,
        customerEmail: customer.email || null,
        customerPhone: customer.phone,
        clientIp: ip
      }
    });

    await logAction(
      "Create Razorpay Order",
      `Order ID "${order.id}" / Razorpay Order "${razorpayOrder.id}" created for customer "${customer.name}" (Amount: ₹${totalRupees} / ${calculatedTotalPaise} paise). IP: ${ip}`
    );

    return NextResponse.json({
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      amount: calculatedTotalPaise,
      currency: "INR",
      key: keyId
    });
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error?.message || error);
    return NextResponse.json({ error: "Failed to initiate payment. Please try again." }, { status: 500 });
  }
}
