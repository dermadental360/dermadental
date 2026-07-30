"use client";

import { useEffect, useState } from "react";

interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalSpent: number;
  ordersCount: number;
  averageOrderValue: number;
  lastPurchase: string;
  abandonedCartCount: number;
  couponUsageCount: number;
  mostPurchasedProduct: string;
}

export default function AdminCustomersAnalyticsPage() {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [metrics, setMetrics] = useState({
    totalCustomersCount: 0,
    repeatCustomersCount: 0,
    repeatCustomerRate: "0.0",
    overallAOV: 0,
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/analytics/customers");
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (err) {
      console.error("Failed to load customer analytics:", err);
    } finally {
      setLoading(false);
    }
  }

  const maxSpent = Math.max(...customers.map((c) => c.totalSpent), 1);
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  if (loading) {
    return (
      <div className="card pad" style={{ textAlign: "center", padding: 48 }}>
        <h3>Loading Customer Analytics & LTV...</h3>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <p className="eyebrow">Admin Center</p>
          <h1 style={{ margin: "4px 0 0 0", fontSize: 28 }}>Customer Analytics & LTV</h1>
        </div>
      </div>

      {/* Statistics Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <div className="card pad" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 28 }}>👥</span>
          <div>
            <span style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Total Unique Customers</span>
            <h3 style={{ margin: "2px 0 0 0", fontSize: 24, fontWeight: 800, color: "var(--ink)" }}>{metrics.totalCustomersCount}</h3>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>Registered & guest buyers</span>
          </div>
        </div>

        <div className="card pad" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 28 }}>🔄</span>
          <div>
            <span style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Repeat Buyer Rate</span>
            <h3 style={{ margin: "2px 0 0 0", fontSize: 24, fontWeight: 800, color: "#16a34a" }}>{metrics.repeatCustomerRate}%</h3>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>{metrics.repeatCustomersCount} Repeat Buyers</span>
          </div>
        </div>

        <div className="card pad" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 28 }}>💳</span>
          <div>
            <span style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Average Order Value</span>
            <h3 style={{ margin: "2px 0 0 0", fontSize: 24, fontWeight: 800, color: "var(--sage-dark)" }}>₹{metrics.overallAOV.toLocaleString("en-IN")}</h3>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>Average cart checkout</span>
          </div>
        </div>

        <div className="card pad" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 28 }}>⭐</span>
          <div>
            <span style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Top Spender LTV</span>
            <h3 style={{ margin: "2px 0 0 0", fontSize: 24, fontWeight: 800, color: "#9333ea" }}>₹{maxSpent.toLocaleString("en-IN")}</h3>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>Highest customer LTV</span>
          </div>
        </div>
      </div>

      {/* Controls & Filter Bar Card */}
      <div className="card pad" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <input
          type="text"
          placeholder="Search by customer name, email, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input"
          style={{ width: 340, padding: "8px 14px", fontSize: 13 }}
        />
        <span style={{ fontSize: 12, color: "var(--muted)" }}>
          Showing {filteredCustomers.length} of {customers.length} Customers
        </span>
      </div>

      {/* Table Container Card */}
      <div className="table-container">
        {filteredCustomers.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <h3>No Customer Analytics Available</h3>
            <p style={{ color: "var(--muted)", marginTop: 8 }}>No customer purchase records matched your search query.</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Customer Profile</th>
                <th>Lifetime Value (LTV)</th>
                <th>Orders</th>
                <th>Avg Order Value</th>
                <th>Top Purchased Product</th>
                <th>Carts Abandoned</th>
                <th>Coupons Used</th>
                <th style={{ textAlign: "right" }}>Last Purchase</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>
                      {c.name}
                      {c.ordersCount > 2 ? (
                        <span className="status-pill completed" style={{ marginLeft: 8 }}>VIP</span>
                      ) : c.ordersCount > 1 ? (
                        <span className="status-pill new" style={{ marginLeft: 8 }}>REPEAT</span>
                      ) : (
                        <span className="status-pill packed" style={{ marginLeft: 8 }}>1st Order</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{c.email}</div>
                    <div style={{ fontSize: 12, fontFamily: "monospace", color: "var(--ink)" }}>{c.phone}</div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 800, color: "#16a34a", fontSize: 14 }}>
                      ₹{c.totalSpent.toLocaleString("en-IN")}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700 }}>{c.ordersCount}</td>
                  <td style={{ fontWeight: 600 }}>₹{c.averageOrderValue.toLocaleString("en-IN")}</td>
                  <td style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13, color: "var(--muted)" }}>
                    {c.mostPurchasedProduct}
                  </td>
                  <td style={{ fontWeight: 700, color: "#d97706" }}>{c.abandonedCartCount}</td>
                  <td style={{ fontWeight: 600 }}>{c.couponUsageCount}</td>
                  <td style={{ textAlign: "right", color: "var(--muted)", fontSize: 12 }}>
                    {new Date(c.lastPurchase).toLocaleDateString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
