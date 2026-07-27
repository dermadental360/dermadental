import { NextRequest, NextResponse } from "next/server";
import { verifyPaymentSignature, fetchRazorpayPayment } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";
import { fallbackStore } from "@/lib/fallbackStore";
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
    // Attempt checking DB records
    let existingPayment: any = null;
    let existingOrder: any = null;

    try {
      existingPayment = await prisma.payment.findUnique({
        where: { razorpayOrderId: razorpay_order_id }
      });
      existingOrder = await prisma.order.findUnique({
        where: { id: orderId }
      });
    } catch (dbErr: any) {
      console.warn("Prisma verification lookup warning:", dbErr?.message || dbErr);
    }

    // Check in-memory store if DB lookup returned null
    if (!existingOrder) {
      existingOrder = fallbackStore.orders.find((o) => String(o._id) === String(orderId));
    }

    // Idempotency check: return existing success response if already marked paid
    if (existingPayment?.status === "CAPTURED" || existingOrder?.status === "PAID") {
      await logAction(
        "Duplicate Payment Verification",
        `Order ID "${orderId}" / Razorpay Order "${razorpay_order_id}" verification re-triggered. Returned existing success. IP: ${ip}`
      );
      return NextResponse.json({
        success: true,
        message: "Payment already verified successfully.",
        orderId: existingOrder?._id || existingOrder?.id || orderId,
        paymentId: existingPayment?.paymentId || razorpay_payment_id
      });
    }

    // Step 1: Verify HMAC SHA256 Signature
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

    // Step 2: Additional verification via Razorpay API
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

    // Step 3: Update records & Decrement Inventory Stock
    try {
      const items = typeof existingOrder?.items === "string" ? JSON.parse(existingOrder.items) : (existingOrder?.items || []);

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
          data: { status: "PAID" }
        });

        if (Array.isArray(items)) {
          for (const item of items) {
            if (item.productId) {
              try {
                await tx.product.update({
                  where: { id: String(item.productId) },
                  data: { stock: { decrement: Math.max(1, Number(item.quantity) || 1) } }
                });
              } catch {}
            }
          }
        }
      });
    } catch (dbTxErr: any) {
      console.warn("DB transaction warning in verify API, updating fallback store:", dbTxErr?.message || dbTxErr);
      if (existingOrder) {
        existingOrder.status = "PAID";
      }
    }

    // Step 4: Create Admin Notification & Send Email Alerts
    const customerName = existingOrder?.customerName || existingOrder?.customer?.name || "Customer";
    const customerEmail = existingOrder?.customerEmail || existingOrder?.customer?.email || "";
    const customerPhone = existingOrder?.customerPhone || existingOrder?.customer?.phone || "";
    const customerAddress = existingOrder?.customerAddress || existingOrder?.customer?.address || "";
    const totalAmount = existingOrder?.total || 0;
    const itemsList = typeof existingOrder?.items === "string" ? JSON.parse(existingOrder.items) : (existingOrder?.items || []);
    const paymentTimeString = new Date().toLocaleString();

    try {
      const notification = await prisma.notification.create({
        data: {
          title: "🛒 New Order Received",
          message: `Order #${orderId} received from ${customerName} for ₹${totalAmount}.`,
          type: "ORDER",
          orderId: orderId,
          isRead: false
        }
      });

      const { broadcastAdminEvent } = await import("@/lib/eventBus");
      broadcastAdminEvent("PAYMENT_SUCCESS", { orderId, amount: totalAmount, customerName });
      broadcastAdminEvent("NOTIFICATION_NEW", notification);
    } catch (notifErr: any) {
      console.warn("Could not create DB notification entry:", notifErr?.message || notifErr);
      try {
        const { broadcastAdminEvent } = await import("@/lib/eventBus");
        broadcastAdminEvent("PAYMENT_SUCCESS", { orderId, amount: totalAmount, customerName });
      } catch {}
    }

    // Non-blocking Admin Email dispatch
    try {
      await sendAdminOrderEmail({
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
      });
    } catch (emailErr: any) {
      console.warn("Could not send admin email:", emailErr?.message || emailErr);
    }

    // Non-blocking Customer Order Confirmation Email dispatch
    if (customerEmail) {
      try {
        await sendCustomerOrderEmail({
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
        });
      } catch (custEmailErr: any) {
        console.warn("Could not send customer confirmation email:", custEmailErr?.message || custEmailErr);
      }
    }

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
