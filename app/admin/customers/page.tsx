"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

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
      <div className="min-h-screen bg-[#F8FAFC] p-8 flex flex-col items-center justify-center font-sans">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-10 h-10 border-4 border-[#14B8A6] border-t-transparent rounded-full mb-4" />
        <p className="text-slate-500 font-medium text-sm">Loading Customer Lifetime Value Engine...</p>
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
                👥
              </div>
              <div>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider text-teal-100 border border-white/20 mb-2 inline-block">
                  Customer Intelligence
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Customer Analytics & LTV</h1>
                <p className="text-teal-100 text-sm sm:text-base mt-1 max-w-2xl font-normal">
                  Track Customer Lifetime Value (LTV), average order values, repeat buyer frequencies, and purchasing trends.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="px-4 py-2 bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl text-xs font-bold text-white">
                Total Revenue: ₹{customers.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString("en-IN")}
              </div>
            </div>
          </div>
        </motion.div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm border-l-4 border-l-[#14B8A6]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unique Customers</span>
              <span className="p-2 rounded-xl bg-teal-50 text-[#14B8A6]">👥</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 mt-3">{metrics.totalCustomersCount}</p>
            <span className="text-xs text-slate-400 mt-1 block">Registered & guest buyers</span>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Repeat Buyer Rate</span>
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">🔄</span>
            </div>
            <p className="text-3xl font-extrabold text-emerald-600 mt-3">{metrics.repeatCustomerRate}%</p>
            <span className="text-xs text-emerald-600 font-semibold mt-1 block">{metrics.repeatCustomersCount} Repeat Buyers</span>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm border-l-4 border-l-[#0F766E]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Order Value</span>
              <span className="p-2 rounded-xl bg-teal-50 text-[#0F766E]">💳</span>
            </div>
            <p className="text-3xl font-extrabold text-[#0F766E] mt-3">₹{metrics.overallAOV.toLocaleString("en-IN")}</p>
            <span className="text-xs text-slate-400 mt-1 block">Average cart size</span>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Top Spender LTV</span>
              <span className="p-2 rounded-xl bg-purple-50 text-purple-600">⭐</span>
            </div>
            <p className="text-3xl font-extrabold text-purple-600 mt-3">₹{maxSpent.toLocaleString("en-IN")}</p>
            <span className="text-xs text-slate-400 mt-1 block">Highest individual LTV</span>
          </motion.div>
        </div>

        {/* SEARCH BAR */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <input type="text" placeholder="Search customers by name, email, or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-[#14B8A6]" />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          </div>

          <div className="text-xs font-bold text-slate-400">
            Showing {filteredCustomers.length} of {customers.length} Customers
          </div>
        </div>

        {/* DATA TABLE */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          {filteredCustomers.length === 0 ? (
            <div className="p-16 text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-teal-50 text-[#14B8A6] flex items-center justify-center text-4xl mx-auto">👥</div>
              <h3 className="text-lg font-bold text-slate-900">No Customers Found</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">No customer records matched your query.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                    <th className="p-5">Customer Profile</th>
                    <th className="p-5">Lifetime Value (LTV)</th>
                    <th className="p-5">Orders</th>
                    <th className="p-5">Avg Order Value</th>
                    <th className="p-5">Top Product</th>
                    <th className="p-5">Carts Abandoned</th>
                    <th className="p-5">Coupons Used</th>
                    <th className="p-5 text-right">Last Purchase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredCustomers.map((c) => {
                    const initial = c.name.charAt(0).toUpperCase();
                    const ltvPercent = Math.round((c.totalSpent / maxSpent) * 100);

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#14B8A6]/10 text-[#0F766E] font-extrabold flex items-center justify-center text-sm shadow-inner shrink-0">
                              {initial}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 flex items-center gap-2">
                                {c.name}
                                {c.ordersCount > 2 ? (
                                  <span className="text-[10px] font-extrabold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">VIP</span>
                                ) : c.ordersCount > 1 ? (
                                  <span className="text-[10px] font-extrabold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">REPEAT</span>
                                ) : (
                                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">1st Order</span>
                                )}
                              </p>
                              <p className="text-xs text-slate-500">{c.email}</p>
                              <p className="text-xs font-mono text-slate-600">{c.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-5">
                          <span className="font-extrabold text-emerald-600 text-base">₹{c.totalSpent.toLocaleString("en-IN")}</span>
                          <div className="w-28 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div className="bg-[#14B8A6] h-1.5 rounded-full" style={{ width: `${Math.max(8, ltvPercent)}%` }} />
                          </div>
                        </td>
                        <td className="p-5 font-bold text-slate-800">{c.ordersCount}</td>
                        <td className="p-5 font-semibold text-slate-700">₹{c.averageOrderValue.toLocaleString("en-IN")}</td>
                        <td className="p-5 max-w-xs truncate text-xs font-medium text-slate-700">{c.mostPurchasedProduct}</td>
                        <td className="p-5 font-bold text-amber-600">{c.abandonedCartCount}</td>
                        <td className="p-5 font-semibold text-slate-700">{c.couponUsageCount}</td>
                        <td className="p-5 text-right text-xs text-slate-400">{new Date(c.lastPurchase).toLocaleDateString("en-IN")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
