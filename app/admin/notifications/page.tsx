"use client";

import { useEffect, useState, useCallback } from "react";
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

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: "15",
        type: activeType,
        ...(searchQuery ? { q: searchQuery } : {}),
      });

      const res = await fetch(`/api/admin/notifications?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setTotalPages(data.totalPages || 1);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [page, activeType, searchQuery]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/admin/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      loadNotifications();
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleMarkRead = async (id: string) => {
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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notification?")) return;
    try {
      await fetch(`/api/admin/notifications?id=${id}`, {
        method: "DELETE",
      });
      loadNotifications();
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} selected notifications?`)) return;
    try {
      await fetch("/api/admin/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      setSelectedIds([]);
      loadNotifications();
    } catch (err) {
      console.error("Failed to delete selected notifications:", err);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === notifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map((n) => n.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <main className="section page-enter">
      <div className="container" style={{ maxWidth: 960 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 20 }}>
          <div>
            <Link href="/admin" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "none" }}>
              ← Back to Admin Dashboard
            </Link>
            <h1 style={{ fontSize: 28, margin: "6px 0 0 0", color: "var(--ink)" }}>
              🔔 Admin Notifications {unreadCount > 0 && <span className="badge">{unreadCount} Unread</span>}
            </h1>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {unreadCount > 0 && (
              <button className="btn soft" onClick={handleMarkAllRead} style={{ fontSize: 13, padding: "8px 14px" }}>
                ✓ Mark All Read
              </button>
            )}
            {selectedIds.length > 0 && (
              <button className="btn soft" onClick={handleDeleteSelected} style={{ fontSize: 13, padding: "8px 14px", color: "#dc2626" }}>
                🗑️ Delete Selected ({selectedIds.length})
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="card pad" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["ALL", "ORDER", "PAYMENT", "INVENTORY", "SYSTEM"].map((t) => (
                <button
                  key={t}
                  className={`tab-btn ${activeType === t ? "active" : ""}`}
                  onClick={() => {
                    setActiveType(t);
                    setPage(1);
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            <div style={{ minWidth: 240, flex: "1 1 240px" }}>
              <input
                className="input"
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                style={{ padding: "8px 14px", fontSize: 14 }}
              />
            </div>
          </div>
        </div>

        {/* Notifications List Card */}
        <div className="card pad" style={{ minHeight: 320 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "48px 16px" }}>
              <div className="spinner" />
              <p style={{ marginTop: 12, color: "var(--muted)" }}>Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 16px" }}>
              <span style={{ fontSize: 40, display: "block", marginBottom: 10 }}>🔕</span>
              <h3 style={{ margin: 0, fontSize: 18, color: "var(--ink)" }}>No notifications found</h3>
              <p style={{ color: "var(--muted)", marginTop: 6, fontSize: 14 }}>
                {searchQuery || activeType !== "ALL"
                  ? "Try clearing your filters or search terms."
                  : "New system and order alerts will appear here."}
              </p>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 12, borderBottom: "1px solid var(--line)", marginBottom: 12 }}>
                <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.length === notifications.length && notifications.length > 0}
                    onChange={toggleSelectAll}
                  />
                  Select All Page Items
                </label>
                <span style={{ fontSize: 13, color: "var(--muted)" }}>
                  Showing {notifications.length} item(s)
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`notif-card-row ${notif.isRead ? "read" : "unread"}`}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(notif.id)}
                        onChange={() => toggleSelect(notif.id)}
                        style={{ marginTop: 4 }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                          <span className="type-badge">{notif.type}</span>
                          <span style={{ fontSize: 12, color: "var(--muted)" }}>
                            {new Date(notif.createdAt).toLocaleString()}
                          </span>
                          {!notif.isRead && <span className="unread-dot">New</span>}
                        </div>
                        <h4 style={{ margin: "2px 0 4px 0", fontSize: 15, color: "var(--ink)" }}>
                          {notif.title}
                        </h4>
                        <p style={{ margin: 0, fontSize: 14, color: "var(--muted)", lineHeight: 1.4 }}>
                          {notif.message}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10, alignSelf: "flex-end" }}>
                      {notif.orderId && (
                        <Link
                          href={`/admin/orders?search=${notif.orderId}`}
                          className="btn soft"
                          style={{ padding: "6px 12px", fontSize: 12 }}
                        >
                          View Order
                        </Link>
                      )}
                      {!notif.isRead && (
                        <button
                          className="btn soft"
                          onClick={() => handleMarkRead(notif.id)}
                          style={{ padding: "6px 12px", fontSize: 12 }}
                        >
                          Mark Read
                        </button>
                      )}
                      <button
                        className="btn soft"
                        onClick={() => handleDelete(notif.id)}
                        style={{ padding: "6px 10px", fontSize: 12, color: "#dc2626" }}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
                  <button
                    className="btn soft"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    style={{ fontSize: 13, padding: "8px 16px" }}
                  >
                    ← Previous
                  </button>
                  <span style={{ fontSize: 14, color: "var(--muted)" }}>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    className="btn soft"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    style={{ fontSize: 13, padding: "8px 16px" }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .badge {
          background-color: #fee2e2;
          color: #991b1b;
          font-size: 12px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 12px;
          margin-left: 10px;
        }
        .tab-btn {
          background: var(--bg-secondary, #f8fafc);
          border: 1px solid var(--line, #e2e8f0);
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .tab-btn.active {
          background: var(--sage-dark, #2d5a27);
          color: #ffffff;
          border-color: var(--sage-dark, #2d5a27);
        }
        .notif-card-row {
          padding: 14px;
          border-radius: 8px;
          border: 1px solid var(--line, #e2e8f0);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          transition: background-color 0.2s ease;
        }
        .notif-card-row.unread {
          background-color: #f0fdf4;
          border-left: 4px solid #16a34a;
        }
        .type-badge {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          background-color: #e2e8f0;
          color: var(--sage-dark, #2d5a27);
          padding: 2px 8px;
          border-radius: 4px;
        }
        .unread-dot {
          background-color: #16a34a;
          color: #ffffff;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--line, #e2e8f0);
          border-top-color: var(--sage-dark, #2d5a27);
          border-radius: 50%;
          margin: 0 auto;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </main>
  );
}
