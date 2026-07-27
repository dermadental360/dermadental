"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  category?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  link?: string | null;
  orderId?: string | null;
  createdAt: string;
}

export function NotificationToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play Web Audio Chime Synthesizer
  const playChime = (priority?: string) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = priority === "CRITICAL" ? "sawtooth" : "sine";
      
      const startFreq = priority === "CRITICAL" ? 440 : 587.33; // D5
      const endFreq = priority === "CRITICAL" ? 880 : 880; // A5

      osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/admin/stream");
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "NOTIFICATION_NEW" && data.payload) {
            const payload = data.payload;
            const newToast: ToastItem = {
              id: payload.id || "toast-" + Date.now(),
              title: payload.title || "New Notification",
              message: payload.message || "",
              category: payload.category || payload.type || "SYSTEM",
              priority: payload.priority || "MEDIUM",
              link: payload.link || (payload.orderId ? `/admin/orders?search=${payload.orderId}` : null),
              orderId: payload.orderId || null,
              createdAt: payload.createdAt || new Date().toISOString()
            };

            playChime(newToast.priority);

            // Trigger Desktop Push Notification if enabled & granted
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              try {
                new Notification(newToast.title, {
                  body: newToast.message,
                  icon: "/favicon.ico"
                });
              } catch {}
            }

            setToasts((prev) => [newToast, ...prev.slice(0, 4)]); // Keep max 5 visible toasts

            // Auto-hide after 5 seconds
            setTimeout(() => {
              removeToast(newToast.id);
            }, 5000);
          }
        } catch (err) {
          console.error("Toast SSE error:", err);
        }
      };
    } catch (err) {
      console.warn("Toast SSE connection failed:", err);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="region" aria-label="Notifications">
      {toasts.map((toast) => {
        const isCritical = toast.priority === "CRITICAL";
        const isHigh = toast.priority === "HIGH";
        const accentColor = isCritical ? "#ef4444" : isHigh ? "#f97316" : "#22c55e";

        return (
          <div key={toast.id} className={`glass-toast ${toast.priority?.toLowerCase()}`}>
            <div className="toast-top">
              <span className="toast-badge" style={{ backgroundColor: accentColor }}>
                {toast.category || "SYSTEM"}
              </span>
              <button
                type="button"
                className="toast-close-btn"
                onClick={() => removeToast(toast.id)}
                aria-label="Close notification"
              >
                &times;
              </button>
            </div>

            <h4 className="toast-title">{toast.title}</h4>
            <p className="toast-message">{toast.message}</p>

            {toast.link && (
              <Link href={toast.link} className="toast-action-link" onClick={() => removeToast(toast.id)}>
                View Details →
              </Link>
            )}

            {/* 5-second progress countdown bar */}
            <div className="toast-progress-bar">
              <div className="toast-progress-fill" style={{ backgroundColor: accentColor }} />
            </div>
          </div>
        );
      })}

      <style jsx>{`
        .toast-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 99999;
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 360px;
          width: 90vw;
          pointer-events: auto;
        }

        .glass-toast {
          background: rgba(15, 23, 42, 0.88);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #ffffff;
          padding: 14px 16px;
          border-radius: 12px;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
          position: relative;
          overflow: hidden;
          animation: slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .glass-toast.critical {
          border-left: 4px solid #ef4444;
          background: rgba(24, 10, 15, 0.92);
        }

        .glass-toast.high {
          border-left: 4px solid #f97316;
        }

        .toast-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .toast-badge {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          color: #ffffff;
          padding: 2px 7px;
          border-radius: 6px;
        }

        .toast-close-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          font-size: 18px;
          cursor: pointer;
          line-height: 1;
          padding: 0 4px;
        }

        .toast-close-btn:hover {
          color: #ffffff;
        }

        .toast-title {
          font-size: 14px;
          font-weight: 700;
          margin: 0 0 4px 0;
          color: #ffffff;
        }

        .toast-message {
          font-size: 13px;
          color: #cbd5e1;
          margin: 0 0 10px 0;
          line-height: 1.4;
        }

        .toast-action-link {
          display: inline-block;
          font-size: 12px;
          font-weight: 700;
          color: #38bdf8;
          text-decoration: none;
          margin-bottom: 4px;
        }

        .toast-action-link:hover {
          text-decoration: underline;
        }

        .toast-progress-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: rgba(255, 255, 255, 0.1);
        }

        .toast-progress-fill {
          height: 100%;
          width: 100%;
          animation: countdown 5s linear forwards;
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(40px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes countdown {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}
