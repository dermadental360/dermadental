import { NextRequest, NextResponse } from "next/server";
import { clinic } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { fallbackStore } from "@/lib/fallbackStore";
import { logAction } from "@/lib/auditLogger";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" }
    });
    const formatted = orders.map(o => ({
      _id: o.id,
      customer: {
        name: o.customerName,
        phone: o.customerPhone,
        email: o.customerEmail,
        address: o.customerAddress,
        notes: o.notes
      },
      items: typeof o.items === "string" ? JSON.parse(o.items) : o.items,
      total: o.total,
      status: o.status,
      whatsappSent: o.whatsappSent,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString()
    }));
    return NextResponse.json(formatted);
  } catch (error) {
    console.error("GET /api/orders failed:", error);
    return NextResponse.json(fallbackStore.orders);
  }
}

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.customer?.name || !body.customer?.phone || !body.items?.length) {
    return NextResponse.json({ error: "Missing order details" }, { status: 400 });
  }

  let saved: any = null;
  try {
    const order = await prisma.order.create({
      data: {
        customerName: body.customer.name,
        customerPhone: body.customer.phone,
        customerEmail: body.customer.email || "",
        customerAddress: body.customer.address,
        notes: body.customer.notes || "",
        items: body.items,
        total: Number(body.total),
        status: "New",
        whatsappSent: false
      }
    });
    saved = {
      _id: order.id,
      ...body,
      status: order.status,
      createdAt: order.createdAt.toISOString()
    };
  } catch (error) {
    console.warn("Failed to save order to SQLite, using fallback:", error);
    saved = {
      _id: "ord-" + Date.now(),
      ...body,
      status: "New",
      createdAt: new Date().toISOString()
    };
    fallbackStore.orders.push(saved);
  }

  await logAction("Create Order", `New order ID "${saved._id}" placed by "${body.customer.name}" (total: ₹${body.total}).`);

  const lines = [
    `New DermaDental360 Order`,
    `Order ID: ${saved._id}`,
    `Name: ${body.customer.name}`,
    `Phone: ${body.customer.phone}`,
    `Address: ${body.customer.address}`,
    `Items:`,
    ...body.items.map((item: any) => `- ${item.quantity} x ${item.name} @ Rs ${item.price}`),
    `Total: Rs ${body.total}`,
    body.customer.notes ? `Notes: ${body.customer.notes}` : ""
  ].filter(Boolean);
  const whatsappUrl = `https://wa.me/${clinic.whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`;
  
  return NextResponse.json({ _id: String(saved._id), whatsappUrl });
}
