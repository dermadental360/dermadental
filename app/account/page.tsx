import { redirect } from "next/navigation";
import { getCustomer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccountClient } from "./AccountClient";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const customer = await getCustomer();
  if (!customer) {
    redirect("/signin");
  }

  let orders: any[] = [];
  try {
    const dbOrders = await prisma.order.findMany({
      where: {
        OR: [
          { customerEmail: customer.email },
          { customerPhone: customer.phone }
        ]
      },
      orderBy: { createdAt: "desc" }
    });
    orders = dbOrders.map(o => ({
      _id: o.id,
      id: o.id,
      customer: {
        name: o.customerName,
        phone: o.customerPhone,
        email: o.customerEmail,
        address: o.customerAddress,
        notes: o.notes
      },
      items: typeof o.items === "string" ? JSON.parse(o.items) : o.items,
      subtotal: o.subtotal,
      discountType: o.discountType,
      discountAmount: o.discountAmount,
      total: o.finalAmount || o.total,
      status: o.status,
      createdAt: o.createdAt
    }));
  } catch (error) {
    console.error("Prisma account orders failed:", error);
    orders = [];
  }

  const plainOrders = orders.map((o) => ({
    _id: String(o._id),
    customer: {
      name: String(o.customer?.name || "Customer"),
      phone: String(o.customer?.phone || ""),
      email: String(o.customer?.email || ""),
      address: String(o.customer?.address || ""),
      notes: o.customer?.notes ? String(o.customer.notes) : undefined
    },
    items: Array.isArray(o.items)
      ? o.items.map((item: any) => ({
          productId: String(item.productId || item.id || ""),
          name: String(item.name || "Product"),
          price: Number(item.price || 0),
          quantity: Number(item.quantity || 1)
        }))
      : [],
    subtotal: o.subtotal ? Number(o.subtotal) : undefined,
    discountType: o.discountType ? String(o.discountType) : undefined,
    discountAmount: o.discountAmount ? Number(o.discountAmount) : undefined,
    total: Number(o.total || 0),
    status: String(o.status || "Placed"),
    createdAt: new Date(o.createdAt).toISOString()
  }));

  return <AccountClient customer={customer} orders={plainOrders} />;
}
