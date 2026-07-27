"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "ORDER" | "PAYMENT" | "INVENTORY" | "SYSTEM";
  orderId?: string | null;
  isRead: boolean;
  createdAt: string;
}

export function AdminNotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [toastNotification, setToastNotification] = useState<NotificationItem | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const knownNotificationIds = useRef<Set<string>>(new Set());
  const initialLoadDone = useRef(false);

  // Synthesize Web Audio notification chime for new order
  const playNotificationChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio playback quiet fallback if user has not interacted with document yet
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/admin/notifications?limit=8");
      if (!res.ok) return;
      const data = await res.json();

      const items: NotificationItem[] = data.notifications || [];
      const newUnreadCount: number = data.unreadCount || 0;

      // Check for newly arrived unread notifications
      if (initialLoadDone.current) {
        const newlyArrived = items.find(
          (item) => !item.isRead && !knownNotificationIds.current.has(item.id)
        );

        if (newlyArrived) {
          playNotificationChime();
          setToastNotification(newlyArrived);
          setTimeout(() => setToastNotification(null), 5000);
        }
      } else {
        initialLoadDone.current = true;
      }

      // Track known IDs
      items.forEach((item) => knownNotificationIds.current.add(item.id));

      setNotifications(items);
      setUnreadCount(newUnreadCount);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Request browser native notification permission on client mount
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    // Real-Time SSE Stream Subscription
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/admin/stream");

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "NOTIFICATION_NEW" && data.payload) {
            const newNotif: NotificationItem = {
              id: data.payload.id || "notif-" + Date.now(),
              title: data.payload.title || "New Notification",
              message: data.payload.message || "",
              type: data.payload.type || "SYSTEM",
              orderId: data.payload.orderId || null,
              isRead: false,
              createdAt: data.payload.createdAt || new Date().toISOString()
            };

            playNotificationChime();

            // Native Browser Desktop Popup Notification
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              try {
                new Notification(newNotif.title, {
                  body: newNotif.message,
                  icon: "/favicon.ico"
                });
              } catch {}
            }

            setToastNotification(newNotif);
            setTimeout(() => setToastNotification(null), 6000);

            setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)]);
            setUnreadCount((prev) => prev + 1);
          } else {
            // Fetch updated unread badge counts on any event
            fetchNotifications();
          }
        } catch (err) {
          console.error("Error parsing SSE event:", err);
        }
      };

      eventSource.onerror = () => {
        // Fallback polling if SSE drops out
      };
    } catch (err) {
      console.warn("SSE not available, falling back to polling:", err);
    }

    const interval = setInterval(fetchNotifications, 15000); // Polling backup

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(interval);
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch("/api/admin/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/admin/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleDelete = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await fetch(`/api/admin/notifications?id=${id}`, {
        method: "DELETE",
      });
      const target = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (target && !target.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="notif-bell-container" ref={dropdownRef}>
      <button
        type="button"
        className="notif-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Admin Notifications"
        aria-expanded={isOpen}
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notif-dropdown" role="menu">
          <div className="notif-dropdown-header">
            <div className="header-title-box">
              <span className="header-title">Notifications</span>
              {unreadCount > 0 && <span className="unread-pill">{unreadCount} new</span>}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                className="mark-all-btn"
                onClick={handleMarkAllRead}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <span>🔕</span>
                <p>No notifications right now.</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`notif-item ${item.isRead ? "read" : "unread"}`}
                  onClick={() => !item.isRead && handleMarkAsRead(item.id)}
                >
                  <div className="notif-item-header">
                    <span className="notif-type-tag">{item.type}</span>
                    <span className="notif-time">{formatTimeAgo(item.createdAt)}</span>
                  </div>

                  <p className="notif-title">{item.title}</p>
                  <p className="notif-message">{item.message}</p>

                  <div className="notif-actions">
                    {item.orderId ? (
                      <Link
                        href={`/admin/orders?search=${item.orderId}`}
                        className="notif-link"
                        onClick={() => setIsOpen(false)}
                      >
                        View Order →
                      </Link>
                    ) : (
                      <span />
                    )}
                    <button
                      type="button"
                      className="notif-del-btn"
                      onClick={(e) => handleDelete(item.id, e)}
                      title="Delete Notification"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="notif-dropdown-footer">
            <Link
              href="/admin/notifications"
              className="view-all-link"
              onClick={() => setIsOpen(false)}
            >
              View All Notifications ({notifications.length})
            </Link>
          </div>
        </div>
      )}

      {/* Real-time Order Toast Notification */}
      {toastNotification && (
        <div className="realtime-toast" role="alert">
          <div className="toast-header">
            <span className="toast-tag">🛒 REAL-TIME ORDER</span>
            <button
              type="button"
              className="toast-close"
              onClick={() => setToastNotification(null)}
            >
              &times;
            </button>
          </div>
          <p className="toast-title">{toastNotification.title}</p>
          <p className="toast-msg">{toastNotification.message}</p>
          {toastNotification.orderId && (
            <Link
              href={`/admin/orders?search=${toastNotification.orderId}`}
              className="toast-action-btn"
              onClick={() => setToastNotification(null)}
            >
              View Order Details
            </Link>
          )}
        </div>
      )}

      <style jsx>{`
        .notif-bell-container {
          position: relative;
          display: inline-block;
        }
        .notif-bell-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          position: relative;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s ease;
        }
        .notif-bell-btn:hover {
          background-color: var(--bg-secondary, #f1f5f9);
        }
        .bell-icon {
          font-size: 20px;
        }
        .notif-badge {
          position: absolute;
          top: 2px;
          right: 2px;
          background-color: #dc2626;
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 10px;
          line-height: 1;
          border: 2px solid #ffffff;
        }
        .notif-dropdown {
          position: absolute;
          right: 0;
          top: 48px;
          width: 360px;
          max-width: 90vw;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
          border: 1px solid var(--line, #e2e8f0);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .notif-dropdown-header {
          padding: 14px 16px;
          border-bottom: 1px solid var(--line, #e2e8f0);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: #f8fafc;
        }
        .header-title-box {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .header-title {
          font-weight: 700;
          font-size: 15px;
          color: var(--ink, #0f172a);
        }
        .unread-pill {
          background-color: #fee2e2;
          color: #991b1b;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 12px;
        }
        .mark-all-btn {
          background: none;
          border: none;
          color: var(--sage-dark, #2d5a27);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .notif-list {
          max-height: 360px;
          overflow-y: auto;
        }
        .notif-empty {
          text-align: center;
          padding: 32px 16px;
          color: var(--muted, #64748b);
          font-size: 14px;
        }
        .notif-item {
          padding: 12px 16px;
          border-bottom: 1px solid var(--line, #f1f5f9);
          transition: background-color 0.2s ease;
          cursor: pointer;
        }
        .notif-item.unread {
          background-color: #f0fdf4;
          border-left: 3px solid #16a34a;
        }
        .notif-item:hover {
          background-color: #f8fafc;
        }
        .notif-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        .notif-type-tag {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--sage-dark, #2d5a27);
          background-color: #e2e8f0;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .notif-time {
          font-size: 11px;
          color: var(--muted, #64748b);
        }
        .notif-title {
          font-weight: 600;
          font-size: 14px;
          color: var(--ink, #0f172a);
          margin: 2px 0;
        }
        .notif-message {
          font-size: 13px;
          color: var(--muted, #475569);
          margin: 0;
          line-height: 1.4;
        }
        .notif-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;
        }
        .notif-link {
          font-size: 12px;
          font-weight: 600;
          color: var(--sage-dark, #2d5a27);
          text-decoration: none;
        }
        .notif-del-btn {
          background: none;
          border: none;
          color: var(--muted, #94a3b8);
          font-size: 16px;
          cursor: pointer;
          padding: 0 4px;
        }
        .notif-del-btn:hover {
          color: #dc2626;
        }
        .notif-dropdown-footer {
          padding: 10px 16px;
          background-color: #f8fafc;
          border-top: 1px solid var(--line, #e2e8f0);
          text-align: center;
        }
        .view-all-link {
          font-size: 13px;
          font-weight: 600;
          color: var(--sage-dark, #2d5a27);
          text-decoration: none;
        }
        .realtime-toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 320px;
          background: #0f172a;
          color: #ffffff;
          padding: 16px;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
          z-index: 9999;
          animation: slideUp 0.3s ease;
          border: 1px solid #334155;
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .toast-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .toast-tag {
          font-size: 11px;
          font-weight: 700;
          color: #4ade80;
          letter-spacing: 0.5px;
        }
        .toast-close {
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 18px;
          cursor: pointer;
        }
        .toast-title {
          font-weight: 700;
          font-size: 15px;
          margin: 0 0 4px 0;
        }
        .toast-msg {
          font-size: 13px;
          color: #cbd5e1;
          margin: 0 0 12px 0;
        }
        .toast-action-btn {
          display: inline-block;
          background-color: #22c55e;
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
          padding: 8px 14px;
          border-radius: 6px;
          text-decoration: none;
        }
      `}</style>
    </div>
  );
}
