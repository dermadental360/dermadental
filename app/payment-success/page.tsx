"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const paymentId = searchParams.get("paymentId");

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    fetch("/api/orders")
      .then((res) => res.json())
      .then((orders: any[]) => {
        const found = orders.find((o) => String(o._id) === String(orderId));
        if (found) setOrder(found);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [orderId]);

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div className="card pad" style={{ textAlign: "center", padding: 48, maxWidth: 600, margin: "40px auto" }}>
        <h2>Verifying Payment Status...</h2>
        <p style={{ color: "var(--muted)", marginTop: 8 }}>Please wait while we retrieve your invoice.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: "0 16px" }}>
      <div className="card pad" style={{ borderTop: "4px solid #16a34a" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              backgroundColor: "#dcfce7",
              color: "#15803d",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: "bold",
              marginBottom: 12,
            }}
          >
            ✓
          </div>
          <h1 style={{ fontSize: 26, color: "var(--ink)", margin: 0 }}>Payment Successful!</h1>
          <p style={{ color: "var(--muted)", marginTop: 6, fontSize: 15 }}>
            Thank you for your order with DermaDental 360. Your payment has been verified.
          </p>
        </div>

        <div
          style={{
            backgroundColor: "var(--bg-secondary, #f8fafc)",
            padding: 16,
            borderRadius: 8,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
            fontSize: 14,
            marginBottom: 24,
          }}
        >
          <div>
            <strong style={{ display: "block", color: "var(--muted)", fontSize: 12, textTransform: "uppercase" }}>
              Order Reference
            </strong>
            <span style={{ fontWeight: 600, fontSize: 15 }}>{orderId || "N/A"}</span>
          </div>

          <div>
            <strong style={{ display: "block", color: "var(--muted)", fontSize: 12, textTransform: "uppercase" }}>
              Razorpay Payment ID
            </strong>
            <span style={{ fontWeight: 600, fontSize: 15 }}>{paymentId || "N/A"}</span>
          </div>

          <div>
            <strong style={{ display: "block", color: "var(--muted)", fontSize: 12, textTransform: "uppercase" }}>
              Payment Status
            </strong>
            <span style={{ fontWeight: 700, color: "#16a34a" }}>PAID & VERIFIED</span>
          </div>
        </div>

        {order && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, borderBottom: "1px solid var(--line)", paddingBottom: 8, marginBottom: 12 }}>
              Customer & Shipping Details
            </h3>
            <p style={{ margin: "4px 0", fontSize: 14 }}>
              <strong>Name:</strong> {order.customer?.name}
            </p>
            <p style={{ margin: "4px 0", fontSize: 14 }}>
              <strong>Phone:</strong> {order.customer?.phone}
            </p>
            {order.customer?.email && (
              <p style={{ margin: "4px 0", fontSize: 14 }}>
                <strong>Email:</strong> {order.customer.email}
              </p>
            )}
            <p style={{ margin: "4px 0", fontSize: 14 }}>
              <strong>Address:</strong> {order.customer?.address}
            </p>

            <h3
              style={{
                fontSize: 16,
                borderBottom: "1px solid var(--line)",
                paddingBottom: 8,
                marginTop: 20,
                marginBottom: 12,
              }}
            >
              Order Items
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {order.items?.map((item: any, idx: number) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                  <span>
                    {item.quantity} x {item.name}
                  </span>
                  <span style={{ fontWeight: 600 }}>₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderTop: "2px solid var(--line)",
                paddingTop: 12,
                marginTop: 14,
                fontSize: 18,
                fontWeight: 800,
              }}
            >
              <span>Total Paid:</span>
              <span style={{ color: "var(--sage-dark, #2d5a27)" }}>₹{order.total}</span>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginTop: 24 }}>
          <button className="btn soft" onClick={handlePrint} style={{ padding: "10px 20px" }}>
            🖨️ Print / Download Invoice
          </button>

          <Link href="/shop" className="btn" style={{ padding: "10px 20px" }}>
            Return to Shop
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <main className="section page-enter">
      <Suspense fallback={<div style={{ textAlign: "center", padding: 48 }}>Loading page...</div>}>
        <PaymentSuccessContent />
      </Suspense>
    </main>
  );
}
