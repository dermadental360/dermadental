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

  const totalRevenue = coupons.reduce((acc, c) => acc + c.revenueGenerated, 0);
  const totalUses = coupons.reduce((acc, c) => acc + c.totalUses, 0);

  return (
    <div className="max-w-7xl mx-auto p-6 font-sans text-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <span className="text-emerald-600 text-3xl">🏷️</span> Custom Coupon Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">Create discount codes, set eligibility constraints, and track revenue generated.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition shadow-sm flex items-center gap-2"
        >
          <span>+</span> Create New Coupon
        </button>
      </div>

      {/* Analytics Summary Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Active Coupons</span>
          <p className="text-2xl font-bold text-slate-900 mt-2">{coupons.filter((c) => c.active).length} / {coupons.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Times Redemed</span>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalUses} Times</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Discounts Given</span>
          <p className="text-2xl font-bold text-emerald-600 mt-2">₹{totalRevenue.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* Coupon List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 font-medium">Loading Coupons...</div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No coupons created yet. Click &quot;Create New Coupon&quot; to begin.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="p-4">Coupon Code</th>
                  <th className="p-4">Discount</th>
                  <th className="p-4">Min Order</th>
                  <th className="p-4">Expiry Date</th>
                  <th className="p-4">Uses / Limit</th>
                  <th className="p-4">Total Savings</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 font-mono font-bold text-slate-900">{c.code}</td>
                    <td className="p-4 font-semibold text-slate-800">
                      {c.discountType === "PERCENTAGE" ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT`}
                      {c.maxDiscountAmount ? <span className="block text-xs font-normal text-slate-400">Max ₹{c.maxDiscountAmount}</span> : null}
                    </td>
                    <td className="p-4 font-medium text-slate-600">₹{c.minOrderAmount}</td>
                    <td className="p-4 text-slate-600">
                      {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString("en-IN") : <span className="text-slate-400">No Expiry</span>}
                    </td>
                    <td className="p-4 font-medium text-slate-700">
                      {c.totalUses} / {c.usageLimit || "∞"}
                    </td>
                    <td className="p-4 font-bold text-emerald-600">₹{c.revenueGenerated.toLocaleString("en-IN")}</td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleActive(c)}
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          c.active ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {c.active ? "ACTIVE" : "INACTIVE"}
                      </button>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => openEditModal(c)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">{editingCoupon ? "Edit Coupon" : "Create New Coupon"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Coupon Code</label>
                <input
                  type="text"
                  placeholder="e.g. DERMA10"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Discount Value</label>
                  <input
                    type="number"
                    placeholder={discountType === "PERCENTAGE" ? "10" : "150"}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Minimum Order (₹)</label>
                  <input
                    type="number"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Discount Cap (₹)</label>
                  <input
                    type="number"
                    placeholder="Optional"
                    value={maxDiscountAmount}
                    onChange={(e) => setMaxDiscountAmount(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Global Usage Limit</label>
                  <input
                    type="number"
                    placeholder="Unlimited"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Uses Per Customer</label>
                  <input
                    type="number"
                    value={usagePerCustomer}
                    onChange={(e) => setUsagePerCustomer(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none"
                />
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={firstOrderOnly} onChange={(e) => setFirstOrderOnly(e.target.checked)} className="accent-emerald-600" />
                  First Order Only Coupon
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={birthdayOnly} onChange={(e) => setBirthdayOnly(e.target.checked)} className="accent-emerald-600" />
                  Birthday Special Coupon
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="accent-emerald-600" />
                  Active Status
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm shadow-sm">
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
