"use client";

import React from "react";

export type OrderWorkflowStatus =
  | "PLACED"
  | "CONFIRMED"
  | "PROCESSING"
  | "PACKED"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

interface OrderTimelineProps {
  status: string;
  paymentMethod?: string;
  paymentStatus?: string;
}

const STEPS: { key: OrderWorkflowStatus; label: string; icon: string }[] = [
  { key: "PLACED", label: "Order Placed", icon: "🛒" },
  { key: "CONFIRMED", label: "Confirmed", icon: "✓" },
  { key: "PROCESSING", label: "Processing", icon: "⚙️" },
  { key: "PACKED", label: "Packed", icon: "📦" },
  { key: "SHIPPED", label: "Shipped", icon: "🚚" },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: "🛵" },
  { key: "DELIVERED", label: "Delivered", icon: "🏠" },
];

export function OrderTimeline({ status, paymentMethod, paymentStatus }: OrderTimelineProps) {
  const currentStatusNormalized = (status || "PLACED").toUpperCase();
  const isCancelled = currentStatusNormalized === "CANCELLED";

  // Determine active step index
  const activeIndex = STEPS.findIndex((s) => s.key === currentStatusNormalized);
  const currentStepIdx = activeIndex !== -1 ? activeIndex : 0;

  return (
    <div className="order-timeline-wrapper">
      {isCancelled ? (
        <div className="timeline-cancelled-banner">
          <span className="icon">❌</span>
          <div>
            <strong>Order Cancelled</strong>
            <p>This order has been cancelled by customer or clinic administration.</p>
          </div>
        </div>
      ) : (
        <div className="timeline-steps-grid">
          {STEPS.map((step, index) => {
            const isCompleted = index <= currentStepIdx;
            const isCurrent = index === currentStepIdx;

            return (
              <div
                key={step.key}
                className={`timeline-step-item ${isCompleted ? "completed" : ""} ${isCurrent ? "current" : ""}`}
              >
                <div className="step-circle">
                  <span>{step.icon}</span>
                </div>
                <span className="step-label">{step.label}</span>
                {index < STEPS.length - 1 && <div className={`step-connector ${index < currentStepIdx ? "filled" : ""}`} />}
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .order-timeline-wrapper {
          margin: 16px 0;
          padding: 16px;
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid var(--line, #e2e8f0);
        }

        .timeline-cancelled-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          background: #fee2e2;
          color: #991b1b;
          border-radius: 8px;
          font-size: 14px;
        }

        .timeline-cancelled-banner p {
          margin: 2px 0 0 0;
          font-size: 13px;
          opacity: 0.9;
        }

        .timeline-steps-grid {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          position: relative;
          overflow-x: auto;
          padding-bottom: 8px;
          scrollbar-width: thin;
        }

        .timeline-step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          flex: 1;
          min-width: 80px;
        }

        .step-circle {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #f1f5f9;
          border: 2px solid #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          z-index: 2;
          transition: all 0.3s ease;
        }

        .timeline-step-item.completed .step-circle {
          background: #16a34a;
          border-color: #16a34a;
          color: #ffffff;
        }

        .timeline-step-item.current .step-circle {
          background: #2d5a27;
          border-color: #16a34a;
          color: #ffffff;
          box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.2);
          transform: scale(1.1);
        }

        .step-label {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          margin-top: 8px;
          text-align: center;
          line-height: 1.2;
        }

        .timeline-step-item.completed .step-label {
          color: #0f172a;
          font-weight: 700;
        }

        .step-connector {
          position: absolute;
          top: 18px;
          left: 50%;
          right: -50%;
          height: 3px;
          background: #e2e8f0;
          z-index: 1;
        }

        .step-connector.filled {
          background: #16a34a;
        }
      `}</style>
    </div>
  );
}
