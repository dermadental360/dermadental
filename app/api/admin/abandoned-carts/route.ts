import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processAbandonedCartReminders } from "@/lib/abandonedCart";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter"); // "recovered" | "pending" | "all"

    let whereClause: any = {};
    if (filter === "recovered") {
      whereClause.recovered = true;
    } else if (filter === "pending") {
      whereClause.recovered = false;
    }

    const carts = await prisma.abandonedCart.findMany({
      where: whereClause,
      orderBy: { lastActivity: "desc" },
    });

    const totalCount = carts.length;
    const recoveredCount = carts.filter((c) => c.recovered).length;
    const pendingCount = totalCount - recoveredCount;
    const recoveredValue = carts.filter((c) => c.recovered).reduce((acc, c) => acc + c.cartValue, 0);
    const lostValue = carts.filter((c) => !c.recovered).reduce((acc, c) => acc + c.cartValue, 0);

    return NextResponse.json({
      carts,
      stats: {
        totalCount,
        recoveredCount,
        pendingCount,
        recoveredValue,
        lostValue,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status: 401 });
  }
}

export async function POST() {
  try {
    await requireAdmin();
    const result = await processAbandonedCartReminders();
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process reminders" }, { status: 500 });
  }
}
