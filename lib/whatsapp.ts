import { prisma } from "./prisma";
import { getAllSettings } from "./settings";

export type WhatsAppProvider = "META" | "TWILIO" | "CUSTOM_WEBHOOK";

export interface SendWhatsAppParams {
  recipientPhone: string;
  recipientName?: string;
  message: string;
  templateName?: string;
  orderId?: string;
}

/**
 * Format phone number to clean international E.164 format without + or spaces
 */
export function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    cleaned = "91" + cleaned; // Default to India country code if 10 digits
  }
  return cleaned;
}

/**
 * Send WhatsApp Message via configured provider (Meta Cloud API, Twilio, or Custom Webhook)
 */
export async function sendWhatsAppMessage(params: SendWhatsAppParams): Promise<{ success: boolean; error?: string }> {
  const settings = await getAllSettings();
  const provider = (settings["whatsapp_provider"] || "META") as WhatsAppProvider;
  const phoneNumberId = settings["whatsapp_phone_number_id"] || "";
  const accessToken = settings["whatsapp_access_token"] || "";
  const webhookUrl = settings["whatsapp_webhook_url"] || "";

  const formattedPhone = formatPhoneNumber(params.recipientPhone);
  let status = "SENT";
  let errorMessage: string | undefined = undefined;

  try {
    if (provider === "META") {
      if (!phoneNumberId || !accessToken) {
        throw new Error("Meta WhatsApp Cloud API credentials (Phone Number ID / Access Token) are missing.");
      }

      const metaUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
      const response = await fetch(metaUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: formattedPhone,
          type: "text",
          text: { body: params.message },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || "Meta WhatsApp API request failed");
      }
    } else if (provider === "TWILIO") {
      const accountSid = settings["whatsapp_business_account_id"] || "";
      const authToken = accessToken;
      const fromPhone = phoneNumberId; // e.g. whatsapp:+14155238886

      if (!accountSid || !authToken || !fromPhone) {
        throw new Error("Twilio WhatsApp credentials (Account SID / Auth Token / From Number) missing.");
      }

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const authHeader = "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64");
      
      const formData = new URLSearchParams();
      formData.append("From", fromPhone.startsWith("whatsapp:") ? fromPhone : `whatsapp:+${fromPhone}`);
      formData.append("To", `whatsapp:+${formattedPhone}`);
      formData.append("Body", params.message);

      const response = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Twilio WhatsApp API failed");
      }
    } else if (provider === "CUSTOM_WEBHOOK") {
      if (!webhookUrl) {
        throw new Error("Custom Webhook URL is missing.");
      }

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: formattedPhone,
          name: params.recipientName,
          message: params.message,
          orderId: params.orderId,
          template: params.templateName,
        }),
      });

      if (!response.ok) {
        throw new Error(`Custom webhook returned HTTP ${response.status}`);
      }
    }

    // Log success in DB
    await prisma.whatsAppLog.create({
      data: {
        recipientPhone: formattedPhone,
        recipientName: params.recipientName || null,
        templateName: params.templateName || "custom",
        message: params.message,
        status: "SENT",
        orderId: params.orderId || null,
      },
    });

    return { success: true };
  } catch (err: any) {
    status = "FAILED";
    errorMessage = err.message || "Unknown error";

    // Log failure in DB
    try {
      await prisma.whatsAppLog.create({
        data: {
          recipientPhone: formattedPhone,
          recipientName: params.recipientName || null,
          templateName: params.templateName || "custom",
          message: params.message,
          status: "FAILED",
          orderId: params.orderId || null,
          errorMessage,
        },
      });
    } catch (logErr) {
      console.error("Failed to write WhatsApp error log:", logErr);
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Dispatch Admin WhatsApp notification when a new order is placed
 */
export async function sendAdminNewOrderWhatsApp(order: {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  customerAddress: string;
  total: number;
  paymentMethod: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  createdAt?: Date | string;
}) {
  const settings = await getAllSettings();
  if (settings["whatsapp_enable_new_order"] !== "true") return;

  const adminNumbersRaw = settings["whatsapp_admin_numbers"] || settings["support_phone"] || "9833699887";
  const numbers = adminNumbersRaw.split(",").map((n) => n.trim()).filter(Boolean);

  const orderTime = order.createdAt ? new Date(order.createdAt).toLocaleString("en-IN") : new Date().toLocaleString("en-IN");
  const itemList = order.items.map((i) => `• ${i.name} x${i.quantity} (₹${i.price})`).join("\n");

  const message = `🛍️ *NEW ORDER PLACED #${order.id}*\n\n` +
    `👤 *Customer Name:* ${order.customerName}\n` +
    `📞 *Phone:* ${order.customerPhone}\n` +
    `✉️ *Email:* ${order.customerEmail || "N/A"}\n` +
    `🏠 *Address:* ${order.customerAddress}\n\n` +
    `📋 *Products Ordered:*\n${itemList}\n\n` +
    `💰 *Total Amount:* ₹${order.total.toLocaleString("en-IN")}\n` +
    `💳 *Payment Method:* ${order.paymentMethod}\n` +
    `⏰ *Order Time:* ${orderTime}\n\n` +
    `DermaDental 360 Admin System`;

  for (const phone of numbers) {
    await sendWhatsAppMessage({
      recipientPhone: phone,
      recipientName: "Admin",
      message,
      templateName: "admin_new_order",
      orderId: order.id,
    });
  }
}

/**
 * Dispatch Customer WhatsApp notification based on Order Status
 */
export async function sendCustomerOrderStatusWhatsApp(order: {
  id: string;
  customerName: string;
  customerPhone: string;
  total: number;
  trackingNumber?: string | null;
}, status: string) {
  const settings = await getAllSettings();
  const upperStatus = status.toUpperCase();

  const toggleKeyMap: Record<string, string> = {
    CONFIRMED: "whatsapp_enable_payment_success",
    PACKED: "whatsapp_enable_order_packed",
    SHIPPED: "whatsapp_enable_order_shipped",
    OUT_FOR_DELIVERY: "whatsapp_enable_out_for_delivery",
    DELIVERED: "whatsapp_enable_delivered",
    CANCELLED: "whatsapp_enable_cancelled",
    REFUNDED: "whatsapp_enable_refunded",
  };

  const toggleKey = toggleKeyMap[upperStatus];
  if (toggleKey && settings[toggleKey] === "false") {
    return { success: false, reason: "Notification disabled in Admin settings" };
  }

  let message = "";
  switch (upperStatus) {
    case "CONFIRMED":
      message = `Hello ${order.customerName},\n\nYour order *#${order.id}* worth ₹${order.total.toLocaleString("en-IN")} has been *CONFIRMED* and is now being processed!\n\nThank you for shopping with DermaDental 360.`;
      break;
    case "PACKED":
      message = `Hello ${order.customerName},\n\nGood news! Your order *#${order.id}* has been *PACKED* with care and is ready for dispatch.\n\nDermaDental 360`;
      break;
    case "SHIPPED":
      message = `Hello ${order.customerName},\n\nYour order *#${order.id}* has been *SHIPPED*! ${order.trackingNumber ? `Tracking No: ${order.trackingNumber}` : ""}\n\nYou can track your shipment anytime on our website.\n\nDermaDental 360`;
      break;
    case "OUT_FOR_DELIVERY":
      message = `Hello ${order.customerName},\n\nYour package for order *#${order.id}* is *OUT FOR DELIVERY* today! Please keep your phone handy.\n\nDermaDental 360`;
      break;
    case "DELIVERED":
      message = `Hello ${order.customerName},\n\nYour order *#${order.id}* has been *DELIVERED* successfully! 🎉 We hope you enjoy your products.\n\nDermaDental 360`;
      break;
    case "CANCELLED":
      message = `Hello ${order.customerName},\n\nYour order *#${order.id}* has been *CANCELLED*. If you have questions, please reach out to support.\n\nDermaDental 360`;
      break;
    case "REFUNDED":
      message = `Hello ${order.customerName},\n\nA refund for your order *#${order.id}* has been processed successfully.\n\nDermaDental 360`;
      break;
    default:
      message = `Hello ${order.customerName},\n\nUpdate regarding your order *#${order.id}*: Status is now *${status}*.\n\nDermaDental 360`;
  }

  return sendWhatsAppMessage({
    recipientPhone: order.customerPhone,
    recipientName: order.customerName,
    message,
    templateName: `status_${upperStatus.toLowerCase()}`,
    orderId: order.id,
  });
}

/**
 * Send Abandoned Cart Reminder WhatsApp
 */
export async function sendAbandonedCartWhatsApp(cart: {
  customerName?: string | null;
  phone: string;
  cartValue: number;
  items: any;
}) {
  const settings = await getAllSettings();
  if (settings["whatsapp_enable_abandoned_cart"] === "false") return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dd360health.com";
  const name = cart.customerName || "Valued Customer";

  const message = `Hi ${name},\n\nYou left some dermatologist-curated products in your cart (Total: ₹${cart.cartValue.toLocaleString("en-IN")}).\n\nComplete your checkout now before stocks run out:\n${appUrl}/checkout\n\nNeed assistance? Reply to this message directly.\n\nDermaDental 360`;

  return sendWhatsAppMessage({
    recipientPhone: cart.phone,
    recipientName: name,
    message,
    templateName: "abandoned_cart_reminder",
  });
}
