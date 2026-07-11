"use client";

import { useEffect, useState } from "react";

export function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/orders");
      setOrders(await response.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    load();
  }

  async function remove(id: string) {
    if (confirm("Are you sure you want to delete this order?")) {
      await fetch(`/api/orders/${id}`, { method: "DELETE" });
      load();
    }
  }

  if (loading && orders.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 48 }}>
        <h3>Loading orders...</h3>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: 22, borderBottom: "1px solid var(--line)", paddingBottom: 10, marginBottom: 18 }}>
        📦 Customer Orders ({orders.length})
      </h2>
      {orders.length === 0 ? (
        <div className="card pad" style={{ textAlign: "center", padding: 48 }}>
          <h3>No orders registered</h3>
          <p style={{ color: "var(--muted)", marginTop: 8 }}>Orders placed on the shop will appear here.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {orders.map((order) => (
            <div className="card pad" key={String(order._id)} style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", alignItems: "start", gap: 14 }}>
                <div>
                  <span style={{ fontSize: 13, color: "var(--muted)", display: "block" }}>Order Reference</span>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>{order._id}</span>
                </div>
                <div>
                  <span style={{ fontSize: 13, color: "var(--muted)", display: "block" }}>Customer Details</span>
                  <span style={{ fontWeight: 600, display: "block" }}>{order.customer?.name}</span>
                  <span style={{ fontSize: 13, color: "var(--muted)" }}>
                    {order.customer?.phone} {order.customer?.email ? `· ${order.customer.email}` : ""}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: 13, color: "var(--muted)", display: "block" }}>Shipping Address</span>
                  <span style={{ fontSize: 14 }}>{order.customer?.address}</span>
                </div>
                <div>
                  <span style={{ fontSize: 13, color: "var(--muted)", display: "block" }}>Status Badge</span>
                  <span className={`status-pill ${(order.status || "New").toLowerCase()}`}>{order.status || "New"}</span>
                </div>
                <div>
                  <span style={{ fontSize: 13, color: "var(--muted)", display: "block" }}>Total Amount</span>
                  <span style={{ fontWeight: 800, fontSize: 18, color: "var(--sage-dark)" }}>₹{order.total}</span>
                </div>
              </div>

              {order.customer?.notes && (
                <div style={{ backgroundColor: "var(--bg-secondary)", padding: "10px 14px", borderRadius: "6px", fontSize: 14 }}>
                  <strong>Notes:</strong> {order.customer.notes}
                </div>
              )}

              <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}>
                <h4 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--muted)", marginBottom: 8 }}>
                  Items Ordered
                </h4>
                <ul style={{ listStyle: "none", display: "grid", gap: 6 }}>
                  {order.items?.map((item: any, idx: number) => (
                    <li key={idx} style={{ fontSize: 14, display: "flex", justifyContent: "space-between" }}>
                      <span>
                        {item.quantity} x {item.name}
                      </span>
                      <span style={{ color: "var(--muted)" }}>₹{item.price * item.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="admin-order-footer">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>Update Status:</span>
                  <select
                    className="input"
                    value={order.status || "New"}
                    onChange={(event) => updateStatus(order._id, event.target.value)}
                    style={{ padding: "8px 12px", width: 140, fontSize: 13 }}
                  >
                    <option>New</option>
                    <option>Confirmed</option>
                    <option>Packed</option>
                    <option>Completed</option>
                    <option>Cancelled</option>
                  </select>
                </div>
                <button
                  className="btn soft"
                  style={{ padding: "8px 14px", fontSize: 13, color: "var(--error)" }}
                  onClick={() => remove(order._id)}
                >
                  Delete Record
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
