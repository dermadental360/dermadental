"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { OrderTimeline } from "@/components/OrderTimeline";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const paymentId = searchParams.get("paymentId");
  const method = searchParams.get("method") || "RAZORPAY";

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
        const found = orders.find((o) => String(o._id) === String(orderId) || String(o.id) === String(orderId));
        if (found) setOrder(found);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [orderId]);

  function handlePrint() {
    if (typeof window !== "undefined") {
      window.print();
    }
  }

  const isCod = method === "COD" || order?.paymentMethod === "COD";

  if (loading) {
    return (
      <div className="card pad loading-card">
        <div className="spinner-center" />
        <h2>{isCod ? "Retrieving Order Details..." : "Verifying Payment Status..."}</h2>
        <p className="subtext">Please wait while we retrieve your order confirmation.</p>
        <style jsx>{`
          .loading-card {
            text-align: center;
            padding: 48px 24px;
            max-width: 540px;
            margin: 40px auto;
          }
          .spinner-center {
            width: 36px;
            height: 36px;
            border: 3px solid var(--line, #e2e8f0);
            border-top-color: var(--sage-dark, #2d5a27);
            border-radius: 50%;
            margin: 0 auto 16px;
            animation: spin 0.8s linear infinite;
          }
          .subtext {
            color: var(--muted, #64748b);
            margin-top: 8px;
            font-size: 14px;
          }
          @keyframes spin {
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="success-wrapper">
      <div className="card pad success-card" style={{ borderTopColor: isCod ? "#ca8a04" : "#16a34a" }}>
        <div className="success-header">
          <div className="success-icon" style={{ backgroundColor: isCod ? "#fef9c3" : "#dcfce7", color: isCod ? "#854d0e" : "#15803d" }} aria-hidden="true">
            {isCod ? "📦" : "✓"}
          </div>
          <h1 className="success-title">
            {isCod ? "Cash on Delivery Order Placed!" : "Payment Successful!"}
          </h1>
          <p className="success-subtitle">
            {isCod
              ? "Your Cash on Delivery order has been placed successfully. Please keep the payable amount ready at the time of delivery."
              : "Thank you for your order with DermaDental 360. Your payment has been verified."}
          </p>
        </div>

        {/* Order Progress Timeline */}
        <OrderTimeline
          status={order?.status || "PLACED"}
          paymentMethod={isCod ? "COD" : "RAZORPAY"}
          paymentStatus={order?.paymentStatus || (isCod ? "PENDING" : "PAID")}
        />

        <div className="meta-grid">
          <div className="meta-box">
            <span className="meta-label">Order Reference</span>
            <span className="meta-value">{orderId || "N/A"}</span>
          </div>

          <div className="meta-box">
            <span className="meta-label">Payment Method</span>
            <span className="meta-value" style={{ color: "#0f172a", fontWeight: 700 }}>
              {isCod ? "💵 Cash on Delivery (COD)" : "💳 Razorpay Online"}
            </span>
          </div>

          <div className="meta-box">
            <span className="meta-label">Payment Status</span>
            <span className="status-badge" style={{ color: isCod ? "#ca8a04" : "#16a34a" }}>
              {isCod ? "🟡 PENDING (Pay on Delivery)" : "🟢 PAID & VERIFIED"}
            </span>
          </div>

          <div className="meta-box">
            <span className="meta-label">Estimated Delivery</span>
            <span className="meta-value">3 to 5 Business Days</span>
          </div>
        </div>

        {order && (
          <div className="order-details-section">
            <h2 className="section-title">Customer & Shipping Details</h2>
            <div className="info-list">
              <p><strong>Name:</strong> {order.customer?.name}</p>
              <p><strong>Phone:</strong> {order.customer?.phone}</p>
              {order.customer?.email && <p><strong>Email:</strong> {order.customer.email}</p>}
              <p><strong>Address:</strong> {order.customer?.address}</p>
            </div>

            <h2 className="section-title" style={{ marginTop: 24 }}>Order Items</h2>
            <div className="items-list">
              {order.items?.map((item: any, idx: number) => (
                <div key={idx} className="item-row">
                  <span className="item-name">
                    {item.quantity} x {item.name}
                  </span>
                  <span className="item-price">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--line, #e2e8f0)", fontSize: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted, #64748b)" }}>
                <span>Subtotal:</span>
                <span style={{ fontWeight: 600, color: "var(--ink, #0f172a)" }}>
                  ₹{order.subtotal || order.items?.reduce((s: number, i: any) => s + i.price * i.quantity, 0) || order.total}
                </span>
              </div>

              {(order.discountAmount > 0 || order.discountType === "PREPAID") && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "#16a34a", fontWeight: 600 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span>Prepaid Discount (5%):</span>
                    <span style={{ background: "#16a34a", color: "#ffffff", fontSize: 10, padding: "1px 6px", borderRadius: 4, fontWeight: 800 }}>5% OFF</span>
                  </div>
                  <span>-₹{order.discountAmount || Math.round((order.subtotal || order.total) * 0.05)}</span>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted, #64748b)" }}>
                <span>Shipping Charge:</span>
                {order.shippingCharge === 0 || (order.subtotal || order.total) >= 999 ? (
                  <span style={{ color: "#16a34a", fontWeight: 700 }}>FREE</span>
                ) : (
                  <span style={{ fontWeight: 600, color: "var(--ink, #0f172a)" }}>₹{order.shippingCharge || 99}</span>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted, #64748b)" }}>
                <span>Taxes:</span>
                <span style={{ fontWeight: 600, color: "var(--ink, #0f172a)" }}>₹0</span>
              </div>

              {order.codFee > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted, #64748b)" }}>
                  <span>COD Handling Fee:</span>
                  <span style={{ fontWeight: 600, color: "var(--ink, #0f172a)" }}>+₹{order.codFee}</span>
                </div>
              )}
            </div>

            <div className="total-row">
              <span>{isCod ? "Total Payable Amount:" : "Grand Total Paid:"}</span>
              <span className="total-amount">₹{order.finalAmount || order.total}</span>
            </div>
          </div>
        )}

        <div className="action-buttons-row">
          <button
            type="button"
            className="btn soft action-btn print-btn"
            onClick={handlePrint}
            aria-label="Print or download receipt invoice"
          >
            🖨️ Print / Download Invoice
          </button>

          <Link href="/shop" className="btn action-btn shop-btn">
            Return to Shop
          </Link>
        </div>
      </div>

      <style jsx>{`
        .success-wrapper {
          max-width: 720px;
          margin: 32px auto;
          padding: 0 16px;
          overflow-x: hidden;
        }
        .success-card {
          border-top: 4px solid #16a34a;
          border-radius: 12px;
        }
        .success-header {
          text-align: center;
          margin-bottom: 24px;
        }
        .success-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background-color: #dcfce7;
          color: #15803d;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 12px;
        }
        .success-title {
          font-size: clamp(1.4rem, 4vw, 1.8rem);
          color: var(--ink, #0f172a);
          margin: 0;
        }
        .success-subtitle {
          color: var(--muted, #64748b);
          margin-top: 6px;
          font-size: 15px;
        }
        .meta-grid {
          background-color: var(--bg-secondary, #f8fafc);
          padding: 16px;
          border-radius: 8px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
          font-size: 14px;
          margin-bottom: 24px;
        }
        .meta-box {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .meta-label {
          color: var(--muted, #64748b);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .meta-value {
          font-weight: 600;
          font-size: 14px;
          word-break: break-all;
          color: var(--ink, #0f172a);
        }
        .status-badge {
          font-weight: 700;
          color: #16a34a;
          font-size: 14px;
        }
        .order-details-section {
          margin-bottom: 24px;
        }
        .section-title {
          font-size: 16px;
          border-bottom: 1px solid var(--line, #e2e8f0);
          padding-bottom: 8px;
          margin-bottom: 12px;
          color: var(--ink, #0f172a);
        }
        .info-list p {
          margin: 6px 0;
          font-size: 14px;
          line-height: 1.5;
          word-break: break-word;
        }
        .items-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .item-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          gap: 12px;
        }
        .item-name {
          word-break: break-word;
          color: var(--ink, #0f172a);
        }
        .item-price {
          font-weight: 600;
          white-space: nowrap;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          border-top: 2px solid var(--line, #e2e8f0);
          padding-top: 12px;
          margin-top: 14px;
          font-size: 18px;
          font-weight: 800;
        }
        .total-amount {
          color: var(--sage-dark, #2d5a27);
        }
        .action-buttons-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
          margin-top: 24px;
        }
        .action-btn {
          min-height: 48px;
          padding: 12px 24px;
          font-size: 15px;
          font-weight: 600;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 1;
          min-width: 200px;
        }

        @media (max-width: 480px) {
          .meta-grid {
            grid-template-columns: 1fr;
          }
          .action-buttons-row {
            flex-direction: column;
          }
          .action-btn {
            width: 100%;
            min-width: 100%;
          }
        }

        @media print {
          .action-buttons-row {
            display: none !important;
          }
        }
      `}</style>
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
