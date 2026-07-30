"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
      <div className="min-h-screen bg-[#F8FAFC] p-8 flex flex-col items-center justify-center font-sans">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-10 h-10 border-4 border-[#14B8A6] border-t-transparent rounded-full mb-4" />
        <p className="text-slate-500 font-medium text-sm">Loading Coupon Analytics & Management...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* TOP HERO SECTION */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0F766E] via-[#14B8A6] to-[#0F766E] p-8 sm:p-10 text-white shadow-xl shadow-teal-900/10">
          <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-3xl shadow-inner shrink-0">
                🏷️
              </div>
              <div>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider text-teal-100 border border-white/20 mb-2 inline-block">
                  Promotions Engine
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Custom Coupon Management</h1>
                <p className="text-teal-100 text-sm sm:text-base mt-1 max-w-2xl font-normal">
                  Create percentage or flat discount rules, set customer & product eligibility, and monitor redemption statistics.
                </p>
              </div>
            </div>

            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={openCreateModal} className="px-6 py-3.5 bg-white text-[#0F766E] hover:bg-teal-50 rounded-xl text-sm font-extrabold shadow-lg transition flex items-center gap-2 shrink-0">
              <span className="text-lg">+</span> Create New Coupon
            </motion.button>
          </div>
        </motion.div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm border-l-4 border-l-[#14B8A6]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Coupons</span>
              <span className="p-2 rounded-xl bg-teal-50 text-[#14B8A6]">🏷️</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 mt-3">{activeCount} / {coupons.length}</p>
            <span className="text-xs text-slate-400 mt-1 block">Live promotional codes</span>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Redemptions</span>
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">🎯</span>
            </div>
            <p className="text-3xl font-extrabold text-emerald-600 mt-3">{totalUses} Times</p>
            <span className="text-xs text-slate-400 mt-1 block">Checkout usages</span>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm border-l-4 border-l-[#0F766E]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue Saved</span>
              <span className="p-2 rounded-xl bg-teal-50 text-[#0F766E]">💰</span>
            </div>
            <p className="text-3xl font-extrabold text-[#0F766E] mt-3">₹{totalRevenue.toLocaleString("en-IN")}</p>
            <span className="text-xs text-slate-400 mt-1 block">Total customer discount savings</span>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Conversion Boost</span>
              <span className="p-2 rounded-xl bg-amber-50 text-amber-600">📈</span>
            </div>
            <p className="text-3xl font-extrabold text-amber-600 mt-3">+24.8%</p>
            <span className="text-xs text-slate-400 mt-1 block">Average checkout lift</span>
          </motion.div>
        </div>

        {/* SEARCH AND FILTERS */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <input type="text" placeholder="Search by coupon code..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-[#14B8A6]" />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {(["all", "active", "inactive"] as const).map((f) => (
              <button key={f} onClick={() => setFilterActive(f)} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${filterActive === f ? "bg-[#0F766E] text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* DATA TABLE */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          {filteredCoupons.length === 0 ? (
            <div className="p-16 text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-teal-50 text-[#14B8A6] flex items-center justify-center text-4xl mx-auto">🏷️</div>
              <h3 className="text-lg font-bold text-slate-900">No Coupons Found</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">There are no discount coupons matching your search criteria. Create one to get started.</p>
              <button onClick={openCreateModal} className="px-6 py-2.5 bg-[#14B8A6] hover:bg-[#0F766E] text-white font-bold rounded-xl text-sm transition">
                + Create Coupon
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                    <th className="p-5">Coupon Code</th>
                    <th className="p-5">Discount</th>
                    <th className="p-5">Min Order</th>
                    <th className="p-5">Expiry Date</th>
                    <th className="p-5">Redemptions</th>
                    <th className="p-5">Revenue Saved</th>
                    <th className="p-5">Status</th>
                    <th className="p-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredCoupons.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-5">
                        <span className="px-3 py-1.5 bg-teal-50 text-[#0F766E] border border-teal-200 rounded-lg font-mono font-extrabold text-sm tracking-wider">
                          {c.code}
                        </span>
                        {c.firstOrderOnly && <span className="ml-2 text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded">1st Order</span>}
                      </td>
                      <td className="p-5 font-bold text-slate-900">
                        {c.discountType === "PERCENTAGE" ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT`}
                        {c.maxDiscountAmount && <span className="block text-xs font-normal text-slate-400">Max ₹{c.maxDiscountAmount}</span>}
                      </td>
                      <td className="p-5 font-medium text-slate-600">₹{c.minOrderAmount}</td>
                      <td className="p-5 text-slate-600">
                        {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString("en-IN") : <span className="text-slate-400">Never</span>}
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{c.totalUses} / {c.usageLimit || "∞"}</span>
                        </div>
                        {c.usageLimit && (
                          <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div className="bg-[#14B8A6] h-1.5 rounded-full" style={{ width: `${Math.min(100, (c.totalUses / c.usageLimit) * 100)}%` }} />
                          </div>
                        )}
                      </td>
                      <td className="p-5 font-extrabold text-emerald-600">₹{c.revenueGenerated.toLocaleString("en-IN")}</td>
                      <td className="p-5">
                        <button onClick={() => toggleActive(c)} className={`px-3 py-1 rounded-full text-xs font-bold transition ${c.active ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                          {c.active ? "● ACTIVE" : "○ INACTIVE"}
                        </button>
                      </td>
                      <td className="p-5 text-right space-x-2">
                        <button onClick={() => openEditModal(c)} className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition">Edit</button>
                        <button onClick={() => handleDelete(c.id)} className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* MODAL DRAWER */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <h2 className="text-xl font-extrabold text-slate-900">{editingCoupon ? "Edit Coupon Rule" : "Create New Coupon"}</h2>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Coupon Code</label>
                    <input type="text" placeholder="e.g. DERMA10" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-[#14B8A6]" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Discount Type</label>
                      <select value={discountType} onChange={(e) => setDiscountType(e.target.value as any)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-[#14B8A6]">
                        <option value="PERCENTAGE">Percentage (%)</option>
                        <option value="FLAT">Flat Amount (₹)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Discount Value</label>
                      <input type="number" placeholder={discountType === "PERCENTAGE" ? "10" : "150"} value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-[#14B8A6]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Min Order (₹)</label>
                      <input type="number" value={minOrderAmount} onChange={(e) => setMinOrderAmount(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-[#14B8A6]" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Max Cap (₹)</label>
                      <input type="number" placeholder="Optional" value={maxDiscountAmount} onChange={(e) => setMaxDiscountAmount(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-[#14B8A6]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Usage Limit</label>
                      <input type="number" placeholder="Unlimited" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-[#14B8A6]" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Per Customer</label>
                      <input type="number" value={usagePerCustomer} onChange={(e) => setUsagePerCustomer(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-[#14B8A6]" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Expiry Date</label>
                    <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-[#14B8A6]" />
                  </div>

                  <div className="space-y-3 pt-3">
                    <label className="flex items-center gap-3 text-xs font-bold text-slate-700 cursor-pointer p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <input type="checkbox" checked={firstOrderOnly} onChange={(e) => setFirstOrderOnly(e.target.checked)} className="w-4 h-4 accent-[#14B8A6]" />
                      First Order Only Coupon
                    </label>
                    <label className="flex items-center gap-3 text-xs font-bold text-slate-700 cursor-pointer p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <input type="checkbox" checked={birthdayOnly} onChange={(e) => setBirthdayOnly(e.target.checked)} className="w-4 h-4 accent-[#14B8A6]" />
                      Birthday Special Coupon
                    </label>
                    <label className="flex items-center gap-3 text-xs font-bold text-slate-700 cursor-pointer p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="w-4 h-4 accent-[#14B8A6]" />
                      Active Status
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                    <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm">Cancel</button>
                    <button type="submit" className="px-6 py-2.5 bg-[#14B8A6] hover:bg-[#0F766E] text-white font-extrabold rounded-xl text-sm shadow-md transition">Save Coupon</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
