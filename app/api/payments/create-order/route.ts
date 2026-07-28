import { NextRequest, NextResponse } from "next/server";
import { getRazorpayInstance } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";
import { fallbackStore } from "@/lib/fallbackStore";
import { checkRateLimit } from "@/lib/rateLimiter";
import { logAction } from "@/lib/auditLogger";
import { calculateShippingDetails } from "@/lib/constants";
import { calculatePricingDetails } from "@/lib/pricing";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
  const rateLimit = checkRateLimit(ip, 20, 60 * 1000);
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
    // Attempt DB product lookup, fallback gracefully if DB is uninitialized or protocol differs
    let dbProducts: any[] = [];
    try {
      const itemIds = items.map((i: any) => String(i.productId || i.id));
      dbProducts = await prisma.product.findMany({
        where: { id: { in: itemIds } }
      });
    } catch (dbErr: any) {
      console.warn("Prisma product lookup warning (using item payload fallback):", dbErr?.message || dbErr);
    }

    const productMap = new Map(dbProducts.map(p => [p.id, p]));

    let calculatedSubtotalPaise = 0;
    const verifiedItems = [];

    for (const item of items) {
      const pid = String(item.productId || item.id);
      const product = productMap.get(pid);
      const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);

      // Determine unit price: DB product discountedPrice/price if available, else item.price
      const unitPrice = product
        ? (product.discountedPrice > 0 ? product.discountedPrice : product.price)
        : Number(item.price || 0);
      const unitPricePaise = Math.round(unitPrice * 100);
      const itemTotalPaise = unitPricePaise * quantity;

      calculatedSubtotalPaise += itemTotalPaise;

      verifiedItems.push({
        productId: pid,
        name: product ? product.name : (item.name || "Product"),
        price: unitPrice,
        quantity,
        total: itemTotalPaise / 100
      });
    }

    if (calculatedSubtotalPaise <= 0) {
      return NextResponse.json({ error: "Invalid order subtotal amount calculation." }, { status: 400 });
    }

    const subtotalRupees = calculatedSubtotalPaise / 100;

    // Centralized Pricing Breakdown with 5% Prepaid Discount for online payments
    const pricing = calculatePricingDetails(subtotalRupees, true);
    const grandTotalPaise = Math.round(pricing.finalAmount * 100);

    const keyId = process.env.RAZORPAY_KEY_ID;
    if (!keyId) {
      console.error("RAZORPAY_KEY_ID missing from environment variables");
      return NextResponse.json({ error: "Razorpay Key ID is not configured in server environment." }, { status: 500 });
    }

    // Initialize Razorpay SDK instance
    const razorpay = getRazorpayInstance();

    // Create Razorpay Order securely on backend (Discounted Grand Total in Paise)
    const razorpayOrder = await razorpay.orders.create({
      amount: grandTotalPaise,
      currency: "INR",
      receipt: `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      notes: {
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email || "",
        subtotal: pricing.subtotal,
        discountType: pricing.discountType || "PREPAID",
        discountPercentage: pricing.discountPercentage,
        discountAmount: pricing.discountAmount,
        shipping: pricing.shippingCharge,
        grandTotal: pricing.finalAmount
      }
    });

    let internalOrderId = "ord-" + Date.now();

    // Try saving internal Order & Payment to DB, fallback to in-memory store if DB error occurs
    try {
      const order = await prisma.order.create({
        data: {
          customerName: customer.name,
          customerPhone: customer.phone,
          customerEmail: customer.email || null,
          customerAddress: customer.address,
          notes: customer.notes || null,
          items: verifiedItems,
          subtotal: pricing.subtotal,
          discountType: pricing.discountType,
          discountPercentage: pricing.discountPercentage,
          discountAmount: pricing.discountAmount,
          shippingCharge: pricing.shippingCharge,
          total: pricing.finalAmount,
          finalAmount: pricing.finalAmount,
          paymentMethod: "RAZORPAY",
          paymentStatus: "PENDING",
          status: "PENDING"
        }
      });
      internalOrderId = order.id;

      await prisma.payment.create({
        data: {
          orderId: order.id,
          razorpayOrderId: razorpayOrder.id,
          amount: grandTotalPaise,
          currency: razorpayOrder.currency || "INR",
          status: "CREATED",
          customerName: customer.name,
          customerEmail: customer.email || null,
          customerPhone: customer.phone,
          clientIp: ip
        }
      });
    } catch (dbSaveErr: any) {
      console.warn("DB save warning in create-order, using fallbackStore:", dbSaveErr?.message || dbSaveErr);
      fallbackStore.orders.push({
        _id: internalOrderId,
        customer: {
          name: customer.name,
          phone: customer.phone,
          email: customer.email || "",
          address: customer.address,
          notes: customer.notes || ""
        },
        items: verifiedItems,
        subtotal: pricing.subtotal,
        discountType: pricing.discountType,
        discountPercentage: pricing.discountPercentage,
        discountAmount: pricing.discountAmount,
        shippingCharge: pricing.shippingCharge,
        total: pricing.finalAmount,
        finalAmount: pricing.finalAmount,
        paymentMethod: "RAZORPAY",
        paymentStatus: "PENDING",
        status: "PENDING",
        createdAt: new Date().toISOString()
      });
    }

    await logAction(
      "Create Razorpay Order",
      `Order ID "${internalOrderId}" created. Subtotal: ₹${pricing.subtotal}, Prepaid Discount (5%): -₹${pricing.discountAmount}, Shipping: ₹${pricing.shippingCharge}, Grand Total: ₹${pricing.finalAmount} (${grandTotalPaise} paise). IP: ${ip}`
    );

    return NextResponse.json({
      orderId: internalOrderId,
      razorpayOrderId: razorpayOrder.id,
      subtotal: pricing.subtotal,
      discountType: pricing.discountType,
      discountPercentage: pricing.discountPercentage,
      discountAmount: pricing.discountAmount,
      shippingCharge: pricing.shippingCharge,
      finalAmount: pricing.finalAmount,
      amount: grandTotalPaise,
      currency: "INR",
      key: keyId
    });
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error?.message || error);
    const detail = error?.message ? `: ${error.message}` : "";
    return NextResponse.json({ error: `Failed to initiate payment${detail}` }, { status: 500 });
  }
}
