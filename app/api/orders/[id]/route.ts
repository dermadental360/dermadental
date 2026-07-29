import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/auditLogger";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch (error: any) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const order = await prisma.order.findUnique({
      where: { id }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...order,
      _id: order.id,
      customer: {
        name: order.customerName,
        phone: order.customerPhone,
        email: order.customerEmail || "",
        address: order.customerAddress,
        notes: order.notes || ""
      },
      items: typeof order.items === "string" ? JSON.parse(order.items) : order.items
    });
  } catch (error: any) {
    console.error(`GET /api/orders/${id} error:`, error?.message || error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch (error: any) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const update: any = {};
    if (body.status) update.status = body.status;
    if (body.paymentStatus) update.paymentStatus = body.paymentStatus;
    if (typeof body.trackingNumber === "string") update.trackingNumber = body.trackingNumber;
    if (typeof body.whatsappSent === "boolean") update.whatsappSent = body.whatsappSent;

    const order = await prisma.order.update({
      where: { id },
      data: update
    });

    try {
      const { broadcastAdminEvent } = await import("@/lib/eventBus");
      broadcastAdminEvent("ORDER_STATUS_UPDATED", order);
    } catch {}

    await logAction("Update Order", `Order ID "${id}" updated (Status: ${body.status || 'Unchanged'}, Payment: ${body.paymentStatus || 'Unchanged'}).`);

    return NextResponse.json({
      ...order,
      _id: order.id,
      customer: {
        name: order.customerName,
        phone: order.customerPhone,
        email: order.customerEmail || "",
        address: order.customerAddress,
        notes: order.notes || ""
      },
      items: typeof order.items === "string" ? JSON.parse(order.items) : order.items
    });
  } catch (error: any) {
    console.error(`PUT /api/orders/${id} error:`, error?.message || error);
    return NextResponse.json({ error: "Failed to update order: " + (error?.message || "Internal error") }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch (error: any) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.order.delete({
      where: { id }
    });
    await logAction("Delete Order", `Order ID "${id}" deleted from database.`);
    return NextResponse.json({ ok: true, success: true });
  } catch (error: any) {
    console.error(`DELETE /api/orders/${id} error:`, error?.message || error);
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}
