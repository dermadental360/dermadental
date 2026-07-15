"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { clinic } from "@/lib/constants";

function getGreeting(date: Date): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  if (hour >= 17 && hour < 24) return "Good Evening";
  return "Good Night";
}

export function AdminDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [visitors, setVisitors] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState<string>("");

  // Fetch metrics and live analytics
  const loadData = async () => {
    try {
      const [resMetrics, resAnalytics] = await Promise.all([
        fetch("/api/admin/metrics"),
        fetch("/api/admin/analytics")
      ]);

      if (resMetrics.ok) {
        setMetrics(await resMetrics.json());
      }
      if (resAnalytics.ok) {
        const data = await resAnalytics.json();
        setVisitors(data.activeVisitors || 1);
      }
    } catch (err) {
      console.error("Dashboard metrics loading failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Set initial greeting based on current local time
    setGreeting(getGreeting(new Date()));

    // Update greeting every minute so it stays accurate during long sessions
    const greetingInterval = setInterval(() => {
      setGreeting(getGreeting(new Date()));
    }, 60000);

    loadData();

    // Set interval to update active visitor counts every 15 seconds
    const visitorInterval = setInterval(async () => {
      try {
        const resAnalytics = await fetch("/api/admin/analytics");
        if (resAnalytics.ok) {
          const data = await resAnalytics.json();
          setVisitors(data.activeVisitors || 1);
        }
      } catch (err) {
        // Fail silently
      }
    }, 15000);

    return () => {
      clearInterval(greetingInterval);
      clearInterval(visitorInterval);
    };
  }, []);

  const formatCurrency = (val: number) => {
    return `₹${(val || 0).toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="page-enter" style={{ display: "grid", gap: 32 }}>
        <div>
          <span className="skeleton" style={{ width: 140, height: 16, display: "block" }}>Eyebrow</span>
          <span className="skeleton" style={{ width: 280, height: 42, display: "block", marginTop: 8 }}>Title</span>
        </div>
        
        <div className="grid cols-3" style={{ gap: 24 }}>
          {[1, 2, 3].map((n) => (
            <div className="card pad skeleton" key={n} style={{ height: 160 }}>
              Loading Card Details
            </div>
          ))}
        </div>

        <div className="grid cols-2" style={{ gap: 28, marginTop: 12 }}>
          <div className="card pad skeleton" style={{ height: 320 }}>Loading Feed</div>
          <div className="card pad skeleton" style={{ height: 320 }}>Loading Products</div>
        </div>
      </div>
    );
  }

  const {
    totalProducts = 0,
    publishedProducts = 0,
    totalOrders = 0,
    newOrders = 0,
    completedOrders = 0,
    inquiriesCount = 0,
    totalRevenue = 0,
    revenueWeek = 0,
    revenueMonth = 0,
    ordersWeek = 0,
    ordersMonth = 0,
    aov = 0,
    lowStockCount = 0,
    lowStockProducts = [],
    recentOrders = []
  } = metrics || {};

  return (
    <div className="page-enter" style={{ display: "grid", gap: 32 }}>

      {/* Dynamic Time-Based Greeting Banner */}
      {greeting && (
        <div
          className="admin-greeting-banner"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "16px 22px",
            borderRadius: "var(--radius-md)",
            background: "linear-gradient(135deg, var(--sage-light) 0%, var(--blush-light) 100%)",
            border: "1px solid var(--line)",
            boxShadow: "var(--shadow-sm)",
            animation: "fadeInUp 0.45s ease forwards"
          }}
        >
          <span
            style={{
              fontSize: 28,
              lineHeight: 1,
              filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.08))"
            }}
          >
            👋
          </span>
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                color: "var(--sage-dark)",
                letterSpacing: "-0.3px",
                lineHeight: 1.2
              }}
            >
              {greeting}, {clinic.doctor}
            </p>
            <p
              style={{
                margin: "3px 0 0 0",
                fontSize: 13,
                color: "var(--muted)",
                fontWeight: 500
              }}
            >
              Welcome back to your dashboard · {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>
      )}

      {/* Dashboard Top Header Brand & Clinic Card */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 28, flexWrap: "wrap", alignItems: "start" }}>
        <div style={{ animation: "fadeInUp 0.5s ease forwards" }}>
          <p className="eyebrow" style={{ color: "var(--gold)", fontWeight: 700, margin: 0 }}>{clinic.name}</p>
          <h1 style={{ margin: "4px 0 6px 0", fontSize: 32 }}>Owner Dashboard</h1>
          <p style={{ fontSize: 18, color: "var(--muted)", fontWeight: 500, margin: 0 }}>Dr. Sadaf Yamin</p>
        </div>

        {/* Clinic Info Details Card */}
        <div className="card pad reveal revealed" style={{ width: "100%", maxWidth: 540, animation: "fadeInUp 0.6s ease forwards", borderLeft: "4px solid var(--sage)" }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", color: "var(--muted)", marginBottom: 8, letterSpacing: 0.5 }}>
            Clinic Summary
          </h4>
          <p style={{ fontSize: 14, margin: "0 0 6px 0", color: "var(--ink)", lineHeight: 1.4 }}>
            <strong>Address:</strong> {clinic.address}
          </p>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 14, fontSize: 14, marginTop: 10 }}>
            <span><strong>Hours:</strong> {clinic.timing}</span>
            <span><strong>Phone:</strong> {clinic.phone}</span>
          </div>
        </div>
      </div>

      {/* Metrics Row Grid */}
      <div className="grid cols-3" style={{ gap: 24 }}>
        
        {/* Total Revenue and Timeline */}
        <div className="card pad reveal revealed" style={{ animation: "fadeInUp 0.4s ease forwards" }}>
          <p className="filters-group-title" style={{ margin: 0, fontSize: 11 }}>Total Business Sales</p>
          <h2 style={{ fontSize: 32, margin: "6px 0 14px 0", color: "var(--sage-dark)", fontWeight: 800 }}>
            {formatCurrency(totalRevenue)}
          </h2>
          <div style={{ display: "grid", gap: 8, fontSize: 13, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>This Week</span>
              <strong style={{ color: "var(--ink)" }}>{formatCurrency(revenueWeek)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>This Month</span>
              <strong style={{ color: "var(--ink)" }}>{formatCurrency(revenueMonth)}</strong>
            </div>
          </div>
        </div>

        {/* Orders Analytics */}
        <div className="card pad reveal revealed" style={{ animation: "fadeInUp 0.5s ease forwards" }}>
          <p className="filters-group-title" style={{ margin: 0, fontSize: 11 }}>Orders Activity</p>
          <h2 style={{ fontSize: 32, margin: "6px 0 14px 0", color: "var(--gold)", fontWeight: 800 }}>
            {totalOrders} <span style={{ fontSize: 14, fontWeight: 500, color: "var(--muted)" }}>Total</span>
          </h2>
          <div style={{ display: "grid", gap: 8, fontSize: 13, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>This Week / Month</span>
              <strong style={{ color: "var(--ink)" }}>{ordersWeek} / {ordersMonth}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Average Order Value</span>
              <strong style={{ color: "var(--ink)" }}>{formatCurrency(aov)}</strong>
            </div>
          </div>
        </div>

        {/* Live Active Website Viewers Counter */}
        <div className="card pad reveal revealed" style={{ animation: "fadeInUp 0.6s ease forwards" }}>
          <p className="filters-group-title" style={{ margin: 0, fontSize: 11 }}>Live Website Viewers</p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, margin: "6px 0 14px 0" }}>
            <h2 style={{ fontSize: 36, margin: 0, color: "var(--ink)", fontWeight: 800 }}>{visitors}</h2>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: "var(--success)",
                  display: "inline-block",
                  animation: "pulseGlow 2s infinite"
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--success)", textTransform: "uppercase" }}>
                Active Now
              </span>
            </div>
          </div>
          <div style={{ fontSize: 13, borderTop: "1px solid var(--line)", paddingTop: 12, color: "var(--muted)", lineHeight: 1.4 }}>
            Tracks active anonymous users pinging the store within the last 60 seconds.
          </div>
        </div>

      </div>

      {/* Minor Metrics Grid */}
      <div className="grid cols-3" style={{ gap: 24 }}>
        
        {/* Products Summary */}
        <div className="card pad" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p className="filters-group-title" style={{ margin: 0, fontSize: 11 }}>Products Catalog</p>
            <h3 style={{ fontSize: 24, margin: "4px 0 0 0" }}>{totalProducts} Items</h3>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>{publishedProducts} Published on store</span>
          </div>
          <Link href="/admin/products" className="btn secondary" style={{ padding: "8px 14px", fontSize: 12 }}>
            Manage
          </Link>
        </div>

        {/* Orders Summary counts */}
        <div className="card pad" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p className="filters-group-title" style={{ margin: 0, fontSize: 11 }}>Clinic Inbox</p>
            <h3 style={{ fontSize: 24, margin: "4px 0 0 0" }}>{inquiriesCount} Queries</h3>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>{newOrders} New order requests</span>
          </div>
          <Link href="/admin/inquiries" className="btn secondary" style={{ padding: "8px 14px", fontSize: 12 }}>
            Inquiries
          </Link>
        </div>

        {/* Low Stock Alerts count */}
        <div className="card pad" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p className="filters-group-title" style={{ margin: 0, fontSize: 11 }}>Inventory Warnings</p>
            <h3 style={{ fontSize: 24, margin: "4px 0 0 0", color: lowStockCount > 0 ? "var(--error)" : "var(--success)" }}>
              {lowStockCount} Alerts
            </h3>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>Products with stock &lt; 10</span>
          </div>
          <Link href="/admin/products" className="btn secondary" style={{ padding: "8px 14px", fontSize: 12 }}>
            Restock
          </Link>
        </div>

      </div>

      {/* Recent Activity Layout Split Grid */}
      <div className="split admin-dashboard-split">
        
        {/* Recent Orders feed */}
        <div className="card pad">
          <h3 style={{ fontSize: 20, borderBottom: "1px solid var(--line)", paddingBottom: 10, marginBottom: 14 }}>
            Recent Order Requests
          </h3>
          {recentOrders.length === 0 ? (
            <p style={{ color: "var(--muted)", margin: "14px 0 0 0" }}>No recent order requests found.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {recentOrders.map((order: any) => (
                <div
                  key={order._id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: "1px solid var(--bg-secondary)"
                  }}
                >
                  <div>
                    <strong style={{ fontSize: 15 }}>{order.customer?.name}</strong>
                    <span style={{ fontSize: 12, color: "var(--muted)", display: "block", marginTop: 2 }}>
                      Ref: {order._id} · {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <strong style={{ color: "var(--sage-dark)", fontSize: 15 }}>{formatCurrency(order.total)}</strong>
                    <span className={`status-pill ${order.status.toLowerCase()}`} style={{ fontSize: 11, padding: "2px 8px" }}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link href="/admin/orders" className="btn" style={{ width: "100%", marginTop: 20 }}>
            View All Customer Orders
          </Link>
        </div>

        {/* Low Stock Items sidebar */}
        <div className="card pad">
          <h3 style={{ fontSize: 20, borderBottom: "1px solid var(--line)", paddingBottom: 10, marginBottom: 14 }}>
            Low Stock Inventory
          </h3>
          {lowStockProducts.length === 0 ? (
            <p style={{ color: "var(--success)", fontWeight: 600, margin: "14px 0 0 0" }}>✓ All inventory fully stocked!</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {lowStockProducts.map((p: any) => (
                <div
                  key={p._id || p.name}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: "1px solid var(--bg-secondary)"
                  }}
                >
                  <div style={{ maxWidth: "70%" }}>
                    <span style={{ fontWeight: 600, fontSize: 14, display: "block" }}>{p.name}</span>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>{p.brand}</span>
                  </div>
                  <span className="status-pill cancelled" style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px" }}>
                    {p.stock === 0 ? "Out" : `${p.stock} left`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Owner Quick Actions Bar */}
      <div className="card pad" style={{ display: "grid", gap: 14 }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", color: "var(--muted)", letterSpacing: 0.5 }}>
          Owner Quick Actions
        </h4>
        <div className="actions" style={{ flexWrap: "wrap", gap: 14 }}>
          <Link href="/admin/products" className="btn">🧴 Add Product Item</Link>
          <Link href="/admin/orders" className="btn secondary">📦 View Live Orders</Link>
          <Link href="/admin/inquiries" className="btn secondary">💬 Review Inquiries</Link>
          <Link href="/" target="_blank" className="btn soft">👁️ View Public Website</Link>
        </div>
      </div>
    </div>
  );
}
