import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";
import { logAction } from "@/lib/auditLogger";
import { createNotification } from "@/lib/notifications";
import { sendAdminOrderEmail, sendCustomerOrderEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rateLimiter";
import { calculatePricingDetails } from "@/lib/pricing";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
  const rateLimit = checkRateLimit(ip, 15, 60 * 1000);
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const { customer, items, idempotencyKey } = body;

  if (!customer?.name || !customer?.phone || !customer?.address || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Missing required order details" }, { status: 400 });
  }

  // Idempotency Protection Check
  if (idempotencyKey) {
    try {
      const existing = await prisma.order.findUnique({
        where: { idempotencyKey }
      });
      if (existing) {
        return NextResponse.json({
          success: true,
          message: "Order already processed.",
          orderId: existing.id,
          order: {
            ...existing,
            _id: existing.id
          },
          isDuplicate: true
        });
      }
    } catch (dbErr) {
      console.warn("Idempotency lookup warning:", dbErr);
    }
  }

  // Fetch COD Configuration Settings
  const codEnabledStr = await getSetting("cod_enabled");
  const codMinStr = await getSetting("cod_min_amount");
  const codMaxStr = await getSetting("cod_max_amount");
  const codFeeEnabledStr = await getSetting("cod_fee_enabled");
  const codFeeAmountStr = await getSetting("cod_fee_amount");

  const codEnabled = codEnabledStr === "true";
  const codMinAmount = parseFloat(codMinStr) || 500;
  const codMaxAmount = parseFloat(codMaxStr) || 5000;
  const codFeeEnabled = codFeeEnabledStr === "true";
  const codFeeAmount = codFeeEnabled ? (parseFloat(codFeeAmountStr) || 0) : 0;

  if (!codEnabled) {
    return NextResponse.json({
      error: "Cash on Delivery is currently disabled. Please select Online Payment."
    }, { status: 400 });
  }

  // Server-side recalculation of subtotal and total
  const calculatedSubtotal = items.reduce((sum: number, item: any) => {
    return sum + (Number(item.price) || 0) * (Number(item.quantity) || 1);
  }, 0);

  if (calculatedSubtotal < codMinAmount) {
    return NextResponse.json({
      error: `Cash on Delivery is available only for orders of ₹${codMinAmount} or more. Please select Online Payment.`
    }, { status: 400 });
  }

  if (calculatedSubtotal > codMaxAmount) {
    return NextResponse.json({
      error: `Cash on Delivery is not available for orders above ₹${codMaxAmount}. Please select Online Payment.`
    }, { status: 400 });
  }

  // COD is prepaid = false (Not eligible for 5% prepaid discount)
  const pricing = calculatePricingDetails(calculatedSubtotal, false, codFeeAmount);
  const grandTotal = pricing.finalAmount;

  try {
    const order = await prisma.order.create({
      data: {
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email || "",
        customerAddress: customer.address,
        notes: customer.notes || "",
        items: items,
        subtotal: pricing.subtotal,
        discountType: pricing.discountType,
        discountPercentage: pricing.discountPercentage,
        discountAmount: pricing.discountAmount,
        shippingCharge: pricing.shippingCharge,
        codFee: pricing.codFee,
        total: grandTotal,
        finalAmount: grandTotal,
        paymentMethod: "COD",
        paymentStatus: "PENDING",
        status: "PLACED",
        idempotencyKey: idempotencyKey || `cod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        whatsappSent: false
      }
    });

    const paymentTimeString = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    // Trigger Admin Notification & Real-Time SSE
    try {
      await createNotification({
        title: "🛒 New COD Order Received",
        message: `Order #${order.id} placed by ${customer.name} for ₹${grandTotal} (Cash on Delivery - Payment Pending).`,
        category: "ORDERS",
        priority: "HIGH",
        orderId: order.id,
        link: `/admin/orders?search=${order.id}`
      });
    } catch (notifErr) {
      console.warn("Failed to create COD notification:", notifErr);
    }

    // Non-blocking Email dispatches
    if (customer.email) {
      try {
        await sendCustomerOrderEmail({
          orderId: order.id,
          customerName: customer.name,
          customerPhone: customer.phone,
          customerEmail: customer.email,
          customerAddress: customer.address,
          items: items,
          subtotal: calculatedSubtotal,
          discountAmount: pricing.discountAmount,
          discountType: pricing.discountType || undefined,
          shippingCharge: pricing.shippingCharge,
          total: grandTotal,
          paymentStatus: "PENDING",
          paymentTime: paymentTimeString,
          stage: "ORDER_CONFIRMED"
        });
      } catch (emailErr) {
        console.warn("Failed to send customer COD email:", emailErr);
      }
    }

    try {
      await sendAdminOrderEmail({
        orderId: order.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        customerAddress: customer.address,
        items: items,
        subtotal: calculatedSubtotal,
        discountAmount: pricing.discountAmount,
        discountType: pricing.discountType || undefined,
        shippingCharge: pricing.shippingCharge,
        total: grandTotal,
        paymentStatus: "PENDING (COD)",
        paymentTime: paymentTimeString
      });
    } catch (adminEmailErr) {
      console.warn("Failed to send admin COD email:", adminEmailErr);
    }

    await logAction("Create COD Order", `New COD Order ID "${order.id}" placed by "${customer.name}" (Total: ₹${grandTotal}).`);

    return NextResponse.json({
      success: true,
      message: "Your Cash on Delivery order has been placed successfully.",
      orderId: order.id,
      order: {
        ...order,
        _id: order.id
      }
    });
  } catch (error: any) {
    console.error("POST /api/checkout/cod error:", error?.message || error);
    return NextResponse.json({ error: "Failed to place COD order: " + (error?.message || "Internal error") }, { status: 500 });
  }
}
