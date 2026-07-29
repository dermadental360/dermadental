import { NextRequest, NextResponse } from "next/server";
import { getRazorpayInstance } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimiter";
import { logAction } from "@/lib/auditLogger";
import { calculatePricingDetails } from "@/lib/pricing";
import { getAllSettings } from "@/lib/settings";

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
    const itemIds = items.map((i: any) => String(i.productId || i.id));
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: itemIds } }
    });

    const productMap = new Map(dbProducts.map(p => [p.id, p]));

    let calculatedSubtotalPaise = 0;
    const verifiedItems: any[] = [];

    for (const item of items) {
      const pid = String(item.productId || item.id);
      const product = productMap.get(pid);
      const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);

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

    const settings = await getAllSettings();
    const pricingOptions = {
      freeShippingThreshold: parseFloat(settings.free_shipping_threshold) || 999,
      shippingFlatRate: parseFloat(settings.shipping_flat_rate) || 99,
      prepaidDiscountPercentage: parseFloat(settings.prepaid_discount_percentage) || 5,
      enablePrepaidDiscount: settings.enable_prepaid_discount !== "false",
      enableFreeShipping: settings.enable_free_shipping !== "false",
      enableCodFee: settings.enable_cod_fee === "true"
    };

    const subtotalRupees = calculatedSubtotalPaise / 100;
    const pricing = calculatePricingDetails(subtotalRupees, true, 0, 0, pricingOptions);
    const grandTotalPaise = Math.round(pricing.finalAmount * 100);

    const keyId = process.env.RAZORPAY_KEY_ID;
    if (!keyId) {
      console.error("RAZORPAY_KEY_ID missing from environment variables");
      return NextResponse.json({ error: "Razorpay Key ID is not configured in server environment." }, { status: 500 });
    }

    const razorpay = getRazorpayInstance();
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

    const customerEmail = customer.email ? String(customer.email).trim().toLowerCase() : "";

    if (customerEmail) {
      try {
        await prisma.customer.upsert({
          where: { email: customerEmail },
          update: { name: customer.name, phone: customer.phone },
          create: {
            email: customerEmail,
            name: customer.name,
            phone: customer.phone,
            passwordHash: "direct-order-guest"
          }
        });
      } catch (cErr) {
        console.warn("Customer upsert in online payment warning:", cErr);
      }
    }

    const { order, payment } = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          customerName: customer.name,
          customerPhone: customer.phone,
          customerEmail: customerEmail,
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

      const createdPayment = await tx.payment.create({
        data: {
          orderId: createdOrder.id,
          razorpayOrderId: razorpayOrder.id,
          amount: grandTotalPaise,
          currency: razorpayOrder.currency || "INR",
          status: "CREATED",
          customerName: customer.name,
          customerEmail: customerEmail,
          customerPhone: customer.phone,
          clientIp: ip
        }
      });

      return { order: createdOrder, payment: createdPayment };
    });

    await logAction(
      "Create Razorpay Order",
      `Order ID "${order.id}" created. Subtotal: ₹${pricing.subtotal}, Prepaid Discount (5%): -₹${pricing.discountAmount}, Shipping: ₹${pricing.shippingCharge}, Grand Total: ₹${pricing.finalAmount} (${grandTotalPaise} paise). IP: ${ip}`
    );

    return NextResponse.json({
      orderId: order.id,
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
