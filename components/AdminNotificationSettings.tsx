"use client";

import { useEffect, useState } from "react";

export function AdminNotificationSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [enableOrders, setEnableOrders] = useState(true);
  const [enableSales, setEnableSales] = useState(true);
  const [enableReviews, setEnableReviews] = useState(true);
  const [enableCustomers, setEnableCustomers] = useState(true);
  const [enableInventory, setEnableInventory] = useState(true);
  const [enableInquiries, setEnableInquiries] = useState(true);
  const [enableProducts, setEnableProducts] = useState(true);
  const [enableSystemAlerts, setEnableSystemAlerts] = useState(true);
  const [enableAdminActivity, setEnableAdminActivity] = useState(true);
  const [enableSound, setEnableSound] = useState(true);
  const [enableDesktopPopups, setEnableDesktopPopups] = useState(true);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/notifications/preferences");
      if (!res.ok) return;
      const data = await res.json();

      setEnableOrders(data.enableOrders !== false);
      setEnableSales(data.enableSales !== false);
      setEnableReviews(data.enableReviews !== false);
      setEnableCustomers(data.enableCustomers !== false);
      setEnableInventory(data.enableInventory !== false);
      setEnableInquiries(data.enableInquiries !== false);
      setEnableProducts(data.enableProducts !== false);
      setEnableSystemAlerts(data.enableSystemAlerts !== false);
      setEnableAdminActivity(data.enableAdminActivity !== false);
      setEnableSound(data.enableSound !== false);
      setEnableDesktopPopups(data.enableDesktopPopups !== false);
      setLowStockThreshold(data.lowStockThreshold || 10);
    } catch (err) {
      console.error("Failed to load preferences:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreferences();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enableOrders,
          enableSales,
          enableReviews,
          enableCustomers,
          enableInventory,
          enableInquiries,
          enableProducts,
          enableSystemAlerts,
          enableAdminActivity,
          enableSound,
          enableDesktopPopups,
          lowStockThreshold: Number(lowStockThreshold)
        })
      });
      if (res.ok) {
        alert("Notification preferences saved successfully!");
      } else {
        alert("Failed to save notification preferences.");
      }
    } catch (err) {
      console.error("Failed to save notification preferences:", err);
      alert("Error saving preferences.");
    } finally {
      setSaving(false);
    }
  };

  const handleRequestDesktopPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        alert("Desktop Notifications enabled!");
      } else {
        alert("Notification permission status: " + perm);
      }
    }
  };

  if (loading) {
    return (
      <div className="card pad" style={{ textAlign: "center", padding: 48 }}>
        <h3>Loading Notification Preferences...</h3>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="card pad" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h3 style={{ fontSize: 20, margin: "0 0 4px 0" }}>Notification Settings & Controls</h3>
        <p style={{ color: "var(--muted)", margin: 0, fontSize: 14 }}>
          Control which categories push real-time alerts, audio sound chimes, and browser push popups.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, borderTop: "1px solid var(--line)", paddingTop: 18 }}>
        
        {/* Category Toggles */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h4 style={{ fontSize: 15, margin: 0, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--muted)" }}>
            Category Subscriptions
          </h4>

          {[
            { label: "📦 Orders & Status Updates", value: enableOrders, setter: setEnableOrders },
            { label: "💰 Sales & Revenue Milestones", value: enableSales, setter: setEnableSales },
            { label: "⭐ Product Reviews Submitted", value: enableReviews, setter: setEnableReviews },
            { label: "👤 Customer Registrations", value: enableCustomers, setter: setEnableCustomers },
            { label: "⚠ Low Stock & Inventory Alerts", value: enableInventory, setter: setEnableInventory },
            { label: "📩 Patient Inquiries & Contact Forms", value: enableInquiries, setter: setEnableInquiries },
            { label: "🧴 Product Catalog Modifications", value: enableProducts, setter: setEnableProducts },
            { label: "🚨 System & Gateway Error Alerts", value: enableSystemAlerts, setter: setEnableSystemAlerts },
            { label: "🔑 Admin Login & Audit Activity", value: enableAdminActivity, setter: setEnableAdminActivity },
          ].map((item, idx) => (
            <label key={idx} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={item.value}
                onChange={(e) => item.setter(e.target.checked)}
                style={{ width: 18, height: 18, cursor: "pointer" }}
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>

        {/* Audio & Desktop Settings */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h4 style={{ fontSize: 15, margin: 0, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--muted)" }}>
            Sound & Push Channels
          </h4>

          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={enableSound}
              onChange={(e) => setEnableSound(e.target.checked)}
              style={{ width: 18, height: 18, cursor: "pointer" }}
            />
            <span>🔊 Web Audio Sound Synthesizer Chime</span>
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={enableDesktopPopups}
              onChange={(e) => setEnableDesktopPopups(e.target.checked)}
              style={{ width: 18, height: 18, cursor: "pointer" }}
            />
            <span>🖥️ Browser Native Desktop Popups</span>
          </label>

          <button
            type="button"
            className="btn secondary"
            onClick={handleRequestDesktopPermission}
            style={{ padding: "8px 14px", fontSize: 12, borderRadius: 6, width: "fit-content" }}
          >
            🔔 Request Browser Permission
          </button>

          <div style={{ borderTop: "1px solid var(--line)", paddingTop: 14, marginTop: 10 }}>
            <label style={{ fontSize: 14, fontWeight: 600, display: "block", marginBottom: 6 }}>
              Low Stock Warning Threshold (Units):
            </label>
            <input
              type="number"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(Number(e.target.value))}
              min={1}
              max={100}
              style={{ padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 6, width: 140, fontSize: 14 }}
            />
            <span style={{ fontSize: 12, color: "var(--muted)", display: "block", marginTop: 4 }}>
              Alert when product stock falls below this quantity.
            </span>
          </div>
        </div>

      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
        <button type="submit" className="btn" disabled={saving} style={{ borderRadius: 8 }}>
          {saving ? "Saving Preferences..." : "💾 Save Settings"}
        </button>
      </div>
    </form>
  );
}
