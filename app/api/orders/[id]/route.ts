import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fallbackStore } from "@/lib/fallbackStore";
import { logAction } from "@/lib/auditLogger";

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
    if (typeof body.whatsappSent === "boolean") update.whatsappSent = body.whatsappSent;

    const order = await prisma.order.update({
      where: { id },
      data: update
    });

    await logAction("Update Order", `Order ID "${id}" status updated to "${body.status || 'Updated'}".`);
    
    return NextResponse.json({
      ...order,
      _id: order.id,
      customer: {
        name: order.customerName,
        phone: order.customerPhone,
        email: order.customerEmail,
        address: order.customerAddress,
        notes: order.notes
      },
      items: typeof order.items === "string" ? JSON.parse(order.items) : order.items
    });
  } catch (error) {
    console.warn("Failed to update order in SQLite, falling back to memory:", error);
    const order = fallbackStore.orders.find((o: any) => o._id === id);
    if (order) {
      if (body.status) order.status = body.status;
      if (typeof body.whatsappSent === "boolean") order.whatsappSent = body.whatsappSent;
    }
    await logAction("Update Order", `Order ID "${id}" status updated to "${body.status || 'Updated'}" (Offline).`);
    return NextResponse.json(order || { error: "Order not found" });
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
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.warn("Failed to delete order in SQLite, falling back to memory:", error);
    fallbackStore.orders = fallbackStore.orders.filter((o: any) => o._id !== id);
    await logAction("Delete Order", `Order ID "${id}" deleted from dashboard (Offline).`);
    return NextResponse.json({ ok: true });
  }
}
