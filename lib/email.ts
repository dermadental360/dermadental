import nodemailer from "nodemailer";
import { logAction } from "./auditLogger";
import { clinic, calculateShippingDetails } from "./constants";

export type OrderLifecycleStage =
  | "ORDER_CONFIRMED"
  | "ORDER_PROCESSING"
  | "ORDER_PACKED"
  | "ORDER_SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export interface CustomerOrderEmailData {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal?: number;
  shippingCharge?: number;
  total: number;
  paymentStatus: string;
  paymentTime: string;
  paymentId?: string;
  stage?: OrderLifecycleStage;
}

export interface AdminOrderEmailData {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  customerAddress: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal?: number;
  shippingCharge?: number;
  total: number;
  paymentStatus: string;
  paymentTime: string;
  paymentId?: string;
}

/**
 * Creates Nodemailer Transporter if SMTP credentials exist in environment.
 */
function getEmailTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  const user = process.env.SMTP_USER || process.env.ADMIN_EMAIL;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Generate HTML Email for Customer Order Lifecycles
 */
export function generateCustomerOrderEmailHtml(data: CustomerOrderEmailData): string {
  const stage = data.stage || "ORDER_CONFIRMED";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dd360health.com";

  const isCod = data.paymentStatus.toLowerCase().includes("pending") || data.paymentStatus.toLowerCase().includes("cod");

  const stageTitles: Record<OrderLifecycleStage, { subject: string; badge: string; heading: string; message: string }> = {
    ORDER_CONFIRMED: isCod ? {
      subject: `Your Cash on Delivery Order has been Placed - Order #${data.orderId}`,
      badge: "📦 CASH ON DELIVERY ORDER PLACED",
      heading: "Your Cash on Delivery Order has been Placed",
      message: "Your order has been placed successfully. Please keep the payable amount ready at the time of delivery. We will begin processing your order shortly.",
    } : {
      subject: `Your Order has been Confirmed - Order #${data.orderId}`,
      badge: "✓ PAYMENT SUCCESSFUL & ORDER CONFIRMED",
      heading: "Your Order has been Confirmed",
      message: "Your payment has been received successfully. We have started processing your order.",
    },
    ORDER_PROCESSING: {
      subject: `⚙️ Order #${data.orderId} is Now Processing - Dermadental 360`,
      badge: "⚙️ ORDER PROCESSING",
      heading: "Your order is being processed",
      message: "Your order details have been verified and products are currently being packed by our pharmacy team.",
    },
    ORDER_PACKED: {
      subject: `📦 Order #${data.orderId} is Packed & Ready - Dermadental 360`,
      badge: "📦 ORDER PACKED",
      heading: "Your package is ready",
      message: "Your order has been packed and handed over to our logistics partner for pickup.",
    },
    ORDER_SHIPPED: {
      subject: `🚚 Order #${data.orderId} Has Been Shipped - Dermadental 360`,
      badge: "🚚 ORDER SHIPPED",
      heading: "Your order is on the way!",
      message: "Your shipment has been dispatched. You can track your order using your order reference.",
    },
    OUT_FOR_DELIVERY: {
      subject: `🛵 Order #${data.orderId} Out for Delivery - Dermadental 360`,
      badge: "🛵 OUT FOR DELIVERY",
      heading: "Delivering to your doorstep today!",
      message: "Our courier executive is out for delivery with your parcel.",
    },
    DELIVERED: {
      subject: `✨ Order #${data.orderId} Delivered - Dermadental 360`,
      badge: "✨ DELIVERED",
      heading: "Order Delivered Successfully",
      message: "Your order has been delivered. Thank you for choosing DermaDental 360!",
    },
    CANCELLED: {
      subject: `❌ Order #${data.orderId} Cancellation Notice - Dermadental 360`,
      badge: "❌ ORDER CANCELLED",
      heading: "Order Cancelled",
      message: "Your order has been cancelled. Any debited amount will be refunded to your original payment method.",
    },
    REFUNDED: {
      subject: `💳 Refund Processed for Order #${data.orderId} - Dermadental 360`,
      badge: "💳 REFUND PROCESSED",
      heading: "Refund Issued",
      message: "Your refund of ₹" + data.total + " has been successfully processed to your account.",
    },
  };

  const config = stageTitles[stage];

  const itemsSubtotal = data.subtotal || data.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shippingInfo = calculateShippingDetails(itemsSubtotal);
  const finalShippingCharge = data.shippingCharge !== undefined ? data.shippingCharge : shippingInfo.shippingCharge;
  const shippingDisplay = finalShippingCharge === 0 ? "FREE" : `₹${finalShippingCharge}`;

  const itemsHtml = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px 16px; font-size: 14px; color: #1e293b; border-bottom: 1px solid #f1f5f9;">
        <strong>${item.name}</strong>
      </td>
      <td style="padding: 12px 16px; font-size: 14px; color: #475569; border-bottom: 1px solid #f1f5f9; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 12px 16px; font-size: 14px; color: #1e293b; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600;">
        ₹${(item.price * item.quantity).toLocaleString("en-IN")}
      </td>
    </tr>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          
          <!-- Header Branding -->
          <tr>
            <td style="background-color: #2d5a27; padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">
                DermaDental 360
              </h1>
              <p style="color: #cbd5e1; margin: 4px 0 0 0; font-size: 13px;">
                Advanced Dermatology & Dental Care by ${clinic.doctor}
              </p>
            </td>
          </tr>

          <!-- Success Status Badge -->
          <tr>
            <td style="padding: 24px 24px 12px 24px; text-align: center;">
              <div style="display: inline-block; background-color: #dcfce7; color: #15803d; font-size: 12px; font-weight: 700; padding: 6px 16px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">
                ${config.badge}
              </div>
              <h2 style="margin: 16px 0 6px 0; font-size: 22px; color: #0f172a;">
                ${config.heading}
              </h2>
              <p style="margin: 0; font-size: 15px; color: #475569; line-height: 1.5;">
                Hello <strong>${data.customerName}</strong>, ${config.message}
              </p>
            </td>
          </tr>

          <!-- Order & Payment Metadata Card -->
          <tr>
            <td style="padding: 16px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 8px; padding: 16px; border: 1px solid #e2e8f0;">
                <tr>
                  <td width="50%" style="font-size: 13px; color: #64748b; padding-bottom: 8px;">
                    Order Reference:<br>
                    <strong style="font-size: 15px; color: #0f172a;">${data.orderId}</strong>
                  </td>
                  <td width="50%" style="font-size: 13px; color: #64748b; padding-bottom: 8px; text-align: right;">
                    Payment Status:<br>
                    <strong style="font-size: 15px; color: #16a34a;">${data.paymentStatus}</strong>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="font-size: 13px; color: #64748b;">
                    Payment ID:<br>
                    <strong style="font-size: 14px; color: #0f172a;">${data.paymentId || "N/A"}</strong>
                  </td>
                  <td width="50%" style="font-size: 13px; color: #64748b; text-align: right;">
                    Order Date:<br>
                    <strong style="font-size: 14px; color: #0f172a;">${data.paymentTime}</strong>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Shipping Address Section -->
          <tr>
            <td style="padding: 0 24px 16px 24px;">
              <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">
                  Shipping Address
                </h3>
                <p style="margin: 0; font-size: 14px; color: #1e293b; line-height: 1.5;">
                  <strong>${data.customerName}</strong><br>
                  ${data.customerAddress}<br>
                  📞 Phone: ${data.customerPhone}
                </p>
              </div>
            </td>
          </tr>

          <!-- Products & Breakdown Table -->
          <tr>
            <td style="padding: 0 24px 16px 24px;">
              <h3 style="margin: 0 0 12px 0; font-size: 15px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
                Order Summary
              </h3>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                <thead>
                  <tr style="background-color: #f1f5f9;">
                    <th align="left" style="padding: 10px 16px; font-size: 12px; color: #64748b; text-transform: uppercase;">Product</th>
                    <th align="center" style="padding: 10px 16px; font-size: 12px; color: #64748b; text-transform: uppercase;">Qty</th>
                    <th align="right" style="padding: 10px 16px; font-size: 12px; color: #64748b; text-transform: uppercase;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" align="left" style="padding: 10px 16px; font-size: 14px; color: #64748b; border-top: 1px solid #e2e8f0;">
                      Subtotal:
                    </td>
                    <td align="right" style="padding: 10px 16px; font-size: 14px; font-weight: 600; color: #0f172a; border-top: 1px solid #e2e8f0;">
                      ₹${itemsSubtotal.toLocaleString("en-IN")}
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" align="left" style="padding: 10px 16px; font-size: 14px; color: #64748b;">
                      Shipping Charge:
                    </td>
                    <td align="right" style="padding: 10px 16px; font-size: 14px; font-weight: 700; color: ${finalShippingCharge === 0 ? "#16a34a" : "#0f172a"};">
                      ${shippingDisplay}
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" align="left" style="padding: 14px 16px; font-size: 16px; font-weight: 700; color: #0f172a; border-top: 2px solid #e2e8f0;">
                      Grand Total Paid:
                    </td>
                    <td align="right" style="padding: 14px 16px; font-size: 18px; font-weight: 800; color: #2d5a27; border-top: 2px solid #e2e8f0;">
                      ₹${data.total.toLocaleString("en-IN")}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </td>
          </tr>

          <!-- Estimated Delivery Notice -->
          <tr>
            <td style="padding: 0 24px 24px 24px;">
              <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px; font-size: 14px; color: #1e40af; text-align: center;">
                🚚 <strong>Estimated Delivery:</strong> 2 - 4 business days. Track status under <a href="${appUrl}/track-order?id=${data.orderId}" style="color: #1d4ed8; font-weight: 600; text-decoration: underline;">Track Order</a>.
              </div>
            </td>
          </tr>

          <!-- Footer Contact Info -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 13px; color: #64748b;">
              <p style="margin: 0 0 8px 0; font-weight: 600; color: #0f172a;">DermaDental 360 Clinic</p>
              <p style="margin: 0 0 6px 0;">${clinic.address}</p>
              <p style="margin: 0 0 12px 0;">Phone / WhatsApp: ${clinic.phone}</p>
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                &copy; ${new Date().getFullYear()} DermaDental 360. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Generate HTML Email for Admin Order Alerts
 */
export function generateAdminOrderEmailHtml(data: AdminOrderEmailData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dd360health.com";
  const itemsSubtotal = data.subtotal || data.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shippingInfo = calculateShippingDetails(itemsSubtotal);
  const finalShippingCharge = data.shippingCharge !== undefined ? data.shippingCharge : shippingInfo.shippingCharge;
  const shippingDisplay = finalShippingCharge === 0 ? "FREE" : `₹${finalShippingCharge}`;

  const itemsHtml = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px 14px; font-size: 14px; color: #1e293b; border-bottom: 1px solid #f1f5f9;">
        <strong>${item.name}</strong>
      </td>
      <td style="padding: 10px 14px; font-size: 14px; color: #475569; border-bottom: 1px solid #f1f5f9; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 10px 14px; font-size: 14px; color: #1e293b; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600;">
        ₹${(item.price * item.quantity).toLocaleString("en-IN")}
      </td>
    </tr>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🛒 New Paid Order Received - #${data.orderId}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          
          <td style="background-color: #0f172a; padding: 20px; text-align: center;">
            <h1 style="color: #4ade80; margin: 0; font-size: 20px; font-weight: 800;">
              🛒 NEW PAID ORDER RECEIVED
            </h1>
            <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">
              DermaDental 360 Admin Alert
            </p>
          </td>

          <tr>
            <td style="padding: 20px 24px;">
              <p style="font-size: 16px; margin: 0 0 16px 0;">
                A new order of <strong>₹${data.total.toLocaleString("en-IN")}</strong> has been successfully paid and verified.
              </p>

              <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; color: #64748b;">Customer Information</h3>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Name:</strong> ${data.customerName}</p>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Phone:</strong> ${data.customerPhone}</p>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Email:</strong> ${data.customerEmail || "Not provided"}</p>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Address:</strong> ${data.customerAddress}</p>
              </div>

              <h3 style="margin: 0 0 10px 0; font-size: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">Items Purchased</h3>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 16px;">
                <thead>
                  <tr style="background-color: #f8fafc;">
                    <th align="left" style="padding: 8px 12px; font-size: 12px; color: #64748b;">ITEM</th>
                    <th align="center" style="padding: 8px 12px; font-size: 12px; color: #64748b;">QTY</th>
                    <th align="right" style="padding: 8px 12px; font-size: 12px; color: #64748b;">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" align="left" style="padding: 8px 12px; font-size: 13px; color: #64748b;">Subtotal:</td>
                    <td align="right" style="padding: 8px 12px; font-size: 13px; font-weight: 600;">₹${itemsSubtotal.toLocaleString("en-IN")}</td>
                  </tr>
                  <tr>
                    <td colspan="2" align="left" style="padding: 8px 12px; font-size: 13px; color: #64748b;">Shipping:</td>
                    <td align="right" style="padding: 8px 12px; font-size: 13px; font-weight: 700; color: ${finalShippingCharge === 0 ? "#16a34a" : "#0f172a"};">${shippingDisplay}</td>
                  </tr>
                  <tr>
                    <td colspan="2" align="left" style="padding: 12px; font-size: 15px; font-weight: 700; border-top: 2px solid #e2e8f0;">Grand Total Paid:</td>
                    <td align="right" style="padding: 12px; font-size: 16px; font-weight: 800; color: #2d5a27; border-top: 2px solid #e2e8f0;">₹${data.total.toLocaleString("en-IN")}</td>
                  </tr>
                </tfoot>
              </table>

              <div style="text-align: center; margin-top: 24px;">
                <a href="${appUrl}/admin/orders?search=${data.orderId}" style="display: inline-block; background-color: #2d5a27; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px;">
                  View Order in Admin Dashboard →
                </a>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Asynchronously dispatches Customer Order Confirmation Email without blocking payment thread.
 */
export async function sendCustomerOrderEmail(data: CustomerOrderEmailData): Promise<boolean> {
  if (!data.customerEmail || !data.customerEmail.includes("@")) {
    console.log(`[CUSTOMER EMAIL SKIPPED] Customer did not provide a valid email address for Order #${data.orderId}.`);
    return false;
  }

  const stage = data.stage || "ORDER_CONFIRMED";
  const htmlContent = generateCustomerOrderEmailHtml(data);

  try {
    const transporter = getEmailTransporter();
    if (transporter) {
      const fromAddress = process.env.SMTP_USER || process.env.ADMIN_EMAIL || "dd360health@gmail.com";
      await transporter.sendMail({
        from: `"DermaDental 360" <${fromAddress}>`,
        to: data.customerEmail,
        subject: `🎉 Your Dermadental 360 Order is Confirmed - Order #${data.orderId}`,
        html: htmlContent,
      });
      console.log(`[CUSTOMER EMAIL SENT VIA SMTP] Sent to ${data.customerEmail}`);
    } else {
      console.log(`[CUSTOMER EMAIL DISPATCH LOG] To ${data.customerEmail} (SMTP_PASS not set in env)\nSubject: 🎉 Your Dermadental 360 Order is Confirmed - #${data.orderId}\nHTML length: ${htmlContent.length} bytes`);
    }

    await logAction(
      "Customer Order Email Dispatched",
      `Order #${data.orderId} (${stage}) confirmation email sent to ${data.customerEmail}. Total: ₹${data.total}`
    );

    return true;
  } catch (err: any) {
    console.error(`[CUSTOMER EMAIL ERROR] Failed to send email to ${data.customerEmail}:`, err?.message || err);
    return false;
  }
}

/**
 * Sends an Admin Order Paid email notification.
 */
export async function sendAdminOrderEmail(data: AdminOrderEmailData): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL || "dd360health@gmail.com";
  const htmlContent = generateAdminOrderEmailHtml(data);
  const emailSubject = `🛒 NEW PAID ORDER: #${data.orderId} - ₹${data.total} by ${data.customerName}`;

  try {
    const transporter = getEmailTransporter();
    if (transporter) {
      const fromAddress = process.env.SMTP_USER || adminEmail;
      await transporter.sendMail({
        from: `"DermaDental 360 Alerts" <${fromAddress}>`,
        to: adminEmail,
        subject: emailSubject,
        html: htmlContent,
      });
      console.log(`[ADMIN EMAIL SENT VIA SMTP] Sent to ${adminEmail}`);
    } else {
      console.log(`[ADMIN EMAIL DISPATCH LOG] To ${adminEmail} (SMTP_PASS not set in env)\nSubject: ${emailSubject}\nHTML length: ${htmlContent.length} bytes`);
    }

    await logAction(
      "Admin Order Email Triggered",
      `Order #${data.orderId} email notification dispatched for ${adminEmail}. Grand Total: ₹${data.total}`
    );

    return true;
  } catch (err: any) {
    console.error(`[ADMIN EMAIL ERROR] Failed to send admin alert email to ${adminEmail}:`, err?.message || err);
    return false;
  }
}
