"use client";

import { useState } from "react";
import { clinic } from "@/lib/constants";

interface OrderTrackingData {
  order: {
    id: string;
    customerName: string;
    customerAddress: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    total: number;
    createdAt: string;
    items: any[];
    trackingNumber: string | null;
  };
  tracking: {
    status: string;
    courierName: string | null;
    trackingNumber: string | null;
    history: Array<{ status: string; timestamp: string; notes: string | null; location?: string }>;
  };
}

export default function TrackOrderPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OrderTrackingData | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/orders/track?query=${encodeURIComponent(query.trim())}`);
      const data = await res.json();

      if (res.ok && data.order) {
        setResult(data);
      } else {
        setError(data.error || "Order not found. Please verify your Order ID or phone number.");
      }
    } catch (err: any) {
      setError("Failed to fetch tracking information. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const steps = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];

  return (
    <main className="section page-enter" style={{ padding: "40px 16px", minHeight: "75vh" }}>
      <div className="container" style={{ maxWidth: 720, margin: "0 auto" }}>
        <div className="card pad" style={{ textAlign: "center", padding: "40px 24px", marginBottom: 32 }}>
          <p className="eyebrow">Real-Time Delivery Status</p>
          <h1 style={{ fontSize: "clamp(24px, 4vw, 36px)", margin: "10px 0 12px 0" }}>Track Your Order</h1>
          <p style={{ fontSize: 15, color: "var(--muted)", lineHeight: 1.6, marginBottom: 28 }}>
            Enter your Order Reference ID or registered phone number to check live shipment status.
          </p>

          <form onSubmit={handleSearch} style={{ display: "flex", gap: 10, maxWidth: 500, margin: "0 auto" }}>
            <input
              type="text"
              placeholder="e.g. Order ID (#...) or Phone Number"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input"
              style={{ flex: 1, padding: "12px 16px", fontSize: 14 }}
              required
            />
            <button type="submit" className="btn" disabled={loading} style={{ padding: "12px 24px" }}>
              {loading ? "Searching..." : "Track Order"}
            </button>
          </form>

          {error && <p style={{ color: "var(--error)", fontSize: 14, marginTop: 16, fontWeight: 500 }}>{error}</p>}
        </div>

        {/* Tracking Result Card */}
        {result && (
          <div className="card pad" style={{ padding: "32px 24px", animation: "fadeInUp 0.4s ease forwards" }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", borderBottom: "1px solid var(--line)", paddingBottom: 16, marginBottom: 24 }}>
              <div>
                <span style={{ fontSize: 12, color: "var(--muted)", display: "block" }}>ORDER REFERENCE</span>
                <h3 style={{ margin: 0, fontSize: 20, color: "var(--sage-dark)" }}>#{result.order.id}</h3>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>Placed on {new Date(result.order.createdAt).toLocaleString("en-IN")}</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 12, color: "var(--muted)", display: "block" }}>STATUS</span>
                <span className="btn" style={{ padding: "4px 12px", fontSize: 12, pointerEvents: "none", backgroundColor: "var(--sage-dark)" }}>
                  {result.order.status}
                </span>
                {result.tracking.trackingNumber ? (
                  <span style={{ fontSize: 12, color: "var(--muted)", display: "block", marginTop: 4 }}>
                    AWB Tracking: <strong>{result.tracking.trackingNumber}</strong>
                  </span>
                ) : null}
              </div>
            </div>

            {/* Stepper Timeline */}
            <div style={{ margin: "24px 0" }}>
              <h4 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--muted)", marginBottom: 16 }}>Shipment Lifecycle</h4>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${steps.length}, 1fr)`, gap: 4, textAlign: "center", position: "relative" }}>
                {steps.map((st, idx) => {
                  const currentIdx = steps.indexOf(result.order.status.toUpperCase());
                  const isCompleted = currentIdx >= idx;
                  const isCurrent = currentIdx === idx;
                  return (
                    <div key={st} style={{ fontSize: 11, fontWeight: 600 }}>
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          backgroundColor: isCompleted ? "#16a34a" : "#cbd5e1",
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto 6px auto",
                          border: isCurrent ? "3px solid #bbf7d0" : undefined,
                        }}
                      >
                        {isCompleted ? "✓" : idx + 1}
                      </div>
                      <span style={{ color: isCompleted ? "#16a34a" : "var(--muted)" }}>{st.replace(/_/g, " ")}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detailed Timeline History */}
            {result.tracking.history && result.tracking.history.length > 0 && (
              <div style={{ borderTop: "1px solid var(--line)", paddingTop: 16, marginTop: 24 }}>
                <h4 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--muted)", marginBottom: 12 }}>Activity History</h4>
                <div style={{ display: "grid", gap: 12 }}>
                  {result.tracking.history.map((h, idx) => (
                    <div key={idx} style={{ display: "flex", gap: 14, fontSize: 13, alignItems: "start" }}>
                      <span style={{ color: "var(--muted)", fontSize: 12, minWidth: 140 }}>{new Date(h.timestamp).toLocaleString("en-IN")}</span>
                      <div>
                        <strong style={{ color: "var(--ink)" }}>{h.status}</strong>
                        {h.notes ? <p style={{ margin: "2px 0 0 0", color: "var(--muted)" }}>{h.notes}</p> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ textAlign: "center", borderTop: "1px solid var(--line)", paddingTop: 20, marginTop: 24 }}>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 10px 0" }}>Need help with this delivery?</p>
              <a
                className="btn soft"
                href={`https://wa.me/${clinic.whatsapp}?text=Hello%2C%20I%20need%20help%20with%20Order%20%23${result.order.id}`}
                target="_blank"
                rel="noreferrer"
                style={{ padding: "8px 16px", fontSize: 13 }}
              >
                💬 Chat with Clinic Support on WhatsApp
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
