import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // 1. Today's Revenue & Orders
    const todayOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startOfToday },
        paymentStatus: { in: ["CAPTURED", "PAID", "SUCCESS", "AUTHORIZED", "COMPLETED", "COD_PENDING"] },
      },
    });

    const todaysRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
    const todaysOrdersCount = todayOrders.length;

    // 2. Abandoned Carts & Recovered Carts
    const allCarts = await prisma.abandonedCart.findMany();
    const abandonedCartsCount = allCarts.length;
    const recoveredCartsCount = allCarts.filter((c) => c.recovered).length;
    const recoveryRate = abandonedCartsCount > 0 ? ((recoveredCartsCount / abandonedCartsCount) * 100).toFixed(1) : "0.0";

    // 3. Coupon Usage & Generated Revenue
    const couponUsages = await prisma.couponUsage.findMany();
    const couponUsageCount = couponUsages.length;
    const couponDiscountTotal = couponUsages.reduce((sum, u) => sum + u.discountAmount, 0);

    // 4. WhatsApp Delivery Status logs
    const whatsappLogs = await prisma.whatsAppLog.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
    });
    const whatsappSentCount = whatsappLogs.filter((l) => l.status === "SENT" || l.status === "DELIVERED").length;
    const whatsappFailedCount = whatsappLogs.filter((l) => l.status === "FAILED").length;

    // 5. Top Products Purchased
    const allOrders = await prisma.order.findMany({
      select: { items: true, total: true, customerEmail: true, customerPhone: true, customerName: true },
    });

    const productSalesMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
    for (const order of allOrders) {
      const items = (order.items as any[]) || [];
      for (const item of items) {
        const key = item.productId || item.name;
        if (!productSalesMap[key]) {
          productSalesMap[key] = { name: item.name, quantity: 0, revenue: 0 };
        }
        productSalesMap[key].quantity += item.quantity || 1;
        productSalesMap[key].revenue += (item.price || 0) * (item.quantity || 1);
      }
    }

    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // 6. Top Customers (LTV)
    const customerMap: Record<string, { name: string; email: string; phone: string; totalSpent: number; ordersCount: number }> = {};
    for (const order of allOrders) {
      const key = (order.customerEmail || order.customerPhone || order.customerName).toLowerCase().trim();
      if (!customerMap[key]) {
        customerMap[key] = {
          name: order.customerName,
          email: order.customerEmail || "N/A",
          phone: order.customerPhone,
          totalSpent: 0,
          ordersCount: 0,
        };
      }
      customerMap[key].totalSpent += order.total;
      customerMap[key].ordersCount += 1;
    }

    const topCustomers = Object.values(customerMap)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    // 7. Conversion Rate Calculation (Visitors vs Orders)
    const totalVisitors = await prisma.visitor.count();
    const totalCompletedOrders = allOrders.length;
    const conversionRate = totalVisitors > 0 ? ((totalCompletedOrders / totalVisitors) * 100).toFixed(2) : "100.0";

    return NextResponse.json({
      todaysRevenue,
      todaysOrdersCount,
      abandonedCartsCount,
      recoveredCartsCount,
      recoveryRate,
      couponUsageCount,
      couponDiscountTotal,
      whatsappSentCount,
      whatsappFailedCount,
      topProducts,
      topCustomers,
      conversionRate,
      whatsappLogs: whatsappLogs.slice(0, 10),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status: 401 });
  }
}
