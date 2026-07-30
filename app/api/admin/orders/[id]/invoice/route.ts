import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAllSettings } from "@/lib/settings";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const settings = await getAllSettings();

    const invoiceData = {
      orderId: order.id,
      orderDate: new Date(order.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail || "N/A",
      customerAddress: order.customerAddress,
      items: order.items,
      subtotal: order.subtotal,
      discountType: order.discountType,
      discountAmount: order.discountAmount,
      shippingCharge: order.shippingCharge,
      codFee: order.codFee,
      total: order.total,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      seller: {
        name: settings["legal_entity_name"] || "Moeen International (DermaDental 360)",
        gstin: settings["gstin"] || "27AHTPG5622L2ZU",
        address: settings["registered_address"] || "Flat No 10, New Ambe Bhavan, Rd Number 24, Khar W, Mumbai, Maharashtra 400052",
        email: settings["support_email"] || "dd360health@gmail.com",
        phone: settings["support_phone"] || "9833699887",
      },
    };

    return NextResponse.json({ invoice: invoiceData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status: 401 });
  }
}
