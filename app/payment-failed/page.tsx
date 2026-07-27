"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const reason = searchParams.get("reason") || "The payment transaction could not be processed or was cancelled.";

  return (
    <div className="failed-wrapper">
      <div className="card pad failed-card">
        <div className="failed-header">
          <div className="failed-icon" aria-hidden="true">
            ✕
          </div>
          <h1 className="failed-title">Payment Unsuccessful</h1>
          <p className="failed-subtitle">
            We were unable to complete your transaction. No money was charged, or any debited amount will be auto-refunded by your bank.
          </p>
        </div>

        <div className="error-box">
          <strong className="error-box-title">Reason for Failure / Status:</strong>
          <p className="error-box-reason">{reason}</p>
          {orderId && (
            <p className="error-box-order">
              Order Reference ID: <strong>{orderId}</strong>
            </p>
          )}
        </div>

        <div className="action-buttons-row">
          <Link href="/checkout" className="btn action-btn retry-btn">
            🔄 Retry Checkout
          </Link>
          <Link href="/contact" className="btn soft action-btn support-btn">
            💬 Contact Support
          </Link>
        </div>
      </div>

      <style jsx>{`
        .failed-wrapper {
          max-width: 640px;
          margin: 32px auto;
          padding: 0 16px;
          overflow-x: hidden;
        }
        .failed-card {
          border-top: 4px solid #dc2626;
          border-radius: 12px;
        }
        .failed-header {
          text-align: center;
          margin-bottom: 20px;
        }
        .failed-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background-color: #fee2e2;
          color: #dc2626;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 12px;
        }
        .failed-title {
          font-size: clamp(1.4rem, 4vw, 1.8rem);
          color: var(--ink, #0f172a);
          margin: 0;
        }
        .failed-subtitle {
          color: var(--muted, #64748b);
          margin-top: 6px;
          font-size: 15px;
          line-height: 1.5;
        }
        .error-box {
          background-color: #fef2f2;
          border: 1px solid #fca5a5;
          padding: 16px;
          border-radius: 8px;
          font-size: 14px;
          color: #991b1b;
          margin-bottom: 24px;
          word-break: break-word;
        }
        .error-box-title {
          display: block;
          margin-bottom: 4px;
        }
        .error-box-reason {
          margin: 0;
          line-height: 1.4;
        }
        .error-box-order {
          margin: 8px 0 0 0;
          font-size: 13px;
          color: #b91c1c;
        }
        .action-buttons-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
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
          .action-buttons-row {
            flex-direction: column;
          }
          .action-btn {
            width: 100%;
            min-width: 100%;
          }
        }
      `}</style>
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
