"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const reason = searchParams.get("reason") || "The payment transaction could not be processed or was cancelled.";

  return (
    <div style={{ maxWidth: 640, margin: "40px auto", padding: "0 16px" }}>
      <div className="card pad" style={{ borderTop: "4px solid #dc2626" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              backgroundColor: "#fee2e2",
              color: "#dc2626",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: "bold",
              marginBottom: 12,
            }}
          >
            ✕
          </div>
          <h1 style={{ fontSize: 26, color: "var(--ink)", margin: 0 }}>Payment Unsuccessful</h1>
          <p style={{ color: "var(--muted)", marginTop: 6, fontSize: 15 }}>
            We were unable to complete your transaction. No money was charged, or any debited amount will be auto-refunded by your bank.
          </p>
        </div>

        <div
          style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fca5a5",
            padding: 16,
            borderRadius: 8,
            fontSize: 14,
            color: "#991b1b",
            marginBottom: 24,
          }}
        >
          <strong>Reason for Failure / Status:</strong>
          <p style={{ margin: "4px 0 0 0" }}>{reason}</p>
          {orderId && (
            <p style={{ margin: "8px 0 0 0", fontSize: 13, color: "#b91c1c" }}>
              Order Reference ID: <strong>{orderId}</strong>
            </p>
          )}
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/checkout" className="btn" style={{ padding: "10px 24px" }}>
            🔄 Retry Checkout
          </Link>
          <Link href="/contact" className="btn soft" style={{ padding: "10px 24px" }}>
            💬 Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <main className="section page-enter">
      <Suspense fallback={<div style={{ textAlign: "center", padding: 48 }}>Loading page...</div>}>
        <PaymentFailedContent />
      </Suspense>
    </main>
  );
}
