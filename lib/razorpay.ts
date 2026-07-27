import Razorpay from "razorpay";
import crypto from "crypto";

/**
 * Get initialized Razorpay instance using server-side environment variables.
 * Throws runtime error if credentials are missing.
 */
export function getRazorpayInstance(): Razorpay {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error("Razorpay credentials (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET) are missing from environment variables.");
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
}

/**
 * Verify Razorpay HMAC SHA256 payment signature securely on backend.
 * @param razorpayOrderId Order ID returned from Razorpay Order creation
 * @param razorpayPaymentId Payment ID returned from Razorpay Checkout popup
 * @param razorpaySignature Signature returned from Razorpay Checkout popup
 */
export function verifyPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    throw new Error("RAZORPAY_KEY_SECRET is not configured.");
  }

  const generatedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(generatedSignature, "utf-8"),
    Buffer.from(razorpaySignature, "utf-8")
  );
}

/**
 * Fetch payment details directly from Razorpay API using Payment ID.
 * @param paymentId Razorpay payment ID (pay_...)
 */
export async function fetchRazorpayPayment(paymentId: string) {
  const razorpay = getRazorpayInstance();
  return await razorpay.payments.fetch(paymentId);
}
