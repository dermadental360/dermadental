import { prisma } from "./prisma";
import { broadcastAdminEvent } from "./eventBus";

export type NotificationCategory =
  | "ORDERS"
  | "SALES"
  | "REVIEWS"
  | "CUSTOMERS"
  | "INVENTORY"
  | "INQUIRIES"
  | "PRODUCTS"
  | "COUPONS"
  | "SYSTEM"
  | "ADMIN";

export type NotificationPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface CreateNotificationParams {
  title: string;
  message: string;
  category: NotificationCategory;
  priority?: NotificationPriority;
  orderId?: string;
  relatedId?: string;
  relatedType?: string;
  link?: string;
  createdBy?: string;
  metadata?: any;
}

export async function createNotification(params: CreateNotificationParams) {
  const {
    title,
    message,
    category,
    priority = "MEDIUM",
    orderId,
    relatedId,
    relatedType,
    link,
    createdBy,
    metadata
  } = params;

  try {
    // Check Admin Preferences before sending
    const prefs = await prisma.notificationPreference.findFirst({
      where: { adminEmail: "admin" }
    });

    if (prefs) {
      const categoryMap: Record<NotificationCategory, boolean> = {
        ORDERS: prefs.enableOrders,
        SALES: prefs.enableSales,
        REVIEWS: prefs.enableReviews,
        CUSTOMERS: prefs.enableCustomers,
        INVENTORY: prefs.enableInventory,
        INQUIRIES: prefs.enableInquiries,
        PRODUCTS: prefs.enableProducts,
        COUPONS: prefs.enableSales,
        SYSTEM: prefs.enableSystemAlerts,
        ADMIN: prefs.enableAdminActivity
      };

      if (categoryMap[category] === false) {
        // Muted by admin preference settings
        return null;
      }
    }

    // Map DB NotificationType enum
    let typeEnum: "ORDER" | "PAYMENT" | "INVENTORY" | "SYSTEM" | "SALES" | "REVIEWS" | "CUSTOMERS" | "PRODUCTS" | "COUPONS" | "ADMIN" = "SYSTEM";
    if (category === "ORDERS") typeEnum = "ORDER";
    else if (category === "SALES") typeEnum = "SALES";
    else if (category === "INVENTORY") typeEnum = "INVENTORY";
    else if (category === "REVIEWS") typeEnum = "REVIEWS";
    else if (category === "CUSTOMERS") typeEnum = "CUSTOMERS";
    else if (category === "PRODUCTS") typeEnum = "PRODUCTS";
    else if (category === "COUPONS") typeEnum = "COUPONS";
    else if (category === "ADMIN") typeEnum = "ADMIN";

    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        category,
        priority,
        type: typeEnum,
        orderId: orderId || null,
        relatedId: relatedId || null,
        relatedType: relatedType || null,
        link: link || null,
        createdBy: createdBy || null,
        metadata: metadata ? metadata : undefined,
        isRead: false
      }
    });

    // Broadcast SSE Event instantly
    try {
      broadcastAdminEvent("NOTIFICATION_NEW", notification);
    } catch {}

    return notification;
  } catch (err) {
    console.warn("Failed to save DB notification:", err);
    // Broadcast fallback object so real-time UI still triggers
    const fallbackNotif = {
      id: "notif-" + Date.now(),
      title,
      message,
      category,
      priority,
      link: link || null,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    try {
      broadcastAdminEvent("NOTIFICATION_NEW", fallbackNotif);
    } catch {}
    return fallbackNotif;
  }
}
