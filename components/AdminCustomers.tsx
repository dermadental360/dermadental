"use client";

import React, { useState, useEffect } from "react";

export function AdminCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/admin/customers");
      if (res.ok) {
        setCustomers(await res.json());
      }
    } catch (err) {
      console.error("Failed to load customers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    const isEdit = Boolean(editingCustomer);
    const url = "/api/admin/customers";
    const method = isEdit ? "PUT" : "POST";
    const payload = isEdit ? { id: editingCustomer.id, ...formData } : formData;

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setMsg({ text: `✅ Customer ${isEdit ? "updated" : "added"} successfully!`, type: "success" });
        setEditingCustomer(null);
        setIsAddingNew(false);
        setFormData({ name: "", email: "", phone: "" });
        fetchCustomers();
      } else {
        setMsg({ text: `❌ ${data.error || "Failed to save customer."}`, type: "error" });
      }
    } catch (err: any) {
      setMsg({ text: `❌ Error: ${err.message || "Operation failed."}`, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustomer = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete customer record for "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/customers?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setMsg({ text: "✅ Customer deleted successfully.", type: "success" });
        if (selectedCustomer?.id === id) setSelectedCustomer(null);
        fetchCustomers();
      } else {
        const data = await res.json();
        setMsg({ text: `❌ ${data.error || "Failed to delete."}`, type: "error" });
      }
    } catch (err: any) {
      setMsg({ text: `❌ Error deleting customer: ${err.message}`, type: "error" });
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const query = filterText.toLowerCase().trim();
    if (!query) return true;
    return (
      (c.name || "").toLowerCase().includes(query) ||
      (c.email || "").toLowerCase().includes(query) ||
      (c.phone || "").toLowerCase().includes(query) ||
      (c.primaryAddress || "").toLowerCase().includes(query)
    );
  });

  if (loading) {
    return <div className="card pad skeleton" style={{ height: 360 }} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Top Header & Search Control */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "#0f172a" }}>
            👥 Customer Database ({customers.length})
          </h2>
          <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: 14 }}>
            Complete list of all registered users and storefront customers with lifetime spend & order history.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <input
            className="input"
            type="text"
            placeholder="Search by Name, Email, Phone, Address..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            style={{ width: 280, padding: "8px 14px", fontSize: 13 }}
          />
          <button
            className="btn primary"
            onClick={() => {
              setIsAddingNew(true);
              setEditingCustomer(null);
              setFormData({ name: "", email: "", phone: "" });
            }}
            style={{ padding: "8px 16px", fontSize: 13 }}
          >
            ➕ Add Customer
          </button>
        </div>
      </div>

      {msg && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 8,
            backgroundColor: msg.type === "success" ? "#dcfce7" : "#fee2e2",
            color: msg.type === "success" ? "#15803d" : "#991b1b",
            fontSize: 14,
            fontWeight: 600
          }}
        >
          {msg.text}
        </div>
      )}

      {/* Add / Edit Form Modal Box */}
      {(isAddingNew || editingCustomer) && (
        <div className="card pad" style={{ backgroundColor: "#ffffff", borderRadius: 12, border: "2px solid #3b82f6", padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, color: "#1e3a8a" }}>
              {editingCustomer ? `✏️ Edit Customer: ${editingCustomer.name}` : "➕ Add New Customer Record"}
            </h3>
            <button
              className="btn soft"
              onClick={() => {
                setIsAddingNew(false);
                setEditingCustomer(null);
              }}
              style={{ padding: "4px 10px", fontSize: 12 }}
            >
              Close
            </button>
          </div>

          <form onSubmit={handleSaveCustomer} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Full Name</label>
              <input
                type="text"
                className="input"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Dr. Sadaf Yamin"
                style={{ width: "100%", padding: "8px 12px", fontSize: 14 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Email Address</label>
              <input
                type="email"
                className="input"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="customer@example.com"
                style={{ width: "100%", padding: "8px 12px", fontSize: 14 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Phone Number</label>
              <input
                type="tel"
                className="input"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                style={{ width: "100%", padding: "8px 12px", fontSize: 14 }}
              />
            </div>
            <button type="submit" className="btn primary" disabled={saving} style={{ padding: "8px 20px", fontSize: 14 }}>
              {saving ? "Saving..." : "Save Customer"}
            </button>
          </form>
        </div>
      )}

      {/* Main Customers List / Cards */}
      {filteredCustomers.length === 0 ? (
        <div className="card pad" style={{ textAlign: "center", padding: 48 }}>
          <h3>No customers found</h3>
          <p style={{ color: "var(--muted)" }}>
            {filterText ? "Try adjusting your search criteria." : "Customer accounts and checkout users will appear here."}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="card pad"
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                padding: 20,
                display: "grid",
                gap: 12
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
                <div style={{ maxWidth: 300 }}>
                  <span style={{ fontWeight: 700, fontSize: 16, color: "#0f172a", display: "block" }}>{customer.name}</span>
                  <span style={{ fontSize: 13, color: "#475569", display: "block", marginTop: 2 }}>
                    ✉ <strong>{customer.email}</strong>
                  </span>
                  <span style={{ fontSize: 13, color: "#475569", display: "block", marginTop: 2 }}>
                    📞 <strong>{customer.phone}</strong>
                  </span>
                </div>

                <div style={{ minWidth: 200, maxWidth: 320 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block" }}>
                    📍 Primary Delivery Address
                  </span>
                  <span style={{ fontSize: 13, color: "#334155", display: "block", marginTop: 2, background: "#f8fafc", padding: "6px 10px", borderRadius: 6, border: "1px solid #e2e8f0" }}>
                    {customer.primaryAddress}
                  </span>
                </div>

                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", textTransform: "uppercase" }}>Orders</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: "#0369a1" }}>{customer.ordersCount}</span>
                  </div>

                  <div style={{ textAlign: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", textTransform: "uppercase" }}>Lifetime Spend</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: "#15803d" }}>₹{customer.totalSpent.toLocaleString()}</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button
                    className="btn soft"
                    onClick={() => setSelectedCustomer(selectedCustomer?.id === customer.id ? null : customer)}
                    style={{ fontSize: 12, padding: "6px 12px" }}
                  >
                    {selectedCustomer?.id === customer.id ? "Hide History" : `📜 Orders (${customer.ordersCount})`}
                  </button>

                  <button
                    className="btn soft"
                    onClick={() => {
                      setEditingCustomer(customer);
                      setIsAddingNew(false);
                      setFormData({ name: customer.name, email: customer.email, phone: customer.phone });
                    }}
                    style={{ fontSize: 12, padding: "6px 12px" }}
                  >
                    ✏️ Edit
                  </button>

                  <button
                    className="btn soft"
                    onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                    style={{ fontSize: 12, padding: "6px 12px", color: "#dc2626" }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>

              {/* Order History Drawer */}
              {selectedCustomer?.id === customer.id && (
                <div style={{ borderTop: "1px dashed #cbd5e1", paddingTop: 14, marginTop: 6 }}>
                  <h4 style={{ margin: "0 0 10px", fontSize: 13, textTransform: "uppercase", color: "#475569" }}>
                    📜 Order History for {customer.name} ({customer.orders.length} Records)
                  </h4>

                  {customer.orders.length === 0 ? (
                    <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>No orders recorded for this customer yet.</p>
                  ) : (
                    <div style={{ display: "grid", gap: 8 }}>
                      {customer.orders.map((ord: any) => (
                        <div
                          key={ord.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            backgroundColor: "#f1f5f9",
                            padding: "8px 14px",
                            borderRadius: 6,
                            fontSize: 13
                          }}
                        >
                          <div>
                            <strong style={{ color: "#0f172a" }}>#{ord.id}</strong> — {new Date(ord.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            <span style={{ marginLeft: 10, fontSize: 12, color: "#64748b" }}>📍 {ord.address || "Online Delivery"}</span>
                          </div>
                          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                            <span style={{ fontWeight: 700, color: "#15803d" }}>₹{ord.total}</span>
                            <span style={{ fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: "#e2e8f0", fontSize: 11 }}>{ord.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
