import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
  } catch (error: any) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Basic entity counts
    const totalProducts = await prisma.product.count();
    const publishedProducts = await prisma.product.count({ where: { published: true } });
    const totalOrders = await prisma.order.count();
    const totalCustomers = await prisma.customer.count();
    const totalReviews = await prisma.review.count();
    const totalVisitors = await prisma.visitor.count();
    const inquiriesCount = await prisma.inquiry.count();

    // 2. Order Status Breakdown
    const pendingOrders = await prisma.order.count({
      where: { status: { in: ["PLACED", "PENDING", "New", "CREATED", "AUTHORIZED"] } }
    });
    const completedOrders = await prisma.order.count({
      where: { status: { in: ["PAID", "COMPLETED", "DELIVERED", "CAPTURED"] } }
    });
    const cancelledOrders = await prisma.order.count({
      where: { status: { in: ["CANCELLED", "FAILED", "REFUNDED"] } }
    });
    const newOrders = pendingOrders;

    // 3. Stock Alerts
    const lowStockCount = await prisma.product.count({ where: { stock: { lt: 10 } } });
    const lowStockProductsRaw = await prisma.product.findMany({
      where: { stock: { lt: 10 } },
      select: { id: true, name: true, brand: true, stock: true, price: true },
      take: 5
    });
    const lowStockProducts = lowStockProductsRaw.map(p => ({
      ...p,
      _id: p.id
    }));

    // 4. Recent Orders Feed
    const recentOrdersRaw = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 10
    });
    const recentOrders = recentOrdersRaw.map(o => ({
      id: o.id,
      _id: o.id,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      customerEmail: o.customerEmail,
      customer: {
        name: o.customerName,
        phone: o.customerPhone,
        email: o.customerEmail
      },
      total: o.total,
      status: o.status,
      createdAt: o.createdAt.toISOString()
    }));

    // 5. Date-filtered Sales & Revenue Calculations
    const allNonCancelledOrders = await prisma.order.findMany({
      where: { status: { notIn: ["CANCELLED", "FAILED", "REFUNDED"] } },
      select: { total: true, createdAt: true, status: true }
    });

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    const todayOrdersList = allNonCancelledOrders.filter(o => o.createdAt >= startOfToday);
    const weeklyOrdersList = allNonCancelledOrders.filter(o => o.createdAt >= weekAgo);
    const monthlyOrdersList = allNonCancelledOrders.filter(o => o.createdAt >= monthAgo);
    const yearlyOrdersList = allNonCancelledOrders.filter(o => o.createdAt >= yearAgo);

    const totalRevenue = allNonCancelledOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const todayRevenue = todayOrdersList.reduce((sum, o) => sum + (o.total || 0), 0);
    const revenueWeek = weeklyOrdersList.reduce((sum, o) => sum + (o.total || 0), 0);
    const revenueMonth = monthlyOrdersList.reduce((sum, o) => sum + (o.total || 0), 0);
    const revenueYear = yearlyOrdersList.reduce((sum, o) => sum + (o.total || 0), 0);

    const ordersToday = todayOrdersList.length;
    const ordersWeek = weeklyOrdersList.length;
    const ordersMonth = monthlyOrdersList.length;
    const ordersYear = yearlyOrdersList.length;

    const nonCancelledCount = allNonCancelledOrders.length;
    const aov = nonCancelledCount > 0 ? Math.round(totalRevenue / nonCancelledCount) : 0;
    const conversionRate = totalVisitors > 0 ? Number(((totalOrders / totalVisitors) * 100).toFixed(2)) : 0;

    // 6. New customers in last 30 days
    const newCustomers = await prisma.customer.count({
      where: { createdAt: { gte: monthAgo } }
    });

    return NextResponse.json({
      totalProducts,
      publishedProducts,
      totalOrders,
      todayOrders: ordersToday,
      ordersToday,
      ordersWeek,
      ordersMonth,
      ordersYear,
      newOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      totalCustomers,
      newCustomers,
      totalReviews,
      totalVisitors,
      inquiriesCount,
      totalRevenue,
      todayRevenue,
      revenueWeek,
      revenueMonth,
      revenueYear,
      revenueAllTime: totalRevenue,
      aov,
      averageOrderValue: aov,
      conversionRate,
      lowStockCount,
      lowStockProducts,
      recentOrders
    });
  } catch (error: any) {
    console.error("GET /api/admin/metrics PostgreSQL error:", error?.message || error);
    return NextResponse.json({ error: "Failed to load dynamic metrics from database." }, { status: 500 });
  }
}
