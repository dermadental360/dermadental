"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminNotificationSettings } from "./AdminNotificationSettings";

interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  type: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  orderId?: string | null;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

const CATEGORIES = [
  { id: "ALL", label: "All Categories" },
  { id: "ORDERS", label: "📦 Orders" },
  { id: "SALES", label: "💰 Sales" },
  { id: "REVIEWS", label: "⭐ Reviews" },
  { id: "CUSTOMERS", label: "👤 Customers" },
  { id: "INVENTORY", label: "⚠ Inventory" },
  { id: "INQUIRIES", label: "📩 Inquiries" },
  { id: "PRODUCTS", label: "🧴 Products" },
  { id: "COUPONS", label: "🎟 Coupons" },
  { id: "SYSTEM", label: "🚨 System" },
  { id: "ADMIN", label: "🔑 Admin" },
];

export function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [category, setCategory] = useState("ALL");
  const [priority, setPriority] = useState("ALL");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);

  // Selection & Modal States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"history" | "settings">("history");

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
        category,
        priority,
        q: search,
        startDate,
        endDate
      });

      const res = await fetch(`/api/admin/notifications?${params.toString()}`);
      if (!res.ok) return;
      const data = await res.json();

      setNotifications(data.notifications || []);
      setTotalCount(data.totalCount || 0);
      setUnreadCount(data.unreadCount || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Failed to load notification history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/admin/stream");
      eventSource.onmessage = () => {
        loadNotifications();
      };
    } catch (err) {
      console.warn("History SSE failed:", err);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [category, priority, search, startDate, endDate, page]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(notifications.map((n) => n.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleMarkSelectedRead = async () => {
    if (selectedIds.length === 0) return;
    try {
      await fetch("/api/admin/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      setSelectedIds([]);
      loadNotifications();
    } catch (err) {
      alert("Failed to mark selected as read");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected notification(s)?`)) return;
    try {
      await fetch("/api/admin/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      setSelectedIds([]);
      loadNotifications();
    } catch (err) {
      alert("Failed to delete selected notifications");
    }
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams({
      format: "csv",
      category,
      priority,
      q: search,
      startDate,
      endDate
    });
    window.open(`/api/admin/notifications?${params.toString()}`, "_blank");
  };

  const getPriorityBadge = (p?: string) => {
    if (p === "CRITICAL") return <span className="p-tag critical">CRITICAL 🔴</span>;
    if (p === "HIGH") return <span className="p-tag high">HIGH 🟠</span>;
    if (p === "LOW") return <span className="p-tag low">LOW ⚪</span>;
    return <span className="p-tag medium">MEDIUM 🔵</span>;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      
      {/* Header & Sub-Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <p className="eyebrow">Admin Center</p>
          <h1 style={{ margin: "4px 0 0 0", fontSize: 28 }}>Notifications Management</h1>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            className={`btn ${activeTab === "history" ? "" : "secondary"}`}
            onClick={() => setActiveTab("history")}
            style={{ borderRadius: 8, padding: "8px 16px", fontSize: 13 }}
          >
            📋 Notification History ({totalCount})
          </button>
          <button
            className={`btn ${activeTab === "settings" ? "" : "secondary"}`}
            onClick={() => setActiveTab("settings")}
            style={{ borderRadius: 8, padding: "8px 16px", fontSize: 13 }}
          >
            ⚙️ Notification Preferences
          </button>
        </div>
      </div>

      {activeTab === "settings" ? (
        <AdminNotificationSettings />
      ) : (
        <>
          {/* Controls & Filter Bar */}
          <div className="card pad" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            
            {/* Category Tabs */}
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setCategory(cat.id); setPage(1); }}
                  className={`btn ${category === cat.id ? "" : "secondary"}`}
                  style={{
                    fontSize: 12,
                    padding: "6px 14px",
                    borderRadius: 20,
                    whiteSpace: "nowrap"
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Filter Inputs Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              
              <input
                type="text"
                placeholder="Search title, message..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                style={{ padding: "8px 14px", borderRadius: 6, border: "1px solid var(--line)", fontSize: 13 }}
              />

              <select
                value={priority}
                onChange={(e) => { setPriority(e.target.value); setPage(1); }}
                style={{ padding: "8px 14px", borderRadius: 6, border: "1px solid var(--line)", fontSize: 13, background: "#fff" }}
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">🔴 Critical Priority</option>
                <option value="HIGH">🟠 High Priority</option>
                <option value="MEDIUM">🔵 Medium Priority</option>
                <option value="LOW">⚪ Low Priority</option>
              </select>

              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                style={{ padding: "8px 14px", borderRadius: 6, border: "1px solid var(--line)", fontSize: 13 }}
                title="Start Date"
              />

              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                style={{ padding: "8px 14px", borderRadius: 6, border: "1px solid var(--line)", fontSize: 13 }}
                title="End Date"
              />

            </div>

            {/* Mass Actions Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
              
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === notifications.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                  <strong>Select All ({selectedIds.length})</strong>
                </label>

                {selectedIds.length > 0 && (
                  <>
                    <button
                      className="btn secondary"
                      onClick={handleMarkSelectedRead}
                      style={{ padding: "6px 12px", fontSize: 12, borderRadius: 6 }}
                    >
                      ✓ Mark Read
                    </button>
                    <button
                      className="btn soft"
                      onClick={handleDeleteSelected}
                      style={{ padding: "6px 12px", fontSize: 12, borderRadius: 6, color: "var(--error)" }}
                    >
                      🗑️ Delete Selected
                    </button>
                  </>
                )}
              </div>

              <button
                className="btn secondary"
                onClick={handleExportCSV}
                style={{ padding: "6px 14px", fontSize: 12, borderRadius: 6 }}
              >
                📥 Export CSV
              </button>

            </div>

          </div>

          {/* Table Feed */}
          {loading ? (
            <div className="card pad" style={{ textAlign: "center", padding: 48 }}>
              <h3>Loading Notification Logs...</h3>
            </div>
          ) : notifications.length === 0 ? (
            <div className="card pad" style={{ textAlign: "center", padding: 48 }}>
              <h3>No Notifications Found</h3>
              <p style={{ color: "var(--muted)", marginTop: 8 }}>
                No events matched your selected filter criteria.
              </p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>Select</th>
                    <th>Priority</th>
                    <th>Category</th>
                    <th>Notification Details</th>
                    <th>Date / Time</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((item) => {
                    const isSelected = selectedIds.includes(item.id);
                    const targetLink = item.link || (item.orderId ? `/admin/orders?search=${item.orderId}` : null);

                    return (
                      <tr key={item.id} style={{ backgroundColor: item.isRead ? undefined : "#f0fdf4" }}>
                        <td>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(item.id)}
                          />
                        </td>
                        <td>{getPriorityBadge(item.priority)}</td>
                        <td>
                          <span style={{ fontSize: 11, fontWeight: 700, background: "#e2e8f0", padding: "2px 8px", borderRadius: 4 }}>
                            {item.category || item.type}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>{item.title}</div>
                          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2, lineHeight: 1.4 }}>{item.message}</div>
                        </td>
                        <td style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap" }}>
                          {new Date(item.createdAt).toLocaleString()}
                        </td>
                        <td>
                          <span className={`status-pill ${item.isRead ? "completed" : "new"}`}>
                            {item.isRead ? "READ" : "UNREAD"}
                          </span>
                        </td>
                        <td>
                          {targetLink && (
                            <Link href={targetLink} className="btn secondary" style={{ padding: "4px 10px", fontSize: 11, borderRadius: 4 }}>
                              View →
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>
                Page {page} of {totalPages} ({totalCount} total notifications)
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  style={{ padding: "6px 14px", fontSize: 12 }}
                >
                  ← Previous
                </button>
                <button
                  className="btn secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  style={{ padding: "6px 14px", fontSize: 12 }}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .p-tag {
          font-size: 10px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
          display: inline-block;
        }
        .p-tag.critical {
          background-color: #fee2e2;
          color: #991b1b;
        }
        .p-tag.high {
          background-color: #ffedd5;
          color: #c2410c;
        }
        .p-tag.medium {
          background-color: #e0f2fe;
          color: #0369a1;
        }
        .p-tag.low {
          background-color: #f1f5f9;
          color: #475569;
        }
      `}</style>
    </div>
  );
}
