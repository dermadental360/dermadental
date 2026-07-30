import { prisma } from "./prisma";
import { sendAbandonedCartWhatsApp } from "./whatsapp";
import { sendAbandonedCartEmail } from "./email";
import { getAllSettings } from "./settings";

export interface AbandonedCartInput {
  sessionId: string;
  customerName?: string;
  email?: string;
  phone?: string;
  items: any[];
  cartValue: number;
}

/**
 * Record or update customer cart state in PostgreSQL
 */
export async function saveOrUpdateAbandonedCart(input: AbandonedCartInput) {
  if (!input.sessionId || !input.items || input.items.length === 0) return null;

  try {
    const existing = await prisma.abandonedCart.findUnique({
      where: { sessionId: input.sessionId },
    });

    if (existing) {
      if (existing.recovered) return existing; // Already completed checkout

      return await prisma.abandonedCart.update({
        where: { sessionId: input.sessionId },
        data: {
          customerName: input.customerName || existing.customerName,
          email: input.email || existing.email,
          phone: input.phone || existing.phone,
          items: input.items,
          cartValue: input.cartValue,
          lastActivity: new Date(),
        },
      });
    } else {
      return await prisma.abandonedCart.create({
        data: {
          sessionId: input.sessionId,
          customerName: input.customerName || null,
          email: input.email || null,
          phone: input.phone || null,
          items: input.items,
          cartValue: input.cartValue,
          lastActivity: new Date(),
        },
      });
    }
  } catch (err) {
    console.error("Error saving abandoned cart:", err);
    return null;
  }
}

/**
 * Automatically mark abandoned cart as RECOVERED upon successful checkout
 */
export async function markCartRecovered(sessionId?: string, email?: string, phone?: string, orderId?: string) {
  try {
    if (sessionId) {
      await prisma.abandonedCart.updateMany({
        where: { sessionId },
        data: { recovered: true, recoveredOrderId: orderId },
      });
    }

    if (email) {
      await prisma.abandonedCart.updateMany({
        where: { email: { equals: email, mode: "insensitive" }, recovered: false },
        data: { recovered: true, recoveredOrderId: orderId },
      });
    }

    if (phone) {
      await prisma.abandonedCart.updateMany({
        where: { phone, recovered: false },
        data: { recovered: true, recoveredOrderId: orderId },
      });
    }
  } catch (err) {
    console.error("Error marking cart recovered:", err);
  }
}

/**
 * Process automated recovery notifications based on timer configuration (30m, 1h, 6h, 24h)
 */
export async function processAbandonedCartReminders() {
  const settings = await getAllSettings();
  const timerMinutes = parseInt(settings["abandoned_cart_timer"] || "60", 10);
  const cutoffTime = new Date(Date.now() - timerMinutes * 60 * 1000);

  const pendingCarts = await prisma.abandonedCart.findMany({
    where: {
      recovered: false,
      lastActivity: { lte: cutoffTime },
      OR: [{ whatsappSent: false }, { emailSent: false }],
    },
    take: 20,
  });

  let whatsappCount = 0;
  let emailCount = 0;

  for (const cart of pendingCarts) {
    // Send WhatsApp reminder
    if (!cart.whatsappSent && cart.phone) {
      const res = await sendAbandonedCartWhatsApp({
        customerName: cart.customerName,
        phone: cart.phone,
        cartValue: cart.cartValue,
        items: cart.items,
      });

      if (res?.success) {
        whatsappCount++;
        await prisma.abandonedCart.update({
          where: { id: cart.id },
          data: { whatsappSent: true, whatsappSentAt: new Date() },
        });
      }
    }

    // Send Email reminder
    if (!cart.emailSent && cart.email) {
      const res = await sendAbandonedCartEmail({
        customerName: cart.customerName || "Customer",
        email: cart.email,
        cartValue: cart.cartValue,
        items: (cart.items as any[]) || [],
      });

      if (res) {
        emailCount++;
        await prisma.abandonedCart.update({
          where: { id: cart.id },
          data: { emailSent: true, emailSentAt: new Date() },
        });
      }
    }
  }

  return { processed: pendingCarts.length, whatsappCount, emailCount };
}
