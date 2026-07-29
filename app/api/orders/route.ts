import { NextRequest, NextResponse } from "next/server";
import { clinic } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/auditLogger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" }
    });
    const formatted = orders.map(o => ({
      id: o.id,
      _id: o.id,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      customerEmail: o.customerEmail,
      customerAddress: o.customerAddress,
      customer: {
        name: o.customerName,
        phone: o.customerPhone,
        email: o.customerEmail || "",
        address: o.customerAddress,
        notes: o.notes || ""
      },
      items: typeof o.items === "string" ? JSON.parse(o.items) : o.items,
      subtotal: o.subtotal,
      discountType: o.discountType,
      discountPercentage: o.discountPercentage,
      discountAmount: o.discountAmount,
      shippingCharge: o.shippingCharge,
      codFee: o.codFee,
      total: o.total,
      finalAmount: o.finalAmount || o.total,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      status: o.status,
      trackingNumber: o.trackingNumber,
      whatsappSent: o.whatsappSent,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString()
    }));
    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("GET /api/orders MySQL failed:", error?.message || error);
    return NextResponse.json({ error: "Failed to fetch orders from database." }, { status: 500 });
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
    return NextResponse.json({ error: "Missing required order details." }, { status: 400 });
  }

  try {
    const items = body.items;
    const totalAmount = Number(body.total) || 0;
    const customerEmail = body.customer.email ? String(body.customer.email).trim().toLowerCase() : "";

    // 1. Upsert customer in Customer table if email is present
    if (customerEmail) {
      try {
        await prisma.customer.upsert({
          where: { email: customerEmail },
          update: {
            name: body.customer.name,
            phone: body.customer.phone
          },
          create: {
            email: customerEmail,
            name: body.customer.name,
            phone: body.customer.phone,
            passwordHash: "direct-order-guest"
          }
        });
      } catch (cErr: any) {
        console.warn("Customer upsert warning:", cErr?.message || cErr);
      }
    }

    // 2. Create Order in MySQL & decrement inventory stock in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          customerName: body.customer.name,
          customerPhone: body.customer.phone,
          customerEmail: customerEmail,
          customerAddress: body.customer.address || "",
          notes: body.customer.notes || "",
          items: items,
          subtotal: Number(body.subtotal) || totalAmount,
          total: totalAmount,
          finalAmount: totalAmount,
          paymentMethod: body.paymentMethod || "DIRECT",
          paymentStatus: body.paymentStatus || "PENDING",
          status: body.status || "PLACED",
          whatsappSent: false
        }
      });

      // Decrement stock for ordered items
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item.productId || item.id) {
            const pId = String(item.productId || item.id);
            try {
              await tx.product.update({
                where: { id: pId },
                data: { stock: { decrement: Math.max(1, Number(item.quantity) || 1) } }
              });
            } catch (pErr) {
              console.warn(`Could not decrement stock for product ${pId}:`, pErr);
            }
          }
        }
      }

      return created;
    });

    await logAction("Create Order", `New order ID "${order.id}" placed by "${body.customer.name}" (total: ₹${totalAmount}).`);

    // 3. Create Admin Notification
    try {
      const { createNotification } = await import("@/lib/notifications");
      await createNotification({
        title: "🔔 New Order Received",
        message: `Order #${order.id} placed by ${body.customer.name} for ₹${totalAmount}.`,
        category: "ORDERS",
        priority: "HIGH",
        orderId: order.id,
        link: `/admin/orders?search=${order.id}`
      });
    } catch (err) {
      console.warn("Failed to trigger order notification:", err);
    }

    const lines = [
      `New DermaDental360 Order`,
      `Order ID: ${order.id}`,
      `Name: ${body.customer.name}`,
      `Phone: ${body.customer.phone}`,
      `Address: ${body.customer.address}`,
      `Items:`,
      ...items.map((item: any) => `- ${item.quantity} x ${item.name} @ Rs ${item.price}`),
      `Total: Rs ${totalAmount}`,
      body.customer.notes ? `Notes: ${body.customer.notes}` : ""
    ].filter(Boolean);
    const whatsappUrl = `https://wa.me/${clinic.whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`;

    return NextResponse.json({
      success: true,
      _id: order.id,
      orderId: order.id,
      order: {
        ...order,
        _id: order.id,
        customer: body.customer
      },
      whatsappUrl
    });
  } catch (error: any) {
    console.error("POST /api/orders MySQL failed:", error?.message || error);
    return NextResponse.json({ error: "Failed to save order to database: " + (error?.message || "Internal error") }, { status: 500 });
  }
}
