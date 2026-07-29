"use client";

import React, { useState, useEffect } from "react";

export function AdminCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"analytics" | "products" | "orders">("orders");

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
      console.error("Failed to load customer database:", err);
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

  // Printable Invoice Generation Function
  const handlePrintInvoice = (order: any, customer: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print invoices.");
      return;
    }

    const itemsHtml = order.items
      .map(
        (item: any) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">
            <strong>${item.name}</strong><br>
            <span style="font-size: 11px; color: #64748b;">SKU: ${item.sku} | Category: ${item.category}</span>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right;">₹${item.unitPrice.toLocaleString("en-IN")}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right; font-weight: 600;">₹${item.lineTotal.toLocaleString("en-IN")}</td>
        </tr>
      `
      )
      .join("");

    const invoiceContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${order.invoiceNumber}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; padding: 40px; margin: 0; background: #fff; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 24px; }
            .logo { font-size: 24px; font-weight: 800; color: #2d5a27; }
            .invoice-title { font-size: 20px; font-weight: 700; text-align: right; }
            .flex-grid { display: flex; justify-content: space-between; margin-bottom: 24px; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #f8fafc; padding: 10px; text-align: left; font-size: 12px; border-bottom: 2px solid #cbd5e1; text-transform: uppercase; }
            .totals { width: 300px; margin-left: auto; margin-top: 20px; font-size: 13px; }
            .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
            .grand-total { font-size: 16px; font-weight: 800; color: #16a34a; border-top: 2px solid #0f172a; padding-top: 8px; margin-top: 8px; }
            .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">DermaDental360</div>
              <div style="font-size: 12px; color: #475569; margin-top: 4px;">Moeen International | GSTIN: 27AHTPG5622L2ZU</div>
              <div style="font-size: 11px; color: #64748b;">Flat No 10, Ambe Bhavan, Rd 24, Khar West, Mumbai 400052</div>
              <div style="font-size: 11px; color: #64748b;">Phone: +91 9833699887 | Email: dd360health@gmail.com</div>
            </div>
            <div style="text-align: right;">
              <div class="invoice-title">INVOICE</div>
              <div style="font-size: 13px; font-weight: 700; color: #2563eb;">${order.invoiceNumber}</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Date: ${new Date(order.orderDate).toLocaleString("en-IN")}</div>
              <div style="font-size: 12px; color: #16a34a; font-weight: 700;">Status: ${order.paymentStatus}</div>
            </div>
          </div>

          <div class="flex-grid">
            <div style="width: 48%;">
              <strong style="color: #64748b; font-size: 11px; text-transform: uppercase;">Billed To:</strong><br>
              <strong style="font-size: 14px;">${customer.name}</strong><br>
              Phone: ${customer.phone}<br>
              Email: ${customer.email}
            </div>
            <div style="width: 48%;">
              <strong style="color: #64748b; font-size: 11px; text-transform: uppercase;">Shipping Address:</strong><br>
              <span style="line-height: 1.4;">${order.customerAddress || "Online Delivery"}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Product Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Line Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="totals">
            <div><span>Subtotal:</span> <span>₹${order.billBreakdown.subtotal.toLocaleString("en-IN")}</span></div>
            ${order.billBreakdown.discountAmount > 0 ? `<div><span style="color: #16a34a;">Prepaid Discount (${order.billBreakdown.discountPercentage}%):</span> <span style="color: #16a34a;">-₹${order.billBreakdown.discountAmount.toLocaleString("en-IN")}</span></div>` : ""}
            <div><span>Shipping Charge:</span> <span>${order.billBreakdown.isFreeShipping ? "FREE" : `₹${order.billBreakdown.shippingCharge}`}</span></div>
            ${order.billBreakdown.codFee > 0 ? `<div><span>COD Handling Fee:</span> <span>+₹${order.billBreakdown.codFee}</span></div>` : ""}
            <div class="grand-total"><span>Grand Total:</span> <span>₹${order.billBreakdown.grandTotal.toLocaleString("en-IN")}</span></div>
            <div style="margin-top: 6px; font-weight: 700; color: #1e293b;"><span>Amount Paid:</span> <span>₹${order.billBreakdown.amountPaid.toLocaleString("en-IN")}</span></div>
            <div><span>Outstanding Balance:</span> <span>₹${order.billBreakdown.outstandingAmount.toLocaleString("en-IN")}</span></div>
          </div>

          <div style="margin-top: 24px; padding: 12px; background: #f8fafc; border-radius: 6px; font-size: 12px; color: #334155;">
            <strong>Payment Reference:</strong> Method: ${order.paymentDetails.paymentMethod} | Razorpay Payment ID: ${order.paymentDetails.razorpayPaymentId} | Razorpay Order ID: ${order.paymentDetails.razorpayOrderId}
          </div>

          <div class="footer">
            Thank you for shopping with DermaDental360! This is a computer-generated tax invoice.
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(invoiceContent);
    printWindow.document.close();
  };

  const filteredCustomers = customers.filter((c) => {
    const query = filterText.toLowerCase().trim();
    if (!query) return true;
    return (
      (c.name || "").toLowerCase().includes(query) ||
      (c.email || "").toLowerCase().includes(query) ||
      (c.phone || "").toLowerCase().includes(query) ||
      (c.primaryAddress || "").toLowerCase().includes(query) ||
      (c.customerStatus || "").toLowerCase().includes(query)
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
            👥 Customer Purchase Intelligence Dashboard ({customers.length})
          </h2>
          <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: 14 }}>
            Deep customer profiles, order history analytics, SKU product tracking, and printable e-commerce invoices.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <input
            className="input"
            type="text"
            placeholder="Search Name, Email, Phone, Address, Status..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            style={{ width: 300, padding: "8px 14px", fontSize: 13 }}
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

      {/* Customer Intelligence Cards */}
      {filteredCustomers.length === 0 ? (
        <div className="card pad" style={{ textAlign: "center", padding: 48 }}>
          <h3>No customers found</h3>
          <p style={{ color: "var(--muted)" }}>
            {filterText ? "Try adjusting your search criteria." : "Customer accounts and checkout users will appear here."}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {filteredCustomers.map((customer) => {
            const isSelected = selectedCustomer?.id === customer.id;

            return (
              <div
                key={customer.id}
                className="card pad"
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: 12,
                  border: isSelected ? "2px solid #2d5a27" : "1px solid #e2e8f0",
                  padding: 20,
                  display: "grid",
                  gap: 16
                }}
              >
                {/* Primary Customer Profile Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
                  <div style={{ maxWidth: 280 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 800, fontSize: 17, color: "#0f172a" }}>{customer.name}</span>
                      {customer.customerStatus === "VIP" && (
                        <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 12, background: "#fef3c7", color: "#92400e", border: "1px solid #f59e0b" }}>
                          🌟 VIP CUSTOMER
                        </span>
                      )}
                      {customer.customerStatus === "RETURNING" && (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: "#e0f2fe", color: "#0369a1" }}>
                          🔁 RETURNING
                        </span>
                      )}
                      {customer.customerStatus === "NEW" && (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: "#dcfce7", color: "#15803d" }}>
                          🆕 NEW CUSTOMER
                        </span>
                      )}
                    </div>

                    <span style={{ fontSize: 13, color: "#475569", display: "block", marginTop: 4 }}>
                      ✉ <strong>{customer.email}</strong>
                    </span>
                    <span style={{ fontSize: 13, color: "#475569", display: "block", marginTop: 2 }}>
                      📞 <strong>{customer.phone}</strong>
                    </span>
                    <span style={{ fontSize: 11, color: "#64748b", display: "block", marginTop: 4 }}>
                      📅 Customer Since: {new Date(customer.customerSince).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>

                  <div style={{ minWidth: 200, maxWidth: 300 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block" }}>
                      📍 Delivery Address
                    </span>
                    <span style={{ fontSize: 13, color: "#334155", display: "block", marginTop: 4, background: "#f8fafc", padding: "6px 10px", borderRadius: 6, border: "1px solid #e2e8f0", lineHeight: 1.4 }}>
                      {customer.primaryAddress}
                    </span>
                  </div>

                  {/* E-Commerce Intelligence Snapshot */}
                  <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ textAlign: "center", background: "#f8fafc", padding: "8px 14px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", textTransform: "uppercase" }}>Total Orders</span>
                      <span style={{ fontSize: 20, fontWeight: 800, color: "#0369a1" }}>{customer.ordersCount}</span>
                    </div>

                    <div style={{ textAlign: "center", background: "#f8fafc", padding: "8px 14px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", textTransform: "uppercase" }}>Lifetime Spend</span>
                      <span style={{ fontSize: 20, fontWeight: 800, color: "#15803d" }}>₹{customer.totalSpent.toLocaleString("en-IN")}</span>
                    </div>

                    <div style={{ textAlign: "center", background: "#f8fafc", padding: "8px 14px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", textTransform: "uppercase" }}>Avg Order Value</span>
                      <span style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>₹{customer.averageOrderValue.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  {/* Customer Control Action Buttons */}
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button
                      className="btn primary"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedCustomer(null);
                        } else {
                          setSelectedCustomer(customer);
                          setActiveTab("orders");
                        }
                      }}
                      style={{ fontSize: 13, padding: "8px 14px" }}
                    >
                      {isSelected ? "Hide Intelligence" : `🔍 Orders & Intelligence (${customer.ordersCount})`}
                    </button>

                    <button
                      className="btn soft"
                      onClick={() => {
                        setEditingCustomer(customer);
                        setIsAddingNew(false);
                        setFormData({ name: customer.name, email: customer.email, phone: customer.phone });
                      }}
                      style={{ fontSize: 12, padding: "8px 12px" }}
                    >
                      ✏️ Edit
                    </button>

                    <button
                      className="btn soft"
                      onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                      style={{ fontSize: 12, padding: "8px 12px", color: "#dc2626" }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Additional Quick Stats Row */}
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: "#64748b", borderTop: "1px solid #f1f5f9", paddingTop: 10 }}>
                  <span>💳 Payment Methods: <strong>{customer.paymentMethodsUsed.join(", ") || "RAZORPAY / COD"}</strong></span>
                  <span>🗓 Last Purchase: <strong>{customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "None"}</strong></span>
                  <span>🛍 Unique Products Purchased: <strong>{customer.productPurchaseHistory.length}</strong></span>
                </div>

                {/* EXPANDED CUSTOMER PURCHASE INTELLIGENCE DASHBOARD */}
                {isSelected && (
                  <div style={{ borderTop: "2px solid #2d5a27", paddingTop: 16, marginTop: 8 }}>
                    {/* Navigation Tabs */}
                    <div style={{ display: "flex", gap: 10, borderBottom: "1px solid #cbd5e1", paddingBottom: 10, marginBottom: 16 }}>
                      <button
                        className={`btn ${activeTab === "orders" ? "primary" : "soft"}`}
                        onClick={() => setActiveTab("orders")}
                        style={{ fontSize: 13, padding: "6px 16px" }}
                      >
                        📄 Complete Order Invoices ({customer.orders.length})
                      </button>
                      <button
                        className={`btn ${activeTab === "analytics" ? "primary" : "soft"}`}
                        onClick={() => setActiveTab("analytics")}
                        style={{ fontSize: 13, padding: "6px 16px" }}
                      >
                        📊 Purchase Analytics Overview
                      </button>
                      <button
                        className={`btn ${activeTab === "products" ? "primary" : "soft"}`}
                        onClick={() => setActiveTab("products")}
                        style={{ fontSize: 13, padding: "6px 16px" }}
                      >
                        🧴 Product Purchase History ({customer.productPurchaseHistory.length})
                      </button>
                    </div>

                    {/* TAB 1: Analytics Overview */}
                    {activeTab === "analytics" && (
                      <div style={{ display: "grid", gap: 16 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                          <div style={{ background: "#eff6ff", padding: 14, borderRadius: 8, border: "1px solid #bfdbfe" }}>
                            <span style={{ fontSize: 11, color: "#1e40af", fontWeight: 700, textTransform: "uppercase" }}>Total Orders</span>
                            <span style={{ fontSize: 22, fontWeight: 800, color: "#1e3a8a", display: "block" }}>{customer.ordersCount}</span>
                          </div>
                          <div style={{ background: "#f0fdf4", padding: 14, borderRadius: 8, border: "1px solid #bbf7d0" }}>
                            <span style={{ fontSize: 11, color: "#166534", fontWeight: 700, textTransform: "uppercase" }}>Completed Orders</span>
                            <span style={{ fontSize: 22, fontWeight: 800, color: "#14532d", display: "block" }}>{customer.completedOrdersCount}</span>
                          </div>
                          <div style={{ background: "#fef2f2", padding: 14, borderRadius: 8, border: "1px solid #fecaca" }}>
                            <span style={{ fontSize: 11, color: "#991b1b", fontWeight: 700, textTransform: "uppercase" }}>Cancelled Orders</span>
                            <span style={{ fontSize: 22, fontWeight: 800, color: "#7f1d1d", display: "block" }}>{customer.cancelledOrdersCount}</span>
                          </div>
                          <div style={{ background: "#fffbeb", padding: 14, borderRadius: 8, border: "1px solid #fde68a" }}>
                            <span style={{ fontSize: 11, color: "#92400e", fontWeight: 700, textTransform: "uppercase" }}>Pending Orders</span>
                            <span style={{ fontSize: 22, fontWeight: 800, color: "#78350f", display: "block" }}>{customer.pendingOrdersCount}</span>
                          </div>
                          <div style={{ background: "#f8fafc", padding: 14, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                            <span style={{ fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase" }}>Lifetime Spend</span>
                            <span style={{ fontSize: 22, fontWeight: 800, color: "#15803d", display: "block" }}>₹{customer.totalSpent.toLocaleString("en-IN")}</span>
                          </div>
                          <div style={{ background: "#f8fafc", padding: 14, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                            <span style={{ fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase" }}>Highest Order</span>
                            <span style={{ fontSize: 22, fontWeight: 800, color: "#0369a1", display: "block" }}>₹{customer.highestOrderValue.toLocaleString("en-IN")}</span>
                          </div>
                          <div style={{ background: "#f8fafc", padding: 14, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                            <span style={{ fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase" }}>Lowest Order</span>
                            <span style={{ fontSize: 22, fontWeight: 800, color: "#475569", display: "block" }}>₹{customer.lowestOrderValue.toLocaleString("en-IN")}</span>
                          </div>
                        </div>

                        <div style={{ background: "#f8fafc", padding: 14, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}>
                          <strong>Purchase Dates Timeline:</strong>
                          <div style={{ marginTop: 6, display: "flex", gap: 24, flexWrap: "wrap", color: "#334155" }}>
                            <span>🗓 <strong>First Purchase:</strong> {new Date(customer.firstPurchaseDate).toLocaleString("en-IN")}</span>
                            <span>🗓 <strong>Latest Purchase:</strong> {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleString("en-IN") : "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 2: Product Purchase History */}
                    {activeTab === "products" && (
                      <div>
                        {customer.productPurchaseHistory.length === 0 ? (
                          <p style={{ color: "#64748b", fontSize: 14 }}>No product purchase records found for this customer.</p>
                        ) : (
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead>
                              <tr style={{ background: "#f1f5f9", textAlign: "left", color: "#475569" }}>
                                <th style={{ padding: "10px 12px" }}>Product</th>
                                <th style={{ padding: "10px 12px" }}>Category</th>
                                <th style={{ padding: "10px 12px", textAlign: "center" }}>Times Purchased</th>
                                <th style={{ padding: "10px 12px", textAlign: "center" }}>Total Quantity</th>
                                <th style={{ padding: "10px 12px", textAlign: "right" }}>Total Amount Spent</th>
                              </tr>
                            </thead>
                            <tbody>
                              {customer.productPurchaseHistory.map((item: any, idx: number) => (
                                <tr key={idx} style={{ borderBottom: "1px solid #e2e8f0" }}>
                                  <td style={{ padding: "10px 12px", fontWeight: 600, color: "#0f172a" }}>{item.name}</td>
                                  <td style={{ padding: "10px 12px", color: "#64748b" }}>{item.category}</td>
                                  <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700 }}>{item.timesPurchased}</td>
                                  <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700 }}>{item.totalQuantityPurchased}</td>
                                  <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 800, color: "#15803d" }}>₹{item.totalAmountSpent.toLocaleString("en-IN")}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}

                    {/* TAB 3: Orders List & Detailed Invoice Breakdown */}
                    {activeTab === "orders" && (
                      <div style={{ display: "grid", gap: 20 }}>
                        {customer.orders.length === 0 ? (
                          <p style={{ color: "#64748b", fontSize: 14 }}>No orders placed by this customer yet.</p>
                        ) : (
                          customer.orders.map((ord: any) => (
                            <div
                              key={ord.id}
                              style={{
                                background: "#ffffff",
                                border: "1px solid #cbd5e1",
                                borderRadius: 10,
                                padding: 16,
                                display: "grid",
                                gap: 14
                              }}
                            >
                              {/* Order & Invoice Top Header */}
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, borderBottom: "1px solid #e2e8f0", paddingBottom: 10 }}>
                                <div>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>INVOICE NUMBER</span>
                                  <div style={{ fontSize: 16, fontWeight: 800, color: "#1e3a8a" }}>{ord.invoiceNumber}</div>
                                  <span style={{ fontSize: 12, color: "#64748b" }}>Order ID: #{ord.id} · {new Date(ord.orderDate).toLocaleString("en-IN")}</span>
                                </div>

                                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                                  <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 6, background: "#f1f5f9", color: "#334155" }}>
                                    Workflow: {ord.status}
                                  </span>
                                  <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 6, background: ord.paymentStatus === "PAID" ? "#dcfce7" : "#fee2e2", color: ord.paymentStatus === "PAID" ? "#15803d" : "#991b1b" }}>
                                    Payment: {ord.paymentStatus}
                                  </span>
                                  <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 6, background: ord.paymentMethod === "COD" ? "#fef3c7" : "#e0f2fe", color: ord.paymentMethod === "COD" ? "#92400e" : "#0369a1" }}>
                                    {ord.paymentMethod}
                                  </span>

                                  <button
                                    className="btn primary"
                                    onClick={() => handlePrintInvoice(ord, customer)}
                                    style={{ fontSize: 12, padding: "6px 12px" }}
                                  >
                                    🖨️ Print / Download PDF Invoice
                                  </button>
                                </div>
                              </div>

                              {/* Product Items Table */}
                              <div>
                                <h4 style={{ margin: "0 0 8px", fontSize: 12, textTransform: "uppercase", color: "#64748b" }}>
                                  Ordered Product Details ({ord.items.length} Items)
                                </h4>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                                  <thead>
                                    <tr style={{ background: "#f8fafc", textAlign: "left", color: "#64748b" }}>
                                      <th style={{ padding: "8px" }}>Item Description</th>
                                      <th style={{ padding: "8px" }}>SKU</th>
                                      <th style={{ padding: "8px", textAlign: "right" }}>Unit Price</th>
                                      <th style={{ padding: "8px", textAlign: "center" }}>Qty</th>
                                      <th style={{ padding: "8px", textAlign: "right" }}>Line Total</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {ord.items.map((item: any, iIdx: number) => (
                                      <tr key={iIdx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                        <td style={{ padding: "8px", fontWeight: 600, color: "#0f172a" }}>
                                          {item.name}
                                          <span style={{ display: "block", fontSize: 11, color: "#64748b", fontWeight: 400 }}>Category: {item.category}</span>
                                        </td>
                                        <td style={{ padding: "8px", color: "#64748b", fontFamily: "monospace" }}>{item.sku}</td>
                                        <td style={{ padding: "8px", textAlign: "right" }}>₹{item.unitPrice.toLocaleString("en-IN")}</td>
                                        <td style={{ padding: "8px", textAlign: "center", fontWeight: 700 }}>x{item.quantity}</td>
                                        <td style={{ padding: "8px", textAlign: "right", fontWeight: 700, color: "#0f172a" }}>₹{item.lineTotal.toLocaleString("en-IN")}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              {/* Order Bill Breakdown & Payment Gateway Info */}
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, background: "#f8fafc", padding: 14, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                                {/* Bill Breakdown */}
                                <div style={{ fontSize: 13, display: "grid", gap: 4 }}>
                                  <strong style={{ fontSize: 12, textTransform: "uppercase", color: "#475569", marginBottom: 4, display: "block" }}>Order Bill Breakdown</strong>
                                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>Subtotal:</span> <strong>₹{ord.billBreakdown.subtotal.toLocaleString("en-IN")}</strong></div>
                                  {ord.billBreakdown.discountAmount > 0 && (
                                    <div style={{ display: "flex", justifyContent: "space-between", color: "#16a34a" }}>
                                      <span>Prepaid Discount ({ord.billBreakdown.discountPercentage}%):</span> <strong>-₹{ord.billBreakdown.discountAmount.toLocaleString("en-IN")}</strong>
                                    </div>
                                  )}
                                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>Shipping Charge:</span> <strong>{ord.billBreakdown.isFreeShipping ? "FREE" : `₹${ord.billBreakdown.shippingCharge}`}</strong></div>
                                  {ord.billBreakdown.codFee > 0 && (
                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>COD Handling Fee:</span> <strong>+₹{ord.billBreakdown.codFee}</strong></div>
                                  )}
                                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #cbd5e1", paddingTop: 6, fontWeight: 800, fontSize: 15, color: "#15803d" }}>
                                    <span>Grand Total:</span> <span>₹{ord.billBreakdown.grandTotal.toLocaleString("en-IN")}</span>
                                  </div>
                                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#475569" }}>
                                    <span>Amount Paid:</span> <strong>₹{ord.billBreakdown.amountPaid.toLocaleString("en-IN")}</strong>
                                  </div>
                                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#475569" }}>
                                    <span>Outstanding Balance:</span> <strong>₹{ord.billBreakdown.outstandingAmount.toLocaleString("en-IN")}</strong>
                                  </div>
                                </div>

                                {/* Payment Details */}
                                <div style={{ fontSize: 13, display: "grid", gap: 4, borderLeft: "1px solid #e2e8f0", paddingLeft: 16 }}>
                                  <strong style={{ fontSize: 12, textTransform: "uppercase", color: "#475569", marginBottom: 4, display: "block" }}>Payment & Gateway Details</strong>
                                  <div><span>Payment Method:</span> <strong>{ord.paymentDetails.paymentMethod}</strong></div>
                                  <div><span>Razorpay Payment ID:</span> <strong style={{ fontFamily: "monospace", fontSize: 12 }}>{ord.paymentDetails.razorpayPaymentId}</strong></div>
                                  <div><span>Razorpay Order ID:</span> <strong style={{ fontFamily: "monospace", fontSize: 12 }}>{ord.paymentDetails.razorpayOrderId}</strong></div>
                                  <div><span>Transaction ID:</span> <strong style={{ fontFamily: "monospace", fontSize: 12 }}>{ord.paymentDetails.transactionId}</strong></div>
                                  <div><span>Payment Status:</span> <strong>{ord.paymentDetails.paymentStatus}</strong></div>
                                  <div><span>Paid Date:</span> <span>{new Date(ord.paymentDetails.paidDate).toLocaleString("en-IN")}</span></div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
