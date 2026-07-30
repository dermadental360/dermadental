"use client";

import { useEffect, useState } from "react";

interface CartItem {
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface AbandonedCart {
  id: string;
  sessionId: string;
  customerName: string | null;
  email: string | null;
  phone: string | null;
  items: CartItem[];
  cartValue: number;
  recovered: boolean;
  recoveredOrderId: string | null;
  lastActivity: string;
  whatsappSent: boolean;
  emailSent: boolean;
}

export default function AdminAbandonedCartsPage() {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "recovered">("all");
  const [loading, setLoading] = useState(true);
  const [remindingId, setRemindingId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalCount: 0,
    recoveredCount: 0,
    pendingCount: 0,
    recoveredValue: 0,
    lostValue: 0,
  });

  useEffect(() => {
    fetchCarts();
  }, [filter]);

  async function fetchCarts() {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/abandoned-carts?filter=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setCarts(data.carts || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load abandoned carts:", err);
    } finally {
      setLoading(false);
    }
  }

  async function sendReminder(id: string, type: "whatsapp" | "email" | "both") {
    setRemindingId(id);
    try {
      const res = await fetch(`/api/admin/abandoned-carts/${id}/remind`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();

      if (data.success) {
        alert("Reminder dispatched successfully!");
        fetchCarts();
      } else {
        alert(data.error || "Failed to send reminder");
      }
    } catch (err: any) {
      alert(err.message || "Failed to send reminder");
    } finally {
      setRemindingId(null);
    }
  }

  async function triggerBatchProcessing() {
    try {
      const res = await fetch("/api/admin/abandoned-carts", { method: "POST" });
      const data = await res.json();
      alert(`Automated Batch Recovery Processed!\nSent ${data.whatsappCount || 0} WhatsApps and ${data.emailCount || 0} Emails.`);
      fetchCarts();
    } catch (err: any) {
      alert("Failed to process batch reminders: " + err.message);
    }
  }

  const recoveryRate = stats.totalCount > 0 ? ((stats.recoveredCount / stats.totalCount) * 100).toFixed(1) : "0.0";

  if (loading) {
    return (
      <div className="card pad" style={{ textAlign: "center", padding: 48 }}>
        <h3>Loading Abandoned Carts Recovery...</h3>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header & Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <p className="eyebrow">Admin Center</p>
          <h1 style={{ margin: "4px 0 0 0", fontSize: 28 }}>Abandoned Cart Recovery</h1>
        </div>

        <div>
          <button className="btn" onClick={triggerBatchProcessing} style={{ borderRadius: 8, padding: "8px 16px", fontSize: 13 }}>
            ⚡ Run Recovery Batch
          </button>
        </div>
      </div>

      {/* Statistics Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <div className="card pad" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 28 }}>🛒</span>
          <div>
            <span style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Total Abandoned</span>
            <h3 style={{ margin: "2px 0 0 0", fontSize: 24, fontWeight: 800, color: "var(--ink)" }}>{stats.totalCount}</h3>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>Session checkouts</span>
          </div>
        </div>

        <div className="card pad" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 28 }}>⏳</span>
          <div>
            <span style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Pending Recovery</span>
            <h3 style={{ margin: "2px 0 0 0", fontSize: 24, fontWeight: 800, color: "#d97706" }}>{stats.pendingCount}</h3>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>Unconverted carts</span>
          </div>
        </div>

        <div className="card pad" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 28 }}>🎉</span>
          <div>
            <span style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Recovered Carts</span>
            <h3 style={{ margin: "2px 0 0 0", fontSize: 24, fontWeight: 800, color: "#16a34a" }}>{stats.recoveredCount} ({recoveryRate}%)</h3>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>Successfully converted</span>
          </div>
        </div>

        <div className="card pad" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 28 }}>💰</span>
          <div>
            <span style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Recovered Revenue</span>
            <h3 style={{ margin: "2px 0 0 0", fontSize: 24, fontWeight: 800, color: "var(--sage-dark)" }}>₹{stats.recoveredValue.toLocaleString("en-IN")}</h3>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>Retained sales value</span>
          </div>
        </div>
      </div>

      {/* Controls & Filter Bar Card */}
      <div className="card pad" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }}>
          {(["all", "pending", "recovered"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`btn ${filter === f ? "" : "secondary"}`}
              style={{ fontSize: 12, padding: "6px 14px", borderRadius: 20, whiteSpace: "nowrap" }}
            >
              {f === "all" ? "All Carts" : f === "pending" ? "⏳ Pending Recovery" : "🎉 Recovered Carts"}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container Card */}
      <div className="table-container">
        {carts.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <h3>No Abandoned Carts Found</h3>
            <p style={{ color: "var(--muted)", marginTop: 8 }}>There are no checkout carts matching this filter.</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Customer Info</th>
                <th>Cart Contents</th>
                <th>Cart Value</th>
                <th>Last Activity</th>
                <th>Dispatches</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Send Recovery</th>
              </tr>
            </thead>
            <tbody>
              {carts.map((cart) => {
                const name = cart.customerName || "Anonymous Visitor";

                return (
                  <tr key={cart.id}>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{name}</div>
                      {cart.email && <div style={{ fontSize: 12, color: "var(--muted)" }}>{cart.email}</div>}
                      {cart.phone && <div style={{ fontSize: 12, fontFamily: "monospace", color: "var(--ink)" }}>{cart.phone}</div>}
                    </td>
                    <td style={{ maxWidth: 280 }}>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        {Array.isArray(cart.items) &&
                          cart.items.map((item, idx) => (
                            <div key={idx} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              • <strong style={{ color: "var(--ink)" }}>{item.name || "Item"}</strong> x{item.quantity || 1}
                            </div>
                          ))}
                      </div>
                    </td>
                    <td style={{ fontWeight: 800, fontSize: 14 }}>₹{cart.cartValue.toLocaleString("en-IN")}</td>
                    <td style={{ fontSize: 12, color: "var(--muted)" }}>{new Date(cart.lastActivity).toLocaleString("en-IN")}</td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span className={`status-pill ${cart.whatsappSent ? "completed" : "new"}`} style={{ fontSize: 11 }}>
                          WhatsApp: {cart.whatsappSent ? "SENT" : "No"}
                        </span>
                        <span className={`status-pill ${cart.emailSent ? "completed" : "new"}`} style={{ fontSize: 11 }}>
                          Email: {cart.emailSent ? "SENT" : "No"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill ${cart.recovered ? "completed" : "packed"}`}>
                        {cart.recovered ? "RECOVERED" : "PENDING"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {!cart.recovered && (
                        <div style={{ display: "inline-flex", gap: 6 }}>
                          <button
                            className="btn secondary"
                            onClick={() => sendReminder(cart.id, "whatsapp")}
                            disabled={remindingId === cart.id || !cart.phone}
                            style={{ padding: "4px 10px", fontSize: 12, borderRadius: 6 }}
                          >
                            WhatsApp
                          </button>
                          <button
                            className="btn secondary"
                            onClick={() => sendReminder(cart.id, "email")}
                            disabled={remindingId === cart.id || !cart.email}
                            style={{ padding: "4px 10px", fontSize: 12, borderRadius: 6 }}
                          >
                            Email
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
