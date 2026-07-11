import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fallbackStore } from "@/lib/fallbackStore";
import { demoProducts } from "@/lib/demo";

export async function GET() {
  try {
    await requireAdmin();
  } catch (error: any) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const totalProducts = await prisma.product.count();
    const publishedProducts = await prisma.product.count({ where: { published: true } });
    const totalOrders = await prisma.order.count();
    const newOrders = await prisma.order.count({ where: { status: "New" } });
    const completedOrders = await prisma.order.count({ where: { status: "Completed" } });
    const inquiriesCount = await prisma.inquiry.count();
    
    const lowStockCount = await prisma.product.count({ where: { stock: { lt: 10 } } });
    const lowStockProductsRaw = await prisma.product.findMany({
      where: { stock: { lt: 10 } },
      select: { id: true, name: true, brand: true, stock: true, price: true },
      take: 5
    });
    const lowStockProducts = lowStockProductsRaw.map(p => ({ ...p, _id: p.id }));

    const recentOrdersRaw = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5
    });
    const recentOrders = recentOrdersRaw.map(o => ({
      _id: o.id,
      customer: { name: o.customerName },
      total: o.total,
      status: o.status,
      createdAt: o.createdAt.toISOString()
    }));

    const allNonCancelled = await prisma.order.findMany({
      where: { status: { not: "Cancelled" } }
    });

    const totalRevenue = allNonCancelled.reduce((sum, o) => sum + (o.total || 0), 0);
    const nonCancelledCount = allNonCancelled.length;
    const aov = nonCancelledCount > 0 ? Math.round(totalRevenue / nonCancelledCount) : 0;

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const weeklyOrders = allNonCancelled.filter(o => o.createdAt >= weekAgo);
    const monthlyOrders = allNonCancelled.filter(o => o.createdAt >= monthAgo);

    const revenueWeek = weeklyOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const revenueMonth = monthlyOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    const ordersWeek = weeklyOrders.length;
    const ordersMonth = monthlyOrders.length;

    return NextResponse.json({
      totalProducts,
      publishedProducts,
      totalOrders,
      newOrders,
      completedOrders,
      inquiriesCount,
      totalRevenue,
      revenueWeek,
      revenueMonth,
      ordersWeek,
      ordersMonth,
      aov,
      lowStockCount,
      lowStockProducts,
      recentOrders
    });
  } catch (error: any) {
    console.error("Prisma metrics calculation failed, using fallback:", error);
    
    const orders = fallbackStore.orders;
    const nonCancelled = orders.filter((o: any) => o.status !== "Cancelled");
    
    const totalRevenue = nonCancelled.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
    const totalOrders = orders.length;
    const newOrders = orders.filter((o: any) => o.status === "New").length;
    const completedOrders = orders.filter((o: any) => o.status === "Completed").length;
    const nonCancelledCount = nonCancelled.length;
    const aov = nonCancelledCount > 0 ? Math.round(totalRevenue / nonCancelledCount) : 0;

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const weeklyOrders = nonCancelled.filter((o: any) => o.createdAt && new Date(o.createdAt) >= weekAgo);
    const monthlyOrders = nonCancelled.filter((o: any) => o.createdAt && new Date(o.createdAt) >= monthAgo);

    const revenueWeek = weeklyOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
    const revenueMonth = monthlyOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
    const ordersWeek = weeklyOrders.length;
    const ordersMonth = monthlyOrders.length;
    const lowStockProducts = demoProducts.filter((p: any) => p.stock < 10);

    return NextResponse.json({
      totalProducts: demoProducts.length,
      publishedProducts: demoProducts.filter((p: any) => p.published).length,
      totalOrders,
      newOrders,
      completedOrders,
      inquiriesCount: fallbackStore.inquiries.length,
      totalRevenue,
      revenueWeek,
      revenueMonth,
      ordersWeek,
      ordersMonth,
      aov,
      lowStockCount: lowStockProducts.length,
      lowStockProducts: lowStockProducts.slice(0, 5).map((p: any) => ({
        _id: String(p._id),
        name: p.name,
        brand: p.brand,
        stock: p.stock,
        price: p.price
      })),
      recentOrders: orders.slice(-5).reverse().map((o: any) => ({
        _id: String(o._id),
        customer: { name: o.customer?.name || "Guest" },
        total: o.total,
        status: o.status || "New",
        createdAt: o.createdAt
      }))
    });
  }
}
