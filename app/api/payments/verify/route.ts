import { NextRequest, NextResponse } from "next/server";
import { verifyPaymentSignature, fetchRazorpayPayment } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimiter";
import { logAction } from "@/lib/auditLogger";

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
    // Check existing payment & order status for Strong Idempotency
    const existingPayment = await prisma.payment.findUnique({
      where: { razorpayOrderId: razorpay_order_id }
    });

    if (!existingPayment) {
      return NextResponse.json({ error: "Associated payment record not found." }, { status: 404 });
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId }
    });

    // Idempotency: If already captured and paid, return existing success
    if (existingPayment.status === "CAPTURED" || existingOrder?.status === "PAID") {
      await logAction(
        "Duplicate Payment Verification",
        `Order ID "${orderId}" / Razorpay Order "${razorpay_order_id}" verification called again. Returned existing success. IP: ${ip}`
      );
      return NextResponse.json({
        success: true,
        message: "Payment already verified successfully.",
        orderId: existingOrder?.id,
        paymentId: existingPayment.paymentId || razorpay_payment_id
      });
    }

    // Step 1: Verify HMAC SHA256 Signature
    const isSignatureValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isSignatureValid) {
      await prisma.payment.update({
        where: { id: existingPayment.id },
        data: { status: "FAILED", failureReason: "Invalid HMAC SHA256 signature" }
      });
      await logAction(
        "Payment Verification Failure",
        `Invalid payment signature for Order ID "${orderId}" / Payment ID "${razorpay_payment_id}". IP: ${ip}`
      );
      return NextResponse.json({ error: "Payment verification failed due to invalid signature." }, { status: 400 });
    }

    // Step 2: Additional verification via Razorpay API
    let razorpayPayment;
    try {
      razorpayPayment = await fetchRazorpayPayment(razorpay_payment_id);
    } catch (err: any) {
      console.error("Failed to fetch payment details from Razorpay API:", err?.message || err);
      return NextResponse.json({ error: "Unable to verify payment with payment gateway API." }, { status: 502 });
    }

    // Verify payment status, amount in paise, currency, and order ID match
    const isValidStatus = razorpayPayment.status === "captured" || razorpayPayment.status === "authorized";
    const isAmountMatch = Number(razorpayPayment.amount) === existingPayment.amount;
    const isCurrencyMatch = razorpayPayment.currency === existingPayment.currency;
    const isOrderMatch = razorpayPayment.order_id === razorpay_order_id;

    if (!isValidStatus || !isAmountMatch || !isCurrencyMatch || !isOrderMatch) {
      const failureReason = `Mismatch: status=${razorpayPayment.status}, amountMatch=${isAmountMatch}, currencyMatch=${isCurrencyMatch}, orderMatch=${isOrderMatch}`;
      await prisma.payment.update({
        where: { id: existingPayment.id },
        data: { status: "FAILED", failureReason }
      });
      await logAction(
        "Payment Validation Discrepancy",
        `Payment "${razorpay_payment_id}" failed secondary check. Details: ${failureReason}. IP: ${ip}`
      );
      return NextResponse.json({ error: "Payment validation failed against payment gateway records." }, { status: 400 });
    }

    // Step 3: Execute Prisma Transaction (Update Payment, Update Order to PAID, Decrement Stock)
    const items = typeof existingOrder?.items === "string" ? JSON.parse(existingOrder.items) : (existingOrder?.items || []);

    await prisma.$transaction(async (tx) => {
      // 1. Mark Payment CAPTURED
      await tx.payment.update({
        where: { id: existingPayment.id },
        data: {
          paymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          status: "CAPTURED"
        }
      });

      // 2. Mark Order PAID
      await tx.order.update({
        where: { id: orderId },
        data: { status: "PAID" }
      });

      // 3. Decrement Inventory Stock atomically
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item.productId) {
            try {
              await tx.product.update({
                where: { id: String(item.productId) },
                data: { stock: { decrement: Math.max(1, Number(item.quantity) || 1) } }
              });
            } catch (err) {
              console.warn(`Could not decrement stock for product "${item.productId}":`, err);
            }
          }
        }
      }
    });

    await logAction(
      "Payment Verified Success",
      `Payment ID "${razorpay_payment_id}" verified successfully for Order ID "${orderId}". Total: ₹${existingOrder?.total}. Inventory updated. IP: ${ip}`
    );

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully.",
      orderId: existingOrder?.id,
      paymentId: razorpay_payment_id
    });
  } catch (error: any) {
    console.error("Error verifying payment signature:", error?.message || error);
    return NextResponse.json({ error: "Internal error verifying payment signature." }, { status: 500 });
  }
}
