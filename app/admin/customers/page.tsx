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

  return (
    <div className="max-w-7xl mx-auto p-6 font-sans text-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <span className="text-blue-600 text-3xl">👥</span> Customer Analytics & Lifetime Value
          </h1>
          <p className="text-sm text-slate-500 mt-1">Detailed customer metrics, lifetime value (LTV), repeat order rates, and cart behavior.</p>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Unique Customers</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalCustomersCount}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Repeat Customers</span>
          <p className="text-2xl font-bold text-blue-600 mt-1">{metrics.repeatCustomersCount} ({metrics.repeatCustomerRate}%)</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Order Value (AOV)</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">₹{metrics.overallAOV.toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Repeat Order Rate</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.repeatCustomerRate}%</p>
        </div>
      </div>

      {/* Customers List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 font-medium">Loading Customer Analytics...</div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No customer purchase data available yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="p-4">Customer Name & Info</th>
                  <th className="p-4">Lifetime Value (LTV)</th>
                  <th className="p-4">Orders Count</th>
                  <th className="p-4">Avg Order Value</th>
                  <th className="p-4">Top Product</th>
                  <th className="p-4">Carts Abandoned</th>
                  <th className="p-4">Coupons Used</th>
                  <th className="p-4 text-right">Last Order Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{c.name}</p>
                      <p className="text-xs text-slate-500">{c.email}</p>
                      <p className="text-xs font-mono text-slate-600">{c.phone}</p>
                    </td>
                    <td className="p-4 font-bold text-emerald-600">₹{c.totalSpent.toLocaleString("en-IN")}</td>
                    <td className="p-4 font-semibold text-slate-800">
                      {c.ordersCount} {c.ordersCount > 1 ? <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full ml-1">REPEAT</span> : null}
                    </td>
                    <td className="p-4 font-medium text-slate-700">₹{c.averageOrderValue.toLocaleString("en-IN")}</td>
                    <td className="p-4 text-xs font-medium text-slate-700 max-w-xs truncate">{c.mostPurchasedProduct}</td>
                    <td className="p-4 font-semibold text-amber-600">{c.abandonedCartCount}</td>
                    <td className="p-4 font-semibold text-slate-700">{c.couponUsageCount}</td>
                    <td className="p-4 text-right text-xs text-slate-500">{new Date(c.lastPurchase).toLocaleDateString("en-IN")}</td>
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
