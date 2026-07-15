import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fallbackStore } from "@/lib/fallbackStore";

type Period = "daily" | "weekly" | "monthly" | "yearly";

// Statuses that count as revenue
const REVENUE_STATUSES = ["Completed", "Delivered", "Paid", "Processing", "New"];

function formatLabel(date: Date, period: Period): string {
  if (period === "daily") {
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  }
  if (period === "weekly") {
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  }
  if (period === "monthly") {
    return date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
  }
  // yearly
  return String(date.getFullYear());
}

function getBucketKey(date: Date, period: Period): string {
  if (period === "daily") {
    // Each of the last 30 days
    return date.toISOString().slice(0, 10); // YYYY-MM-DD
  }
  if (period === "weekly") {
    // Each of the last 12 weeks — bucket by week start (Monday)
    const d = new Date(date);
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    d.setDate(d.getDate() + diff);
    return d.toISOString().slice(0, 10);
  }
  if (period === "monthly") {
    return date.toISOString().slice(0, 7); // YYYY-MM
  }
  // yearly
  return String(date.getFullYear());
}

interface Bucket {
  label: string;
  revenue: number;
}

function buildBuckets(period: Period): Map<string, Bucket> {
  const now = new Date();
  const map = new Map<string, Bucket>();

  if (period === "daily") {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString().slice(0, 10);
      map.set(key, { label: formatLabel(d, period), revenue: 0 });
    }
  } else if (period === "weekly") {
    // Last 12 weeks
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      // Align to week start (Monday)
      const day = d.getDay();
      const diff = (day === 0 ? -6 : 1) - day;
      d.setDate(d.getDate() + diff);
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString().slice(0, 10);
      if (!map.has(key)) {
        map.set(key, { label: formatLabel(d, period), revenue: 0 });
      }
    }
  } else if (period === "monthly") {
    // Last 12 months
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      map.set(key, { label: formatLabel(d, period), revenue: 0 });
    }
  } else {
    // yearly: last 5 years
    for (let i = 4; i >= 0; i--) {
      const year = now.getFullYear() - i;
      const key = String(year);
      map.set(key, { label: key, revenue: 0 });
    }
  }

  return map;
}

function getPeriodRange(period: Period): { current: [Date, Date]; previous: [Date, Date] } {
  const now = new Date();
  const end = new Date(now);
  let currentStart: Date;
  let previousStart: Date;
  let previousEnd: Date;

  if (period === "daily") {
    currentStart = new Date(now);
    currentStart.setDate(currentStart.getDate() - 29);
    currentStart.setHours(0, 0, 0, 0);
    previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - 30);
    previousEnd = new Date(currentStart);
    previousEnd.setMilliseconds(-1);
  } else if (period === "weekly") {
    currentStart = new Date(now);
    currentStart.setDate(currentStart.getDate() - 83); // ~12 weeks
    currentStart.setHours(0, 0, 0, 0);
    previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - 84);
    previousEnd = new Date(currentStart);
    previousEnd.setMilliseconds(-1);
  } else if (period === "monthly") {
    currentStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    previousStart = new Date(now.getFullYear(), now.getMonth() - 23, 1);
    previousEnd = new Date(currentStart);
    previousEnd.setMilliseconds(-1);
  } else {
    currentStart = new Date(now.getFullYear() - 4, 0, 1);
    previousStart = new Date(now.getFullYear() - 9, 0, 1);
    previousEnd = new Date(currentStart);
    previousEnd.setMilliseconds(-1);
  }

  return {
    current: [currentStart, end],
    previous: [previousStart, previousEnd]
  };
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period: Period = (searchParams.get("period") as Period) || "monthly";

  try {
    const { current, previous } = getPeriodRange(period);

    // Fetch all non-cancelled orders in a wide window covering both periods
    const allOrders = await prisma.order.findMany({
      where: {
        status: { notIn: ["Cancelled"] },
        createdAt: { gte: previous[0] }
      },
      select: { total: true, status: true, createdAt: true }
    });

    const currentOrders = allOrders.filter(
      o => o.createdAt >= current[0] && o.createdAt <= current[1]
    );
    const previousOrders = allOrders.filter(
      o => o.createdAt >= previous[0] && o.createdAt <= previous[1]
    );

    // Build bucket map and fill with revenue
    const buckets = buildBuckets(period);

    for (const order of currentOrders) {
      const key = getBucketKey(new Date(order.createdAt), period);
      if (buckets.has(key)) {
        buckets.get(key)!.revenue += order.total || 0;
      }
    }

    const labels: string[] = [];
    const data: number[] = [];
    for (const bucket of buckets.values()) {
      labels.push(bucket.label);
      data.push(Math.round(bucket.revenue));
    }

    const total = data.reduce((s, v) => s + v, 0);
    const prevTotal = previousOrders.reduce((s, o) => s + (o.total || 0), 0);
    const changePct =
      prevTotal === 0
        ? total > 0
          ? 100
          : 0
        : Math.round(((total - prevTotal) / prevTotal) * 100);

    return NextResponse.json({ labels, data, total, prevTotal, changePct, period });
  } catch (error: any) {
    console.error("Revenue chart Prisma query failed, using fallback:", error);

    // Fallback using in-memory store
    const orders = fallbackStore.orders.filter(
      (o: any) => o.status !== "Cancelled"
    );

    const { current, previous } = getPeriodRange(period);
    const buckets = buildBuckets(period);

    const currentOrders = orders.filter(
      (o: any) =>
        o.createdAt &&
        new Date(o.createdAt) >= current[0] &&
        new Date(o.createdAt) <= current[1]
    );
    const previousOrders = orders.filter(
      (o: any) =>
        o.createdAt &&
        new Date(o.createdAt) >= previous[0] &&
        new Date(o.createdAt) <= previous[1]
    );

    for (const order of currentOrders) {
      const key = getBucketKey(new Date(order.createdAt), period);
      if (buckets.has(key)) {
        buckets.get(key)!.revenue += order.total || 0;
      }
    }

    const labels: string[] = [];
    const data: number[] = [];
    for (const bucket of buckets.values()) {
      labels.push(bucket.label);
      data.push(Math.round(bucket.revenue));
    }

    const total = data.reduce((s, v) => s + v, 0);
    const prevTotal = previousOrders.reduce((s: number, o: any) => s + (o.total || 0), 0);
    const changePct =
      prevTotal === 0
        ? total > 0
          ? 100
          : 0
        : Math.round(((total - prevTotal) / prevTotal) * 100);

    return NextResponse.json({ labels, data, total, prevTotal, changePct, period });
  }
}
