"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { OrderTimeline } from "@/components/OrderTimeline";

export function AdminOrders() {
  const searchParams = useSearchParams();
  const searchId = searchParams.get("search");

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState(searchId || "");
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/orders");
      const data = await response.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/admin/stream");
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "ORDER_NEW" && data.payload) {
            const newOrder = data.payload;
            setOrders((prev) => [
              newOrder,
              ...prev.filter((o) => String(o._id) !== String(newOrder._id))
            ]);
          } else if (data.type === "PAYMENT_SUCCESS" || data.type === "ORDER_STATUS_UPDATED") {
            load();
          }
        } catch (err) {
          console.error("AdminOrders SSE error:", err);
        }
      };
    } catch (err) {
      console.warn("AdminOrders SSE failed:", err);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  useEffect(() => {
    if (searchId) {
      setFilterText(searchId);
    }
  }, [searchId]);

  async function updateOrderDetails(id: string, updates: { status?: string; paymentStatus?: string; trackingNumber?: string }) {
    await fetch(`/api/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    });
    load();
  }

  async function remove(id: string) {
    if (confirm("Are you sure you want to delete this order?")) {
      await fetch(`/api/orders/${id}`, { method: "DELETE" });
      load();
    }
  }

  const filteredOrders = filterText
    ? orders.filter(
        (o) =>
          String(o._id || o.id).toLowerCase().includes(filterText.toLowerCase()) ||
          o.customer?.name?.toLowerCase().includes(filterText.toLowerCase()) ||
          o.customer?.phone?.includes(filterText) ||
          o.customer?.email?.toLowerCase().includes(filterText.toLowerCase())
      )
    : orders;

  if (loading && orders.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 48 }}>
        <h3>Loading customer orders...</h3>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 18, borderBottom: "1px solid var(--line)", paddingBottom: 10 }}>
        <h2 style={{ fontSize: 22, margin: 0 }}>
          📦 Customer Orders ({filteredOrders.length})
        </h2>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            className="input"
            type="text"
            placeholder="Search by Order ID, Name, Phone..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            style={{ padding: "8px 14px", fontSize: 13, width: 260 }}
          />
          {filterText && (
            <button className="btn soft" onClick={() => setFilterText("")} style={{ padding: "8px 12px", fontSize: 12 }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="card pad" style={{ textAlign: "center", padding: 48 }}>
          <h3>No matching orders found</h3>
          <p style={{ color: "var(--muted)", marginTop: 8 }}>
            {filterText ? "Try clearing your search query." : "Orders placed on the shop will appear here."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {filteredOrders.map((order) => {
            const orderIdStr = String(order._id || order.id);
            const isHighlighted = searchId && orderIdStr === String(searchId);
            const isCod = order.paymentMethod === "COD";
            const isPaid = order.paymentStatus === "PAID";
            const isPlaced = (order.status || "PLACED").toUpperCase() === "PLACED";

            return (
              <div
                className="card pad"
                key={orderIdStr}
                style={{
                  display: "grid",
                  gap: 14,
                  borderLeft: isHighlighted ? "4px solid #16a34a" : undefined,
                  backgroundColor: isHighlighted ? "#f0fdf4" : undefined
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", alignItems: "start", gap: 14 }}>
                  <div>
                    <span style={{ fontSize: 12, color: "var(--muted)", display: "block" }}>ORDER REFERENCE</span>
                    <span style={{ fontWeight: 700, fontSize: 16 }}>#{orderIdStr}</span>
                    <span style={{ fontSize: 11, color: "var(--muted)", display: "block", marginTop: 2 }}>
                      {new Date(order.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div style={{ maxWidth: 280 }}>
                    <span style={{ fontSize: 12, color: "var(--muted)", display: "block" }}>CUSTOMER DETAILS</span>
                    <span style={{ fontWeight: 600, display: "block", fontSize: 15 }}>{order.customerName || order.customer?.name || "Guest Customer"}</span>
                    <span style={{ fontSize: 13, color: "var(--muted)", display: "block", marginTop: 2 }}>
                      📞 {order.customerPhone || order.customer?.phone || "N/A"}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--muted)", display: "block", wordBreak: "break-all" }}>
                      ✉ {order.customerEmail || order.customer?.email || "N/A"}
                    </span>
                    <span style={{ fontSize: 12, color: "#1e293b", fontWeight: 500, display: "block", marginTop: 4, background: "#f1f5f9", padding: "4px 8px", borderRadius: 4 }}>
                      📍 {order.customerAddress || order.customer?.address || "No address specified"}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: 12, color: "var(--muted)", display: "block" }}>PAYMENT METHOD</span>
                    <span style={{
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "4px 8px",
                      borderRadius: 6,
                      background: isCod ? "#fef3c7" : "#e0f2fe",
                      color: isCod ? "#92400e" : "#0369a1",
                      display: "inline-block",
                      marginTop: 2
                    }}>
                      {isCod ? "📦 CASH ON DELIVERY" : "💳 RAZORPAY ONLINE"}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: 12, color: "var(--muted)", display: "block" }}>DISCOUNT APPLIED</span>
                    {(order.discountAmount > 0 || order.discountType === "PREPAID") ? (
                      <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 8px", borderRadius: 6, background: "#dcfce7", color: "#15803d", display: "inline-block", marginTop: 2 }}>
                        ✅ Yes (5% Prepaid)
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 8px", borderRadius: 6, background: "#f1f5f9", color: "#64748b", display: "inline-block", marginTop: 2 }}>
                        ❌ No
                      </span>
                    )}
                  </div>

                  <div>
                    <span style={{ fontSize: 12, color: "var(--muted)", display: "block" }}>DISCOUNT AMOUNT</span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: (order.discountAmount > 0 || order.discountType === "PREPAID") ? "#16a34a" : "var(--muted)" }}>
                      {(order.discountAmount > 0 || order.discountType === "PREPAID")
                        ? `-₹${order.discountAmount || Math.round((order.subtotal || order.total) * 0.05)}`
                        : "₹0"}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: 12, color: "var(--muted)", display: "block" }}>PAYMENT STATUS</span>
                    <span style={{
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "4px 8px",
                      borderRadius: 6,
                      background: isPaid ? "#dcfce7" : "#fee2e2",
                      color: isPaid ? "#15803d" : "#991b1b",
                      display: "inline-block",
                      marginTop: 2
                    }}>
                      {isPaid ? "🟢 PAID" : "🟡 PENDING"}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: 12, color: "var(--muted)", display: "block" }}>FINAL AMOUNT</span>
                    <span style={{ fontWeight: 800, fontSize: 16, color: "var(--sage-dark)" }}>₹{order.finalAmount || order.total}</span>
                    {order.codFee > 0 && (
                      <span style={{ fontSize: 11, color: "var(--muted)", display: "block" }}>
                        (Includes ₹{order.codFee} COD Fee)
                      </span>
                    )}
                  </div>
                </div>

                {/* Step-by-Step Visual Timeline */}
                <OrderTimeline
                  status={order.status || "PLACED"}
                  paymentMethod={order.paymentMethod}
                  paymentStatus={order.paymentStatus}
                />

                <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", padding: "12px 16px", borderRadius: "8px", fontSize: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 6, display: "flex", alignItems: "center", gap: 6, textTransform: "uppercase" }}>
                    📍 Full Shipping & Delivery Address
                  </div>
                  <div style={{ color: "#1e293b", fontSize: 14, fontWeight: 500, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                    {order.customerAddress || order.customer?.address || "No delivery address specified."}
                  </div>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 8, fontSize: 13, color: "#475569", borderTop: "1px dashed #cbd5e1", paddingTop: 8 }}>
                    <span>👤 Customer: <strong>{order.customerName || order.customer?.name || "N/A"}</strong></span>
                    <span>📞 Phone: <strong>{order.customerPhone || order.customer?.phone || "N/A"}</strong></span>
                    <span>✉ Email: <strong>{order.customerEmail || order.customer?.email || "N/A"}</strong></span>
                  </div>
                </div>

                {(order.notes || order.customer?.notes) && (
                  <div style={{ backgroundColor: "var(--bg-secondary)", padding: "10px 14px", borderRadius: "6px", fontSize: 14 }}>
                    <strong>Notes:</strong> {order.notes || order.customer?.notes}
                  </div>
                )}

                <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}>
                  <h4 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--muted)", marginBottom: 8 }}>
                    Items Ordered ({order.items?.length || 0})
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

                {/* Admin Quick Control Toolbar */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 12,
                  background: "#f8fafc",
                  padding: "12px 16px",
                  borderRadius: 8,
                  border: "1px solid var(--line)"
                }}>
                  {/* Status Advancement Actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>Workflow Status:</span>
                    <select
                      className="input"
                      value={(order.status || "PLACED").toUpperCase()}
                      onChange={async (e) => {
                        const newStatus = e.target.value;
                        await fetch(`/api/admin/orders/${orderIdStr}/status`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ status: newStatus }),
                        });
                        load();
                      }}
                      style={{ padding: "6px 10px", width: 160, fontSize: 13, fontWeight: 600 }}
                    >
                      <option value="PLACED">1. PLACED</option>
                      <option value="CONFIRMED">2. CONFIRMED</option>
                      <option value="PACKED">3. PACKED</option>
                      <option value="SHIPPED">4. SHIPPED</option>
                      <option value="OUT_FOR_DELIVERY">5. OUT FOR DELIVERY</option>
                      <option value="DELIVERED">6. DELIVERED</option>
                      <option value="CANCELLED">❌ CANCELLED</option>
                      <option value="REFUNDED">💸 REFUNDED</option>
                    </select>

                    {/* Send WhatsApp Now Button Beside Status */}
                    <button
                      className="btn"
                      style={{ padding: "6px 12px", fontSize: 12, backgroundColor: "#16a34a", borderColor: "#16a34a", color: "white", display: "flex", alignItems: "center", gap: 4 }}
                      onClick={async () => {
                        const res = await fetch(`/api/admin/orders/${orderIdStr}/whatsapp`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                        });
                        const data = await res.json();
                        if (data.success) {
                          alert(`WhatsApp update sent successfully to ${order.customerPhone || "customer"}`);
                        } else {
                          alert(`WhatsApp dispatch failed: ${data.error || "Unknown error"}`);
                        }
                      }}
                    >
                      💬 Send WhatsApp Now
                    </button>

                    {/* Print Invoice Button */}
                    <button
                      className="btn soft"
                      style={{ padding: "6px 12px", fontSize: 12, color: "#0284c7", borderColor: "#bae6fd" }}
                      onClick={async () => {
                        const res = await fetch(`/api/admin/orders/${orderIdStr}/invoice`);
                        const data = await res.json();
                        if (data.invoice) {
                          const printWin = window.open("", "_blank");
                          if (printWin) {
                            const inv = data.invoice;
                            const itemsHtml = (inv.items || []).map((i: any) => `<tr><td style="padding:8px;border-bottom:1px solid #ddd;">${i.name}</td><td style="padding:8px;border-bottom:1px solid #ddd;" align="center">${i.quantity}</td><td style="padding:8px;border-bottom:1px solid #ddd;" align="right">₹${i.price}</td><td style="padding:8px;border-bottom:1px solid #ddd;" align="right">₹${i.price * i.quantity}</td></tr>`).join("");
                            printWin.document.write(`
                              <html>
                                <head><title>Invoice #${inv.orderId}</title></head>
                                <body style="font-family:Arial,sans-serif;padding:30px;color:#333;">
                                  <h2>TAX INVOICE - ${inv.seller.name}</h2>
                                  <p><strong>GSTIN:</strong> ${inv.seller.gstin} | <strong>Order ID:</strong> #${inv.orderId} | <strong>Date:</strong> ${inv.orderDate}</p>
                                  <hr/>
                                  <div style="display:flex;justify-content:space-between;margin:20px 0;">
                                    <div><strong>Billed To:</strong><br/>${inv.customerName}<br/>${inv.customerAddress}<br/>Phone: ${inv.customerPhone}</div>
                                    <div><strong>Payment Info:</strong><br/>Method: ${inv.paymentMethod}<br/>Status: ${inv.paymentStatus}</div>
                                  </div>
                                  <table width="100%" cellspacing="0" style="border-collapse:collapse;margin:20px 0;">
                                    <thead><tr style="background:#f4f4f4;"><th align="left" style="padding:8px;">Item</th><th align="center" style="padding:8px;">Qty</th><th align="right" style="padding:8px;">Price</th><th align="right" style="padding:8px;">Total</th></tr></thead>
                                    <tbody>${itemsHtml}</tbody>
                                    <tfoot>
                                      <tr><td colspan="3" align="right" style="padding:8px;"><strong>Subtotal:</strong></td><td align="right" style="padding:8px;">₹${inv.subtotal}</td></tr>
                                      ${inv.discountAmount > 0 ? `<tr><td colspan="3" align="right" style="padding:8px;color:green;"><strong>Discount:</strong></td><td align="right" style="padding:8px;color:green;">-₹${inv.discountAmount}</td></tr>` : ""}
                                      <tr><td colspan="3" align="right" style="padding:8px;"><strong>Grand Total:</strong></td><td align="right" style="padding:8px;font-size:18px;"><strong>₹${inv.total}</strong></td></tr>
                                    </tfoot>
                                  </table>
                                </body>
                              </html>
                            `);
                            printWin.document.close();
                            printWin.print();
                          }
                        }
                      }}
                    >
                      📄 Print Invoice
                    </button>

                    {/* Quick Mark Paid Button */}
                    {!isPaid && (
                      <button
                        className="btn soft"
                        style={{ padding: "6px 12px", fontSize: 12, color: "#15803d", borderColor: "#86efac" }}
                        onClick={() => updateOrderDetails(orderIdStr, { paymentStatus: "PAID" })}
                      >
                        💰 Mark as Paid
                      </button>
                    )}
                  </div>

                  {/* Tracking Number Input & Actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input
                      type="text"
                      className="input"
                      placeholder="Tracking #"
                      defaultValue={order.trackingNumber || ""}
                      onChange={(e) => setTrackingInputs((prev) => ({ ...prev, [orderIdStr]: e.target.value }))}
                      style={{ padding: "6px 10px", fontSize: 13, width: 140 }}
                    />
                    <button
                      className="btn soft"
                      style={{ padding: "6px 12px", fontSize: 12 }}
                      onClick={() => updateOrderDetails(orderIdStr, { trackingNumber: trackingInputs[orderIdStr] || order.trackingNumber })}
                    >
                      Save Tracking
                    </button>
                    <button
                      className="btn soft"
                      style={{ padding: "6px 12px", fontSize: 12, color: "var(--error)" }}
                      onClick={() => remove(orderIdStr)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

