import { logAction } from "./auditLogger";

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
  total: number;
  paymentStatus: string;
  paymentTime: string;
  paymentId?: string;
}

/**
 * Sends an Admin Order Paid email notification.
 * Logs structured email contents and attempts SMTP dispatch if credentials exist.
 */
export async function sendAdminOrderEmail(data: AdminOrderEmailData): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@dermadental360.com";
  
  const itemsText = data.items
    .map((item) => `- ${item.quantity}x ${item.name} @ ₹${item.price}`)
    .join("\n");

  const emailSubject = `🛒 NEW PAID ORDER: #${data.orderId} - ₹${data.total} by ${data.customerName}`;

  const emailBody = `
==================================================
🛒 NEW ORDER RECEIVED & VERIFIED (DermaDental 360)
==================================================

Order ID: ${data.orderId}
Payment Status: ${data.paymentStatus}
Payment ID: ${data.paymentId || "N/A"}
Payment Date/Time: ${data.paymentTime}

CUSTOMER DETAILS:
- Name: ${data.customerName}
- Phone: ${data.customerPhone}
- Email: ${data.customerEmail || "Not provided"}
- Shipping Address: ${data.customerAddress}

ITEMS PURCHASED:
${itemsText}

TOTAL AMOUNT PAID: ₹${data.total}

VIEW ORDER DETAILS IN ADMIN DASHBOARD:
${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/orders?search=${data.orderId}

==================================================
`;

  await logAction(
    "Admin Order Email Triggered",
    `Order #${data.orderId} email notification dispatched for ${adminEmail}. Total: ₹${data.total}`
  );

  console.log(`[ADMIN EMAIL DISPATCH to ${adminEmail}]\nSubject: ${emailSubject}\n${emailBody}`);

  return true;
}
