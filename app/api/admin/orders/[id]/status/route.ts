import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendCustomerOrderStatusWhatsApp } from "@/lib/whatsapp";
import { sendCustomerOrderEmail } from "@/lib/email";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { status, trackingNumber, courierName, notes, location, notifyWhatsApp, notifyEmail } = body;

    if (!status) {
      return NextResponse.json({ error: "Status parameter is required" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 1. Update Order in DB
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status,
        ...(trackingNumber && { trackingNumber }),
      },
    });

    // 2. Upsert OrderTracking and Record History in DB
    const orderTracking = await prisma.orderTracking.upsert({
      where: { orderId: id },
      create: {
        orderId: id,
        status,
        courierName: courierName || null,
        trackingNumber: trackingNumber || order.trackingNumber || null,
        notes: notes || `Order status updated to ${status}`,
        location: location || null,
        updatedBy: "ADMIN",
        history: {
          create: {
            status,
            notes: notes || `Order status updated to ${status}`,
            location: location || null,
          },
        },
      },
      update: {
        status,
        ...(courierName && { courierName }),
        ...(trackingNumber && { trackingNumber }),
        notes: notes || `Order status updated to ${status}`,
        ...(location && { location }),
        updatedBy: "ADMIN",
        history: {
          create: {
            status,
            notes: notes || `Order status updated to ${status}`,
            location: location || null,
          },
        },
      },
    });

    let whatsAppResult: { success: boolean; error?: string; reason?: string } = { success: false, reason: "Skipped" };
    let emailResult = false;

    // 3. Automated WhatsApp Dispatch
    if (notifyWhatsApp !== false && order.customerPhone) {
      whatsAppResult = await sendCustomerOrderStatusWhatsApp(
        {
          id: order.id,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          total: order.total,
          trackingNumber: trackingNumber || order.trackingNumber,
        },
        status
      );
    }

    // 4. Automated Email Dispatch
    if (notifyEmail !== false && order.customerEmail) {
      emailResult = await sendCustomerOrderEmail({
        orderId: order.id,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail,
        customerAddress: order.customerAddress,
        items: order.items as any[],
        subtotal: order.subtotal,
        discountAmount: order.discountAmount,
        shippingCharge: order.shippingCharge,
        total: order.total,
        paymentStatus: order.paymentStatus,
        paymentTime: new Date().toLocaleString("en-IN"),
        stage: status as any,
      });
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      tracking: orderTracking,
      whatsappSent: whatsAppResult.success,
      emailSent: emailResult,
    });
  } catch (error: any) {
    console.error("Order status update error:", error);
    return NextResponse.json({ error: error.message || "Failed to update status" }, { status: 500 });
  }
}
