import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();

    const registeredCustomers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
    });

    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
    });

    const abandonedCarts = await prisma.abandonedCart.findMany();
    const couponUsages = await prisma.couponUsage.findMany();

    const customerMap: Record<
      string,
      {
        id: string;
        name: string;
        email: string;
        phone: string;
        totalSpent: number;
        ordersCount: number;
        averageOrderValue: number;
        lastPurchase: string;
        abandonedCartCount: number;
        couponUsageCount: number;
        purchasedProducts: Record<string, number>;
        createdAt: string;
      }
    > = {};

    // 1. Populate registered customers from Customer table
    for (const c of registeredCustomers) {
      const emailKey = (c.email || "").toLowerCase().trim();
      if (emailKey) {
        customerMap[emailKey] = {
          id: c.id,
          name: c.name || "Customer",
          email: c.email,
          phone: c.phone || "N/A",
          totalSpent: 0,
          ordersCount: 0,
          averageOrderValue: 0,
          lastPurchase: "No Orders",
          abandonedCartCount: 0,
          couponUsageCount: 0,
          purchasedProducts: {},
          createdAt: new Date(c.createdAt).toISOString(),
        };
      }
    }

    // 2. Process orders (including guest buyers and registered buyers)
    for (const order of orders) {
      const emailKey = (order.customerEmail || order.customerPhone || order.customerName).toLowerCase().trim();

      if (!customerMap[emailKey]) {
        customerMap[emailKey] = {
          id: order.id,
          name: order.customerName || "Customer",
          email: order.customerEmail || "N/A",
          phone: order.customerPhone || "N/A",
          totalSpent: 0,
          ordersCount: 0,
          averageOrderValue: 0,
          lastPurchase: new Date(order.createdAt).toISOString(),
          abandonedCartCount: 0,
          couponUsageCount: 0,
          purchasedProducts: {},
          createdAt: new Date(order.createdAt).toISOString(),
        };
      } else if (customerMap[emailKey].lastPurchase === "No Orders") {
        customerMap[emailKey].lastPurchase = new Date(order.createdAt).toISOString();
      }

      const cust = customerMap[emailKey];
      cust.totalSpent += order.total;
      cust.ordersCount += 1;
      if (order.customerName && cust.name === "Customer") cust.name = order.customerName;
      if (order.customerPhone && cust.phone === "N/A") cust.phone = order.customerPhone;

      // Track item frequencies
      const items = (order.items as any[]) || [];
      for (const item of items) {
        const prodName = item.name || "Product";
        cust.purchasedProducts[prodName] = (cust.purchasedProducts[prodName] || 0) + (item.quantity || 1);
      }
    }

    // 3. Attach abandoned cart counts
    for (const cart of abandonedCarts) {
      if (cart.email) {
        const key = cart.email.toLowerCase().trim();
        if (customerMap[key]) {
          customerMap[key].abandonedCartCount += 1;
        }
      }
    }

    // 4. Attach coupon usages
    for (const usage of couponUsages) {
      if (usage.customerEmail) {
        const key = usage.customerEmail.toLowerCase().trim();
        if (customerMap[key]) {
          customerMap[key].couponUsageCount += 1;
        }
      }
    }

    const customersList = Object.values(customerMap).map((c) => {
      c.averageOrderValue = c.ordersCount > 0 ? Math.round((c.totalSpent / c.ordersCount) * 100) / 100 : 0;
      const topProd = Object.entries(c.purchasedProducts).sort((a, b) => b[1] - a[1])[0];
      return {
        ...c,
        mostPurchasedProduct: topProd ? `${topProd[0]} (${topProd[1]}x)` : "N/A",
      };
    });

    const repeatCustomersCount = customersList.filter((c) => c.ordersCount > 1).length;
    const totalCustomersCount = customersList.length;
    const overallTotalRevenue = customersList.reduce((acc, c) => acc + c.totalSpent, 0);
    const overallAOV = orders.length > 0 ? Math.round(overallTotalRevenue / orders.length) : 0;

    return NextResponse.json({
      customers: customersList,
      metrics: {
        totalCustomersCount,
        repeatCustomersCount,
        repeatCustomerRate: totalCustomersCount > 0 ? ((repeatCustomersCount / totalCustomersCount) * 100).toFixed(1) : "0.0",
        overallAOV,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status: 401 });
  }
}
