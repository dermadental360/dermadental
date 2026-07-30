import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAllSettings } from "@/lib/settings";
import { logAction } from "@/lib/auditLogger";
import { createNotification } from "@/lib/notifications";
import { sendAdminOrderEmail, sendCustomerOrderEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rateLimiter";
import { calculatePricingDetails } from "@/lib/pricing";
import { validateCoupon, recordCouponUsage } from "@/lib/coupons";

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

  const { customer, items, idempotencyKey, couponCode } = body;

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

  // Bulk fetch cached settings (60s TTL in memory)
  const settings = await getAllSettings();

  const codEnabled = settings.cod_enabled === "true";
  const codMinAmount = parseFloat(settings.cod_min_amount) || 500;
  const codMaxAmount = parseFloat(settings.cod_max_amount) || 5000;
  const codFeeEnabled = settings.cod_fee_enabled === "true";
  const codFeeAmount = codFeeEnabled ? (parseFloat(settings.cod_fee_amount) || 0) : 0;

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

  const pricingOptions = {
    freeShippingThreshold: parseFloat(settings.free_shipping_threshold) || 999,
    shippingFlatRate: parseFloat(settings.shipping_flat_rate) || 99,
    prepaidDiscountPercentage: parseFloat(settings.prepaid_discount_percentage) || 5,
    enablePrepaidDiscount: settings.enable_prepaid_discount !== "false",
    enableFreeShipping: settings.enable_free_shipping !== "false",
    enableCodFee: settings.enable_cod_fee === "true"
  };

  // COD is prepaid = false
  const pricing = calculatePricingDetails(calculatedSubtotal, false, codFeeAmount, 0, pricingOptions);
  const customerEmail = customer.email ? String(customer.email).trim().toLowerCase() : "";

  // Server-side coupon validation
  let couponDiscountAmount = 0;
  let validatedCouponObj: any = null;

  if (couponCode) {
    const couponVal = await validateCoupon({
      code: couponCode,
      cartItems: items.map((i: any) => ({
        productId: String(i.productId || i.id),
        category: i.category,
        price: Number(i.price || 0),
        quantity: Number(i.quantity || 1)
      })),
      subtotal: calculatedSubtotal,
      customerEmail,
      customerPhone: customer.phone,
    });

    if (couponVal.valid) {
      couponDiscountAmount = couponVal.discountAmount;
      validatedCouponObj = couponVal.coupon;
    }
  }

  const finalDiscountAmount = pricing.discountAmount + couponDiscountAmount;
  const grandTotal = Math.max(0, Math.round((pricing.finalAmount - couponDiscountAmount) * 100) / 100);

  try {
    // 1. Upsert customer in Customer table if email is present
    if (customerEmail) {
      try {
        await prisma.customer.upsert({
          where: { email: customerEmail },
          update: {
            name: customer.name,
            phone: customer.phone
          },
          create: {
            email: customerEmail,
            name: customer.name,
            phone: customer.phone,
            passwordHash: "direct-order-guest"
          }
        });
      } catch (cErr) {
        console.warn("Customer upsert in COD warning:", cErr);
      }
    }

    // 2. Create Order in MySQL & decrement inventory stock in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          customerName: customer.name,
          customerPhone: customer.phone,
          customerEmail: customerEmail,
          customerAddress: customer.address,
          notes: customer.notes || "",
          items: items,
          subtotal: pricing.subtotal,
          discountType: validatedCouponObj?.code ? `COUPON_${validatedCouponObj.code}` : pricing.discountType,
          discountPercentage: pricing.discountPercentage,
          discountAmount: finalDiscountAmount,
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

      // Decrement stock for ordered items
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item.productId || item.id) {
            const pId = String(item.productId || item.id);
            try {
              await tx.product.update({
                where: { id: pId },
                data: { stock: { decrement: Math.max(1, Number(item.quantity) || 1) } }
              });
            } catch (pErr) {
              console.warn(`Could not decrement stock for product ${pId}:`, pErr);
            }
          }
        }
      }

      return createdOrder;
    });

    if (validatedCouponObj?.id) {
      await recordCouponUsage(validatedCouponObj.id, order.id, customerEmail, customer.phone, couponDiscountAmount);
    }

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

    // Dispatch Admin WhatsApp Alert
    try {
      const { sendAdminNewOrderWhatsApp } = await import("@/lib/whatsapp");
      await sendAdminNewOrderWhatsApp({
        id: order.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        customerAddress: customer.address,
        total: grandTotal,
        paymentMethod: "COD",
        items,
        createdAt: order.createdAt,
      });
    } catch (waErr) {
      console.warn("Failed to send Admin WhatsApp notification:", waErr);
    }

    // Auto-mark Abandoned Cart as Recovered
    try {
      const { markCartRecovered } = await import("@/lib/abandonedCart");
      await markCartRecovered(undefined, customer.email, customer.phone, order.id);
    } catch (acErr) {
      console.warn("Failed to mark cart as recovered:", acErr);
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
