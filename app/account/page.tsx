import { redirect } from "next/navigation";
import { getCustomer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccountClient } from "./AccountClient";
import { fallbackStore } from "@/lib/fallbackStore";

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
      createdAt: o.createdAt
    }));
  } catch (error) {
    console.warn("Prisma account orders failed, using fallback:", error);
    orders = fallbackStore.orders.filter((o: any) => 
      o.customer?.email === customer.email || o.customer?.phone === customer.phone
    );
  }

  const plainOrders = orders.map((o) => ({
    _id: String(o._id),
    total: o.total,
    status: o.status || "New",
    createdAt: o.createdAt 
      ? (o.createdAt instanceof Date ? o.createdAt.toISOString() : String(o.createdAt)) 
      : new Date().toISOString(),
    items: (o.items || []).map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price
    }))
  }));

  return (
    <main className="section page-enter">
      <div className="container reveal">
        <p className="eyebrow">Customer Hub</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24, flexWrap: "wrap", marginBottom: 32, borderBottom: "1px solid var(--line)", paddingBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0 }}>Welcome, {customer.name}</h1>
            <p style={{ marginTop: 8, color: "var(--muted)" }}>{customer.email} · {customer.phone}</p>
          </div>
          <AccountClient />
        </div>

        <h2 style={{ fontSize: 24, marginBottom: 18 }}>Order History</h2>
        {plainOrders.length === 0 ? (
          <div className="card pad" style={{ textAlign: "center", padding: 48 }}>
            <h3>No orders found</h3>
            <p style={{ marginTop: 8, color: "var(--muted)" }}>When you place orders, they will show up here.</p>
          </div>
        ) : (
          <div className="grid">
            {plainOrders.map((order) => (
              <div className="card pad" key={order._id} style={{ display: "grid", gap: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 14, borderBottom: "1px solid var(--line)", paddingBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: 13, color: "var(--muted)", display: "block" }}>Order ID</span>
                    <span style={{ fontWeight: 600 }}>{order._id}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 13, color: "var(--muted)", display: "block" }}>Date</span>
                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 13, color: "var(--muted)", display: "block" }}>Status</span>
                    <span className={`status-pill ${order.status.toLowerCase()}`}>{order.status}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 13, color: "var(--muted)", display: "block" }}>Total Amount</span>
                    <span style={{ fontWeight: 700 }}>₹{order.total}</span>
                  </div>
                </div>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, textTransform: "uppercase", color: "var(--muted)" }}>Items</h4>
                  <ul style={{ listStyle: "none", display: "grid", gap: 6 }}>
                    {order.items.map((item: any, idx: number) => (
                      <li key={idx} style={{ fontSize: 14, display: "flex", justifyContent: "space-between" }}>
                        <span>{item.quantity} x {item.name}</span>
                        <span>₹{item.price * item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
