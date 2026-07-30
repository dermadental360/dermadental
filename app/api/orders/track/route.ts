import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim();

    if (!query) {
      return NextResponse.json({ error: "Order ID or phone number required" }, { status: 400 });
    }

    // Try finding by order ID first, then phone number
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: { equals: query, mode: "insensitive" } },
          { customerPhone: { contains: query } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found. Please verify your order ID or registered phone number." }, { status: 404 });
    }

    const tracking = await prisma.orderTracking.findUnique({
      where: { orderId: order.id },
      include: { history: { orderBy: { timestamp: "asc" } } },
    });

    return NextResponse.json({
      order: {
        id: order.id,
        customerName: order.customerName,
        customerAddress: order.customerAddress,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        total: order.total,
        createdAt: order.createdAt,
        items: order.items,
        trackingNumber: order.trackingNumber,
      },
      tracking: tracking || {
        status: order.status,
        courierName: null,
        trackingNumber: order.trackingNumber || null,
        history: [
          { status: "PLACED", timestamp: order.createdAt, notes: "Order successfully placed" },
          ...(order.status !== "PLACED" ? [{ status: order.status, timestamp: order.updatedAt, notes: `Order status updated to ${order.status}` }] : []),
        ],
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch order tracking" }, { status: 500 });
  }
}
