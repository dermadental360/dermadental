import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendCustomerOrderStatusWhatsApp, sendWhatsAppMessage } from "@/lib/whatsapp";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const customMsg = body?.customMessage;

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.customerPhone) {
      return NextResponse.json({ error: "Customer phone number is missing for this order" }, { status: 400 });
    }

    let result;
    if (customMsg) {
      result = await sendWhatsAppMessage({
        recipientPhone: order.customerPhone,
        recipientName: order.customerName,
        message: customMsg,
        templateName: "admin_custom_direct",
        orderId: order.id,
      });
    } else {
      result = await sendCustomerOrderStatusWhatsApp(
        {
          id: order.id,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          total: order.total,
          trackingNumber: order.trackingNumber,
        },
        order.status
      );
    }

    if (result.success) {
      return NextResponse.json({ success: true, message: `WhatsApp message dispatched to ${order.customerPhone}` });
    } else {
      return NextResponse.json({ success: false, error: (result as any).error || (result as any).reason || "Failed to send WhatsApp message" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status: 401 });
  }
}
