"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  category?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  orderId?: string | null;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

const CATEGORIES = [
  { id: "ALL", label: "All" },
  { id: "ORDERS", label: "Orders" },
  { id: "SALES", label: "Sales" },
  { id: "REVIEWS", label: "Reviews" },
  { id: "CUSTOMERS", label: "Customers" },
  { id: "INVENTORY", label: "Inventory" },
  { id: "INQUIRIES", label: "Inquiries" },
  { id: "PRODUCTS", label: "Products" },
  { id: "COUPONS", label: "Coupons" },
  { id: "SYSTEM", label: "System" },
  { id: "ADMIN", label: "Admin" },
];

export function AdminNotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const categoryParam = activeCategory !== "ALL" ? `&category=${activeCategory}` : "";
      const queryParam = searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : "";
      const res = await fetch(`/api/admin/notifications?limit=25${categoryParam}${queryParam}`);
      if (!res.ok) return;
      const data = await res.json();

      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Request desktop notifications permission
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    // Subscribe to SSE stream
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/admin/stream");
      eventSource.onmessage = () => {
        fetchNotifications();
      };
    } catch (err) {
      console.warn("Notification bell SSE error:", err);
    }

    const interval = setInterval(fetchNotifications, 15000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(interval);
    };
  }, [activeCategory, searchQuery]);

  // Close drawer on click outside
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
      console.error("Failed to mark all read:", err);
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

  const getPriorityDot = (priority?: string) => {
    if (priority === "CRITICAL") return <span className="p-dot critical" title="Critical Priority">🔴</span>;
    if (priority === "HIGH") return <span className="p-dot high" title="High Priority">🟠</span>;
    if (priority === "LOW") return <span className="p-dot low" title="Low Priority">⚪</span>;
    return <span className="p-dot medium" title="Medium Priority">🔵</span>;
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
          {/* Header */}
          <div className="notif-dropdown-header">
            <div className="header-title-box">
              <span className="header-title">Notification Center</span>
              {unreadCount > 0 && <span className="unread-pill">{unreadCount} unread</span>}
            </div>
            {unreadCount > 0 && (
              <button type="button" className="mark-all-btn" onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className="notif-search-box">
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="notif-search-input"
            />
          </div>

          {/* Category Filter Tabs */}
          <div className="notif-categories-bar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`category-tab ${activeCategory === cat.id ? "active" : ""}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <span>🔕</span>
                <p>No notifications found in {activeCategory} category.</p>
              </div>
            ) : (
              notifications.map((item) => {
                const targetLink = item.link || (item.orderId ? `/admin/orders?search=${item.orderId}` : null);

                return (
                  <div
                    key={item.id}
                    className={`notif-item ${item.isRead ? "read" : "unread"}`}
                    onClick={() => !item.isRead && handleMarkAsRead(item.id)}
                  >
                    <div className="notif-item-header">
                      <div className="notif-tags">
                        {getPriorityDot(item.priority)}
                        <span className="notif-type-tag">{item.category || item.type}</span>
                      </div>
                      <span className="notif-time">{formatTimeAgo(item.createdAt)}</span>
                    </div>

                    <p className="notif-title">{item.title}</p>
                    <p className="notif-message">{item.message}</p>

                    <div className="notif-actions">
                      {targetLink ? (
                        <Link
                          href={targetLink}
                          className="notif-link"
                          onClick={() => setIsOpen(false)}
                        >
                          View Related →
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
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="notif-dropdown-footer">
            <Link href="/admin/notifications" className="view-all-link" onClick={() => setIsOpen(false)}>
              View Notification History & Analytics →
            </Link>
          </div>
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
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        .notif-dropdown {
          position: absolute;
          right: 0;
          top: 48px;
          width: 380px;
          max-width: 92vw;
          background: #ffffff;
          border-radius: 14px;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.18);
          border: 1px solid var(--line, #e2e8f0);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
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
        .notif-search-box {
          padding: 8px 12px;
          background-color: #ffffff;
          border-bottom: 1px solid #f1f5f9;
        }
        .notif-search-input {
          width: 100%;
          padding: 6px 12px;
          border-radius: 6px;
          border: 1px solid #cbd5e1;
          font-size: 12px;
          outline: none;
        }
        .notif-categories-bar {
          display: flex;
          gap: 6px;
          padding: 8px 12px;
          overflow-x: auto;
          background-color: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          scrollbar-width: thin;
        }
        .category-tab {
          background: none;
          border: 1px solid #cbd5e1;
          color: #475569;
          font-size: 11px;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 12px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }
        .category-tab.active {
          background-color: #0f172a;
          color: #ffffff;
          border-color: #0f172a;
        }
        .notif-list {
          max-height: 360px;
          overflow-y: auto;
        }
        .notif-empty {
          text-align: center;
          padding: 32px 16px;
          color: var(--muted, #64748b);
          font-size: 13px;
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
        .notif-tags {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .p-dot {
          font-size: 10px;
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
          font-size: 13px;
          color: var(--ink, #0f172a);
          margin: 2px 0;
        }
        .notif-message {
          font-size: 12px;
          color: var(--muted, #475569);
          margin: 0;
          line-height: 1.4;
        }
        .notif-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 6px;
        }
        .notif-link {
          font-size: 11px;
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
          font-size: 12px;
          font-weight: 600;
          color: var(--sage-dark, #2d5a27);
          text-decoration: none;
        }
      `}</style>
    </div>
  );
}
