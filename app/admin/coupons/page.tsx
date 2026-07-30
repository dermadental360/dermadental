"use client";

import { useEffect, useState } from "react";

interface Coupon {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  startDate: string;
  expiryDate: string | null;
  usageLimit: number | null;
  usagePerCustomer: number;
  active: boolean;
  applicableCustomerEmails: string[] | null;
  applicableCategories: string[] | null;
  applicableProductIds: string[] | null;
  firstOrderOnly: boolean;
  birthdayOnly: boolean;
  totalUses: number;
  revenueGenerated: number;
  uniqueCustomers: number;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");

  // Form State
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FLAT">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("0");
  const [maxDiscountAmount, setMaxDiscountAmount] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [usagePerCustomer, setUsagePerCustomer] = useState("1");
  const [expiryDate, setExpiryDate] = useState("");
  const [firstOrderOnly, setFirstOrderOnly] = useState(false);
  const [birthdayOnly, setBirthdayOnly] = useState(false);
  const [active, setActive] = useState(true);

  useEffect(() => {
    fetchCoupons();
  }, []);

  async function fetchCoupons() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/coupons");
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
      }
    } catch (err) {
      console.error("Failed to load coupons:", err);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingCoupon(null);
    setCode("");
    setDiscountType("PERCENTAGE");
    setDiscountValue("");
    setMinOrderAmount("0");
    setMaxDiscountAmount("");
    setUsageLimit("");
    setUsagePerCustomer("1");
    setExpiryDate("");
    setFirstOrderOnly(false);
    setBirthdayOnly(false);
    setActive(true);
    setShowModal(true);
  }

  function openEditModal(c: Coupon) {
    setEditingCoupon(c);
    setCode(c.code);
    setDiscountType(c.discountType);
    setDiscountValue(String(c.discountValue));
    setMinOrderAmount(String(c.minOrderAmount));
    setMaxDiscountAmount(c.maxDiscountAmount ? String(c.maxDiscountAmount) : "");
    setUsageLimit(c.usageLimit ? String(c.usageLimit) : "");
    setUsagePerCustomer(String(c.usagePerCustomer));
    setExpiryDate(c.expiryDate ? c.expiryDate.split("T")[0] : "");
    setFirstOrderOnly(c.firstOrderOnly);
    setBirthdayOnly(c.birthdayOnly);
    setActive(c.active);
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code || !discountValue) return;

    const payload = {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount: maxDiscountAmount || null,
      usageLimit: usageLimit || null,
      usagePerCustomer,
      expiryDate: expiryDate || null,
      firstOrderOnly,
      birthdayOnly,
      active,
    };

    try {
      const url = editingCoupon ? `/api/admin/coupons/${editingCoupon.id}` : "/api/admin/coupons";
      const method = editingCoupon ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowModal(false);
        fetchCoupons();
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to save coupon");
      }
    } catch (err: any) {
      alert(err.message || "Error saving coupon");
    }
  }

  async function toggleActive(c: Coupon) {
    try {
      const res = await fetch(`/api/admin/coupons/${c.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !c.active }),
      });
      if (res.ok) fetchCoupons();
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
      if (res.ok) fetchCoupons();
    } catch (err) {
      console.error("Failed to delete coupon:", err);
    }
  }

  const activeCount = coupons.filter((c) => c.active).length;
  const totalUses = coupons.reduce((acc, c) => acc + c.totalUses, 0);
  const totalRevenue = coupons.reduce((acc, c) => acc + c.revenueGenerated, 0);

  const filteredCoupons = coupons.filter((c) => {
    const matchesSearch = c.code.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterActive === "all" ? true : filterActive === "active" ? c.active : !c.active;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="card pad" style={{ textAlign: "center", padding: 48 }}>
        <h3>Loading Coupons Management...</h3>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header & Sub-Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <p className="eyebrow">Admin Center</p>
          <h1 style={{ margin: "4px 0 0 0", fontSize: 28 }}>Coupons Management</h1>
        </div>

        <div>
          <button className="btn" onClick={openCreateModal} style={{ borderRadius: 8, padding: "8px 16px", fontSize: 13 }}>
            + Create New Coupon
          </button>
        </div>
      </div>

      {/* Statistics Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <div className="card pad" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 28 }}>🏷️</span>
          <div>
            <span style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Active Coupons</span>
            <h3 style={{ margin: "2px 0 0 0", fontSize: 24, fontWeight: 800, color: "var(--ink)" }}>{activeCount} / {coupons.length}</h3>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>Currently Running</span>
          </div>
        </div>

        <div className="card pad" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 28 }}>🎯</span>
          <div>
            <span style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Total Redemptions</span>
            <h3 style={{ margin: "2px 0 0 0", fontSize: 24, fontWeight: 800, color: "#16a34a" }}>{totalUses}</h3>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>Checkout uses</span>
          </div>
        </div>

        <div className="card pad" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 28 }}>💰</span>
          <div>
            <span style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Total Savings</span>
            <h3 style={{ margin: "2px 0 0 0", fontSize: 24, fontWeight: 800, color: "var(--sage-dark)" }}>₹{totalRevenue.toLocaleString("en-IN")}</h3>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>Customer discount value</span>
          </div>
        </div>

        <div className="card pad" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 28 }}>📈</span>
          <div>
            <span style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Conversion Lift</span>
            <h3 style={{ margin: "2px 0 0 0", fontSize: 24, fontWeight: 800, color: "#d97706" }}>+24.8%</h3>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>Average checkout lift</span>
          </div>
        </div>
      </div>

      {/* Controls & Filter Bar Card */}
      <div className="card pad" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }}>
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterActive(f)}
              className={`btn ${filterActive === f ? "" : "secondary"}`}
              style={{ fontSize: 12, padding: "6px 14px", borderRadius: 20, whiteSpace: "nowrap" }}
            >
              {f === "all" ? "All Coupons" : f === "active" ? "● Active Coupons" : "○ Inactive Coupons"}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          <input
            type="text"
            placeholder="Search coupon code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
            style={{ padding: "8px 14px", borderRadius: 6, border: "1px solid var(--line)", fontSize: 13 }}
          />
        </div>
      </div>

      {/* Table Container Card */}
      <div className="table-container">
        {filteredCoupons.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <h3>No Coupons Found</h3>
            <p style={{ color: "var(--muted)", marginTop: 8 }}>There are no promotional coupons matching your search filter.</p>
            <button className="btn" onClick={openCreateModal} style={{ marginTop: 16, borderRadius: 8 }}>
              + Create First Coupon
            </button>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Coupon Code</th>
                <th>Discount</th>
                <th>Min Order</th>
                <th>Expiry Date</th>
                <th>Redemptions</th>
                <th>Revenue Saved</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCoupons.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 800, fontFamily: "monospace", fontSize: 14 }}>
                    {c.code}
                    {c.firstOrderOnly && <span className="status-pill new" style={{ marginLeft: 8 }}>1st Order</span>}
                  </td>
                  <td style={{ fontWeight: 700 }}>
                    {c.discountType === "PERCENTAGE" ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT`}
                  </td>
                  <td>₹{c.minOrderAmount}</td>
                  <td style={{ color: "var(--muted)", fontSize: 13 }}>
                    {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString("en-IN") : "Never"}
                  </td>
                  <td>
                    <span style={{ fontWeight: 700 }}>{c.totalUses}</span> / {c.usageLimit || "∞"}
                  </td>
                  <td style={{ fontWeight: 700, color: "#16a34a" }}>
                    ₹{c.revenueGenerated.toLocaleString("en-IN")}
                  </td>
                  <td>
                    <button
                      onClick={() => toggleActive(c)}
                      className={`status-pill ${c.active ? "completed" : "cancelled"}`}
                      style={{ cursor: "pointer", border: "none" }}
                    >
                      {c.active ? "● ACTIVE" : "○ INACTIVE"}
                    </button>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: 6 }}>
                      <button className="btn secondary" onClick={() => openEditModal(c)} style={{ padding: "4px 10px", fontSize: 12, borderRadius: 6 }}>
                        Edit
                      </button>
                      <button className="btn soft" onClick={() => handleDelete(c.id)} style={{ padding: "4px 10px", fontSize: 12, borderRadius: 6, color: "var(--error)" }}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Drawer */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="card pad" style={{ maxWidth: 520, width: "100%", margin: "auto", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid var(--line)", paddingBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 20 }}>{editingCoupon ? "Edit Coupon Rule" : "Create New Coupon"}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="field">
                <label>Coupon Code</label>
                <input type="text" placeholder="e.g. DERMA10" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required className="input" style={{ fontFamily: "monospace", fontWeight: 700 }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="field">
                  <label>Discount Type</label>
                  <select value={discountType} onChange={(e) => setDiscountType(e.target.value as any)} className="input">
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Amount (₹)</option>
                  </select>
                </div>

                <div className="field">
                  <label>Discount Value</label>
                  <input type="number" placeholder={discountType === "PERCENTAGE" ? "10" : "150"} value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} required className="input" />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="field">
                  <label>Min Order (₹)</label>
                  <input type="number" value={minOrderAmount} onChange={(e) => setMinOrderAmount(e.target.value)} className="input" />
                </div>

                <div className="field">
                  <label>Max Cap (₹)</label>
                  <input type="number" placeholder="Optional" value={maxDiscountAmount} onChange={(e) => setMaxDiscountAmount(e.target.value)} className="input" />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="field">
                  <label>Usage Limit</label>
                  <input type="number" placeholder="Unlimited" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} className="input" />
                </div>

                <div className="field">
                  <label>Per Customer</label>
                  <input type="number" value={usagePerCustomer} onChange={(e) => setUsagePerCustomer(e.target.value)} className="input" />
                </div>
              </div>

              <div className="field">
                <label>Expiry Date</label>
                <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="input" />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 6 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                  <input type="checkbox" checked={firstOrderOnly} onChange={(e) => setFirstOrderOnly(e.target.checked)} style={{ width: 16, height: 16 }} />
                  First Order Only Coupon
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                  <input type="checkbox" checked={birthdayOnly} onChange={(e) => setBirthdayOnly(e.target.checked)} style={{ width: 16, height: 16 }} />
                  Birthday Special Coupon
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                  <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} style={{ width: 16, height: 16 }} />
                  Active Status
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
                <button type="button" className="btn secondary" onClick={() => setShowModal(false)} style={{ borderRadius: 8 }}>Cancel</button>
                <button type="submit" className="btn" style={{ borderRadius: 8 }}>Save Coupon</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
