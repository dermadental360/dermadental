"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface CartItem {
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface AbandonedCart {
  id: string;
  sessionId: string;
  customerName: string | null;
  email: string | null;
  phone: string | null;
  items: CartItem[];
  cartValue: number;
  recovered: boolean;
  recoveredOrderId: string | null;
  lastActivity: string;
  whatsappSent: boolean;
  emailSent: boolean;
}

export default function AdminAbandonedCartsPage() {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "recovered">("all");
  const [loading, setLoading] = useState(true);
  const [remindingId, setRemindingId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalCount: 0,
    recoveredCount: 0,
    pendingCount: 0,
    recoveredValue: 0,
    lostValue: 0,
  });

  useEffect(() => {
    fetchCarts();
  }, [filter]);

  async function fetchCarts() {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/abandoned-carts?filter=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setCarts(data.carts || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load abandoned carts:", err);
    } finally {
      setLoading(false);
    }
  }

  async function sendReminder(id: string, type: "whatsapp" | "email" | "both") {
    setRemindingId(id);
    try {
      const res = await fetch(`/api/admin/abandoned-carts/${id}/remind`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();

      if (data.success) {
        alert("Reminder dispatched successfully!");
        fetchCarts();
      } else {
        alert(data.error || "Failed to send reminder");
      }
    } catch (err: any) {
      alert(err.message || "Failed to send reminder");
    } finally {
      setRemindingId(null);
    }
  }

  async function triggerBatchProcessing() {
    try {
      const res = await fetch("/api/admin/abandoned-carts", { method: "POST" });
      const data = await res.json();
      alert(`Automated Batch Recovery Processed!\nSent ${data.whatsappCount || 0} WhatsApps and ${data.emailCount || 0} Emails.`);
      fetchCarts();
    } catch (err: any) {
      alert("Failed to process batch reminders: " + err.message);
    }
  }

  const recoveryRate = stats.totalCount > 0 ? ((stats.recoveredCount / stats.totalCount) * 100).toFixed(1) : "0.0";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-8 flex flex-col items-center justify-center font-sans">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-10 h-10 border-4 border-[#14B8A6] border-t-transparent rounded-full mb-4" />
        <p className="text-slate-500 font-medium text-sm">Loading Abandoned Cart Engine...</p>
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
                🛒
              </div>
              <div>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider text-teal-100 border border-white/20 mb-2 inline-block">
                  Automated Revenue Recovery
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Abandoned Cart Recovery</h1>
                <p className="text-teal-100 text-sm sm:text-base mt-1 max-w-2xl font-normal">
                  Track every uncompleted checkout, trigger single-click WhatsApp or Email dispatches, and auto-mark recovered orders.
                </p>
              </div>
            </div>

            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={triggerBatchProcessing} className="px-6 py-3.5 bg-white text-[#0F766E] hover:bg-teal-50 rounded-xl text-sm font-extrabold shadow-lg transition flex items-center gap-2 shrink-0">
              ⚡ Run Recovery Batch
            </motion.button>
          </div>
        </motion.div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm border-l-4 border-l-[#14B8A6]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Abandoned</span>
              <span className="p-2 rounded-xl bg-teal-50 text-[#14B8A6]">🛒</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 mt-3">{stats.totalCount}</p>
            <span className="text-xs text-slate-400 mt-1 block">Tracked checkout sessions</span>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Recovery</span>
              <span className="p-2 rounded-xl bg-amber-50 text-amber-600">⏳</span>
            </div>
            <p className="text-3xl font-extrabold text-amber-600 mt-3">{stats.pendingCount}</p>
            <span className="text-xs text-slate-400 mt-1 block">Awaiting customer return</span>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recovered Carts</span>
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">🎉</span>
            </div>
            <p className="text-3xl font-extrabold text-emerald-600 mt-3">{stats.recoveredCount} ({recoveryRate}%)</p>
            <span className="text-xs text-emerald-600 font-semibold mt-1 block">Successfully converted</span>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm border-l-4 border-l-[#0F766E]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recovered Revenue</span>
              <span className="p-2 rounded-xl bg-teal-50 text-[#0F766E]">💰</span>
            </div>
            <p className="text-3xl font-extrabold text-[#0F766E] mt-3">₹{stats.recoveredValue.toLocaleString("en-IN")}</p>
            <span className="text-xs text-slate-400 mt-1 block">Saved business sales</span>
          </motion.div>
        </div>

        {/* FILTER TABS */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-2">
          {(["all", "pending", "recovered"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition ${filter === f ? "bg-[#0F766E] text-white shadow-sm" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}>
              {f === "all" ? "All Carts" : f === "pending" ? "Pending Recovery" : "Recovered"}
            </button>
          ))}
        </div>

        {/* DATA TABLE */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          {carts.length === 0 ? (
            <div className="p-16 text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-teal-50 text-[#14B8A6] flex items-center justify-center text-4xl mx-auto">🛒</div>
              <h3 className="text-lg font-bold text-slate-900">No Abandoned Carts</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">There are no carts in this category. All customer checkouts are either complete or empty.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                    <th className="p-5">Customer Info</th>
                    <th className="p-5">Cart Contents</th>
                    <th className="p-5">Cart Value</th>
                    <th className="p-5">Last Activity</th>
                    <th className="p-5">Dispatches</th>
                    <th className="p-5">Status</th>
                    <th className="p-5 text-right">Send Recovery</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {carts.map((cart) => {
                    const name = cart.customerName || "Anonymous Visitor";
                    const initial = name.charAt(0).toUpperCase();

                    return (
                      <tr key={cart.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-teal-100 text-[#0F766E] font-extrabold flex items-center justify-center text-sm shadow-inner shrink-0">
                              {initial}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{name}</p>
                              {cart.email && <p className="text-xs text-slate-500">{cart.email}</p>}
                              {cart.phone && <p className="text-xs font-mono text-slate-600">{cart.phone}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="p-5 max-w-xs">
                          <div className="text-xs text-slate-700 space-y-1">
                            {Array.isArray(cart.items) &&
                              cart.items.map((item, idx) => (
                                <div key={idx} className="truncate">
                                  • <strong className="text-slate-900">{item.name || "Item"}</strong> x{item.quantity || 1}
                                </div>
                              ))}
                          </div>
                        </td>
                        <td className="p-5 font-extrabold text-slate-900">₹{cart.cartValue.toLocaleString("en-IN")}</td>
                        <td className="p-5 text-xs text-slate-500">{new Date(cart.lastActivity).toLocaleString("en-IN")}</td>
                        <td className="p-5 text-xs space-y-1">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold ${cart.whatsappSent ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-400"}`}>
                            WhatsApp: {cart.whatsappSent ? "SENT" : "No"}
                          </span>
                          <br />
                          <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold ${cart.emailSent ? "bg-sky-100 text-sky-800" : "bg-slate-100 text-slate-400"}`}>
                            Email: {cart.emailSent ? "SENT" : "No"}
                          </span>
                        </td>
                        <td className="p-5">
                          <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${cart.recovered ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                            {cart.recovered ? "RECOVERED" : "PENDING"}
                          </span>
                          {cart.recoveredOrderId && <p className="text-[10px] text-slate-400 font-mono mt-1">Order #{cart.recoveredOrderId}</p>}
                        </td>
                        <td className="p-5 text-right space-x-2">
                          {!cart.recovered && (
                            <>
                              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => sendReminder(cart.id, "whatsapp")} disabled={remindingId === cart.id || !cart.phone} className="px-3.5 py-1.5 bg-[#14B8A6] hover:bg-[#0F766E] text-white rounded-xl text-xs font-bold transition disabled:opacity-40">
                                WhatsApp
                              </motion.button>
                              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => sendReminder(cart.id, "email")} disabled={remindingId === cart.id || !cart.email} className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition disabled:opacity-40">
                                Email
                              </motion.button>
                            </>
                          )}
                        </td>
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
