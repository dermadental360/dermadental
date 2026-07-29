import { NextRequest, NextResponse } from "next/server";
import { verifyPaymentSignature, fetchRazorpayPayment } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimiter";
import { logAction } from "@/lib/auditLogger";
import { sendAdminOrderEmail, sendCustomerOrderEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
  const rateLimit = checkRateLimit(ip, 20, 60 * 1000);
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many payment verification attempts." }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
    return NextResponse.json({ error: "Missing required payment verification fields." }, { status: 400 });
  }

  try {
    const existingPayment = await prisma.payment.findUnique({
      where: { razorpayOrderId: razorpay_order_id }
    });
    let existingOrder: any = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!existingOrder) {
      // Self-healing fallback: fetch details from Razorpay and recreate order
      try {
        const razorpayPayment: any = await fetchRazorpayPayment(razorpay_payment_id);
        const notes = razorpayPayment.notes || {};
        const customerName = String(notes.customerName || razorpayPayment.email || "Customer");
        const customerEmail = String(notes.customerEmail || razorpayPayment.email || "");
        const customerPhone = String(notes.customerPhone || razorpayPayment.contact || "");
        const paidAmount = Number(razorpayPayment.amount || 0) / 100;

        existingOrder = await prisma.order.create({
          data: {
            id: orderId,
            customerName: customerName,
            customerPhone: customerPhone,
            customerEmail: customerEmail,
            customerAddress: "Online Delivery",
            items: [],
            total: paidAmount,
            finalAmount: paidAmount,
            paymentMethod: "RAZORPAY",
            paymentStatus: "PAID",
            status: "PAID",
            idempotencyKey: razorpay_order_id
          }
        });
      } catch (recoveryErr) {
        console.error("Order self-healing failed in verify API:", recoveryErr);
        return NextResponse.json({ error: "Order record not found and could not be recovered." }, { status: 404 });
      }
    }

    if (existingPayment?.status === "CAPTURED" || existingOrder.status === "PAID") {
      await logAction(
        "Duplicate Payment Verification",
        `Order ID "${orderId}" / Razorpay Order "${razorpay_order_id}" verification re-triggered. Returned existing success. IP: ${ip}`
      );
      return NextResponse.json({
        success: true,
        message: "Payment already verified successfully.",
        orderId: existingOrder.id,
        paymentId: existingPayment?.paymentId || razorpay_payment_id
      });
    }

    const isSignatureValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isSignatureValid) {
      if (existingPayment?.id) {
        try {
          await prisma.payment.update({
            where: { id: existingPayment.id },
            data: { status: "FAILED", failureReason: "Invalid HMAC SHA256 signature" }
          });
        } catch {}
      }
      await logAction(
        "Payment Verification Failure",
        `Invalid payment signature for Order ID "${orderId}" / Payment ID "${razorpay_payment_id}". IP: ${ip}`
      );
      return NextResponse.json({ error: "Payment verification failed due to invalid signature." }, { status: 400 });
    }

    let razorpayPayment: any;
    try {
      razorpayPayment = await fetchRazorpayPayment(razorpay_payment_id);
    } catch (err: any) {
      console.error("Failed to fetch payment details from Razorpay API:", err?.message || err);
      return NextResponse.json({ error: "Unable to verify payment with payment gateway API." }, { status: 502 });
    }

    const isValidStatus = razorpayPayment.status === "captured" || razorpayPayment.status === "authorized";
    const isOrderMatch = razorpayPayment.order_id === razorpay_order_id;

    if (!isValidStatus || !isOrderMatch) {
      return NextResponse.json({ error: "Payment validation failed against payment gateway records." }, { status: 400 });
    }

    const items = typeof existingOrder.items === "string" ? JSON.parse(existingOrder.items) : (existingOrder.items || []);

    await prisma.$transaction(async (tx) => {
      if (existingPayment?.id) {
        await tx.payment.update({
          where: { id: existingPayment.id },
          data: {
            paymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            status: "CAPTURED"
          }
        });
      }

      await tx.order.update({
        where: { id: orderId },
        data: { status: "PAID", paymentStatus: "PAID" }
      });

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
    });

    const customerName = existingOrder.customerName || "Customer";
    const customerEmail = existingOrder.customerEmail || "";
    const customerPhone = existingOrder.customerPhone || "";
    const customerAddress = existingOrder.customerAddress || "";
    const totalAmount = existingOrder.total || 0;
    const itemsList = items;
    const paymentTimeString = new Date().toLocaleString();

    try {
      const { createNotification } = await import("@/lib/notifications");
      await createNotification({
        title: "💰 Razorpay Payment Successful",
        message: `Order #${orderId} received from ${customerName} for ₹${totalAmount}.`,
        category: "SALES",
        priority: "HIGH",
        orderId: orderId,
        link: `/admin/orders?search=${orderId}`
      });
    } catch (notifErr: any) {
      console.warn("Could not trigger payment notification:", notifErr?.message || notifErr);
    }

    setImmediate(() => {
      sendAdminOrderEmail({
        orderId: orderId,
        customerName: customerName,
        customerPhone: customerPhone,
        customerEmail: customerEmail,
        customerAddress: customerAddress,
        items: itemsList,
        total: totalAmount,
        paymentStatus: "PAID",
        paymentTime: paymentTimeString,
        paymentId: razorpay_payment_id
      }).catch((emailErr: any) => console.warn("Could not send admin email:", emailErr?.message || emailErr));

      if (customerEmail) {
        sendCustomerOrderEmail({
          orderId: orderId,
          customerName: customerName,
          customerPhone: customerPhone,
          customerEmail: customerEmail,
          customerAddress: customerAddress,
          items: itemsList,
          total: totalAmount,
          paymentStatus: "PAID",
          paymentTime: paymentTimeString,
          paymentId: razorpay_payment_id,
          stage: "ORDER_CONFIRMED"
        }).catch((custEmailErr: any) => console.warn("Could not send customer email:", custEmailErr?.message || custEmailErr));
      }
    });

    await logAction(
      "Payment Verified Success",
      `Payment ID "${razorpay_payment_id}" verified successfully for Order ID "${orderId}". IP: ${ip}`
    );

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully.",
      orderId: orderId,
      paymentId: razorpay_payment_id
    });
  } catch (error: any) {
    console.error("Error verifying payment signature:", error?.message || error);
    return NextResponse.json({ error: "Internal error verifying payment signature." }, { status: 500 });
  }
}
