"use client";

import { useEffect, useState } from "react";

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
      alert(`Automated Batch Reminder Processed!\nSent ${data.whatsappCount || 0} WhatsApps and ${data.emailCount || 0} Emails.`);
      fetchCarts();
    } catch (err: any) {
      alert("Failed to process batch reminders: " + err.message);
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 font-sans text-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <span className="text-amber-500 text-3xl">🛒</span> Abandoned Cart Recovery
          </h1>
          <p className="text-sm text-slate-500 mt-1">Track uncompleted customer checkouts and dispatch WhatsApp/Email reminders.</p>
        </div>
        <button
          onClick={triggerBatchProcessing}
          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm transition shadow-sm flex items-center gap-2"
        >
          ⚡ Run Automated Recovery Batch
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Carts</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalCount}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Carts</span>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pendingCount}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recovered Carts</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.recoveredCount}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recovered Revenue</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">₹{stats.recoveredValue.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200 pb-3">
        {(["all", "pending", "recovered"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg capitalize transition ${
              filter === f ? "bg-slate-900 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {f === "all" ? "All Carts" : f === "pending" ? "Pending (Not Recovered)" : "Recovered"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 font-medium">Loading Carts...</div>
        ) : carts.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No abandoned carts found under this filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="p-4">Customer Details</th>
                  <th className="p-4">Cart Items</th>
                  <th className="p-4">Value</th>
                  <th className="p-4">Last Activity</th>
                  <th className="p-4">Reminders Sent</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Send Recovery</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {carts.map((cart) => (
                  <tr key={cart.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{cart.customerName || "Anonymous Visitor"}</p>
                      {cart.email ? <p className="text-xs text-slate-500">{cart.email}</p> : null}
                      {cart.phone ? <p className="text-xs font-mono text-slate-600">{cart.phone}</p> : null}
                    </td>
                    <td className="p-4 max-w-xs">
                      <div className="text-xs text-slate-700 space-y-1">
                        {Array.isArray(cart.items) &&
                          cart.items.map((item, idx) => (
                            <div key={idx} className="truncate">
                              • <strong>{item.name || "Item"}</strong> x{item.quantity || 1}
                            </div>
                          ))}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-slate-900">₹{cart.cartValue.toLocaleString("en-IN")}</td>
                    <td className="p-4 text-xs text-slate-500">{new Date(cart.lastActivity).toLocaleString("en-IN")}</td>
                    <td className="p-4 text-xs space-y-1">
                      <span className={`inline-block px-2 py-0.5 rounded font-semibold ${cart.whatsappSent ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-500"}`}>
                        WhatsApp: {cart.whatsappSent ? "SENT" : "No"}
                      </span>
                      <br />
                      <span className={`inline-block px-2 py-0.5 rounded font-semibold ${cart.emailSent ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-500"}`}>
                        Email: {cart.emailSent ? "SENT" : "No"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${cart.recovered ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                        {cart.recovered ? "RECOVERED" : "NOT RECOVERED"}
                      </span>
                      {cart.recoveredOrderId ? <p className="text-[10px] text-slate-400 font-mono mt-1">Order #{cart.recoveredOrderId}</p> : null}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {!cart.recovered && (
                        <>
                          <button
                            onClick={() => sendReminder(cart.id, "whatsapp")}
                            disabled={remindingId === cart.id || !cart.phone}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
                          >
                            WhatsApp
                          </button>
                          <button
                            onClick={() => sendReminder(cart.id, "email")}
                            disabled={remindingId === cart.id || !cart.email}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
                          >
                            Email
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
