"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface WhatsAppLog {
  id: string;
  recipientPhone: string;
  recipientName: string | null;
  templateName: string | null;
  message: string;
  status: string;
  errorMessage: string | null;
  createdAt: string;
}

export default function WhatsAppSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Logs state
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [logSearch, setLogSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"settings" | "logs">("settings");

  // Connection Settings
  const [provider, setProvider] = useState("META");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [businessAccountId, setBusinessAccountId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [adminNumbers, setAdminNumbers] = useState("");
  const [testPhone, setTestPhone] = useState("");

  // Notification Event Toggles
  const [enableNewOrder, setEnableNewOrder] = useState(true);
  const [enableNewInquiry, setEnableNewInquiry] = useState(true);
  const [enablePaymentSuccess, setEnablePaymentSuccess] = useState(true);
  const [enableOrderPacked, setEnableOrderPacked] = useState(true);
  const [enableOrderShipped, setEnableOrderShipped] = useState(true);
  const [enableOutForDelivery, setEnableOutForDelivery] = useState(true);
  const [enableDelivered, setEnableDelivered] = useState(true);
  const [enableCancelled, setEnableCancelled] = useState(true);
  const [enableRefunded, setEnableRefunded] = useState(true);
  const [enableAbandonedCart, setEnableAbandonedCart] = useState(true);

  useEffect(() => {
    fetchSettings();
    fetchLogs();
  }, []);

  async function fetchSettings() {
    try {
      setLoading(true);
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        const settings = data.settings || {};
        setProvider(settings.whatsapp_provider || "META");
        setPhoneNumberId(settings.whatsapp_phone_number_id || "");
        setBusinessAccountId(settings.whatsapp_business_account_id || "");
        setAccessToken(settings.whatsapp_access_token || "");
        setVerifyToken(settings.whatsapp_verify_token || "dd360_verify_token");
        setWebhookUrl(settings.whatsapp_webhook_url || "");
        setAdminNumbers(settings.whatsapp_admin_numbers || "9833699887");

        setEnableNewOrder(settings.whatsapp_enable_new_order !== "false");
        setEnableNewInquiry(settings.whatsapp_enable_new_inquiry !== "false");
        setEnablePaymentSuccess(settings.whatsapp_enable_payment_success !== "false");
        setEnableOrderPacked(settings.whatsapp_enable_order_packed !== "false");
        setEnableOrderShipped(settings.whatsapp_enable_order_shipped !== "false");
        setEnableOutForDelivery(settings.whatsapp_enable_out_for_delivery !== "false");
        setEnableDelivered(settings.whatsapp_enable_delivered !== "false");
        setEnableCancelled(settings.whatsapp_enable_cancelled !== "false");
        setEnableRefunded(settings.whatsapp_enable_refunded !== "false");
        setEnableAbandonedCart(settings.whatsapp_enable_abandoned_cart !== "false");
      }
    } catch (err) {
      console.error("Failed to load WhatsApp settings:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchLogs() {
    try {
      const res = await fetch("/api/admin/whatsapp/logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Failed to load WhatsApp logs:", err);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    const payload = {
      whatsapp_provider: provider,
      whatsapp_phone_number_id: phoneNumberId,
      whatsapp_business_account_id: businessAccountId,
      whatsapp_access_token: accessToken,
      whatsapp_verify_token: verifyToken,
      whatsapp_webhook_url: webhookUrl,
      whatsapp_admin_numbers: adminNumbers,
      whatsapp_enable_new_order: enableNewOrder ? "true" : "false",
      whatsapp_enable_new_inquiry: enableNewInquiry ? "true" : "false",
      whatsapp_enable_payment_success: enablePaymentSuccess ? "true" : "false",
      whatsapp_enable_order_packed: enableOrderPacked ? "true" : "false",
      whatsapp_enable_order_shipped: enableOrderShipped ? "true" : "false",
      whatsapp_enable_out_for_delivery: enableOutForDelivery ? "true" : "false",
      whatsapp_enable_delivered: enableDelivered ? "true" : "false",
      whatsapp_enable_cancelled: enableCancelled ? "true" : "false",
      whatsapp_enable_refunded: enableRefunded ? "true" : "false",
      whatsapp_enable_abandoned_cart: enableAbandonedCart ? "true" : "false",
    };

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setStatusMessage({ text: "WhatsApp API credentials and notification triggers saved successfully!", type: "success" });
      } else {
        const errData = await res.json();
        setStatusMessage({ text: errData.error || "Failed to save settings", type: "error" });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Failed to save settings", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    setTesting(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/admin/whatsapp/test-connection", { method: "POST" });
      const data = await res.json();

      if (data.success) {
        setStatusMessage({ text: data.message, type: "success" });
      } else {
        setStatusMessage({ text: data.message || "Connection test failed", type: "error" });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Failed to test connection", type: "error" });
    } finally {
      setTesting(false);
    }
  }

  async function handleSendTestMessage() {
    if (!testPhone) {
      alert("Please enter a target phone number for test message");
      return;
    }

    setSendingTest(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/admin/whatsapp/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testPhone }),
      });
      const data = await res.json();

      if (data.success) {
        setStatusMessage({ text: data.message, type: "success" });
        fetchLogs();
      } else {
        setStatusMessage({ text: data.error || "Failed to send test message", type: "error" });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Failed to send test message", type: "error" });
    } finally {
      setSendingTest(false);
    }
  }

  // Calculate stats
  const totalSent = logs.length;
  const deliveredCount = logs.filter((l) => l.status === "SENT" || l.status === "DELIVERED").length;
  const failedCount = logs.filter((l) => l.status === "FAILED").length;
  const isConnected = Boolean(phoneNumberId && accessToken);

  const filteredLogs = logSearch
    ? logs.filter((l) => l.recipientPhone.includes(logSearch) || l.message.toLowerCase().includes(logSearch.toLowerCase()))
    : logs;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-8 flex flex-col items-center justify-center font-sans">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-10 h-10 border-4 border-[#14B8A6] border-t-transparent rounded-full mb-4" />
        <p className="text-slate-500 font-medium text-sm">Loading WhatsApp Automation Engine...</p>
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
                💬
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider text-teal-100 border border-white/20">
                    Medical SaaS Automation
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${isConnected ? "bg-emerald-400/20 text-emerald-200 border border-emerald-400/40" : "bg-amber-400/20 text-amber-200 border border-amber-400/40"}`}>
                    <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                    {isConnected ? "Cloud API Connected" : "Configuration Needed"}
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">WhatsApp Business Automation</h1>
                <p className="text-teal-100 text-sm sm:text-base mt-1 max-w-2xl font-normal">
                  Configure Meta WhatsApp Cloud API, customer order notifications, multi-admin notifications, and dynamic messaging logs.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} type="button" onClick={handleTestConnection} disabled={testing} className="px-5 py-3 bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-white rounded-xl text-sm font-semibold transition shadow-sm disabled:opacity-50 flex items-center gap-2">
                {testing ? "Testing..." : "⚡ Test Connection"}
              </motion.button>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} type="button" onClick={handleSave} disabled={saving} className="px-6 py-3 bg-white text-[#0F766E] hover:bg-teal-50 rounded-xl text-sm font-bold shadow-lg transition disabled:opacity-50 flex items-center gap-2">
                {saving ? "Saving..." : "💾 Save Settings"}
              </motion.button>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-2 mt-8 pt-6 border-t border-white/15">
            <button onClick={() => setActiveTab("settings")} className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${activeTab === "settings" ? "bg-white text-[#0F766E] shadow-sm" : "text-teal-100 hover:bg-white/10"}`}>
              ⚙️ Provider & Notification Settings
            </button>
            <button onClick={() => setActiveTab("logs")} className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${activeTab === "logs" ? "bg-white text-[#0F766E] shadow-sm" : "text-teal-100 hover:bg-white/10"}`}>
              📋 Message Activity Logs ({logs.length})
            </button>
          </div>
        </motion.div>

        {/* STATUS MESSAGE ALERT */}
        <AnimatePresence>
          {statusMessage && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={`p-4 rounded-2xl text-sm font-medium border flex items-center justify-between shadow-sm ${statusMessage.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"}`}>
              <div className="flex items-center gap-2">
                <span>{statusMessage.type === "success" ? "✅" : "⚠️"}</span>
                <span>{statusMessage.text}</span>
              </div>
              <button onClick={() => setStatusMessage(null)} className="text-xs opacity-60 hover:opacity-100">Dismiss</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm border-l-4 border-l-[#14B8A6]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Dispatches</span>
              <span className="p-2 rounded-xl bg-teal-50 text-[#14B8A6]">📨</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 mt-3">{totalSent}</p>
            <span className="text-xs text-slate-400 mt-1 block">Recorded in database</span>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Delivered</span>
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">✅</span>
            </div>
            <p className="text-3xl font-extrabold text-emerald-600 mt-3">{deliveredCount}</p>
            <span className="text-xs text-emerald-600 font-semibold mt-1 block">Successful deliveries</span>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Failed</span>
              <span className="p-2 rounded-xl bg-amber-50 text-amber-600">⚠️</span>
            </div>
            <p className="text-3xl font-extrabold text-amber-600 mt-3">{failedCount}</p>
            <span className="text-xs text-slate-400 mt-1 block">Invalid numbers / API errors</span>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm border-l-4 border-l-[#0F766E]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">API Health</span>
              <span className="p-2 rounded-xl bg-teal-50 text-[#0F766E]">📡</span>
            </div>
            <p className={`text-2xl font-bold mt-3 ${isConnected ? "text-emerald-600" : "text-amber-500"}`}>
              {isConnected ? "Healthy (100%)" : "Setup Required"}
            </p>
            <span className="text-xs text-slate-400 mt-1 block">Meta Graph v18.0</span>
          </motion.div>
        </div>

        {/* TAB CONTENTS */}
        {activeTab === "settings" ? (
          <form onSubmit={handleSave} className="space-y-8">
            {/* Section 1: Provider Credentials */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <span className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700 font-bold">1</span>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">API Provider Configuration</h2>
                  <p className="text-xs text-slate-500">Choose your provider and set up credentials. Never hardcoded.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">WhatsApp Provider</label>
                  <select value={provider} onChange={(e) => setProvider(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#14B8A6] outline-none transition">
                    <option value="META">Meta WhatsApp Cloud API (Recommended for Live Business)</option>
                    <option value="TWILIO">Twilio WhatsApp Sandbox / API</option>
                    <option value="CUSTOM_WEBHOOK">Custom Gateway Webhook</option>
                  </select>
                </div>

                {provider === "META" && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Phone Number ID</label>
                      <input type="text" placeholder="e.g. 104829104920194" value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#14B8A6] outline-none transition font-mono" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">WhatsApp Business Account ID</label>
                      <input type="text" placeholder="e.g. 984029481948291" value={businessAccountId} onChange={(e) => setBusinessAccountId(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#14B8A6] outline-none transition font-mono" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Permanent System Access Token</label>
                      <div className="relative">
                        <input type={showPassword ? "text" : "password"} placeholder="EAA..." value={accessToken} onChange={(e) => setAccessToken(e.target.value)} className="w-full p-3 pr-12 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-[#14B8A6] outline-none transition" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600">
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Webhook Verify Token</label>
                      <input type="text" value={verifyToken} onChange={(e) => setVerifyToken(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-[#14B8A6] outline-none transition" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Webhook Callback URL</label>
                      <input type="text" placeholder="https://dd360health.com/api/webhooks/whatsapp" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#14B8A6] outline-none transition" />
                    </div>
                  </>
                )}
              </div>
            </motion.div>

            {/* Section 2: Admin Recipients */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <span className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700 font-bold">2</span>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Admin Notification Recipients</h2>
                  <p className="text-xs text-slate-500">Supports multiple recipient numbers separated by commas for instant new order alerts.</p>
                </div>
              </div>
              <input type="text" placeholder="9833699887, 9876543210" value={adminNumbers} onChange={(e) => setAdminNumbers(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-[#14B8A6] outline-none transition" />
            </motion.div>

            {/* Section 3: Notification Event Toggles */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <span className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700 font-bold">3</span>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Automated Notification Triggers</h2>
                  <p className="text-xs text-slate-500">Toggle active events that automatically dispatch WhatsApp customer/admin notifications.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: "🛍️ New Order (Admin Alert)", state: enableNewOrder, setter: setEnableNewOrder },
                  { label: "📩 New Inquiry Alert", state: enableNewInquiry, setter: setEnableNewInquiry },
                  { label: "✅ Payment Success / Confirmed", state: enablePaymentSuccess, setter: setEnablePaymentSuccess },
                  { label: "📦 Order Packed", state: enableOrderPacked, setter: setEnableOrderPacked },
                  { label: "🚚 Order Shipped", state: enableOrderShipped, setter: setEnableOrderShipped },
                  { label: "🛵 Out For Delivery", state: enableOutForDelivery, setter: setEnableOutForDelivery },
                  { label: "🎉 Order Delivered", state: enableDelivered, setter: setEnableDelivered },
                  { label: "❌ Order Cancelled", state: enableCancelled, setter: setEnableCancelled },
                  { label: "💸 Payment Refunded", state: enableRefunded, setter: setEnableRefunded },
                  { label: "🛒 Abandoned Cart Reminder", state: enableAbandonedCart, setter: setEnableAbandonedCart },
                ].map((item, idx) => (
                  <label key={idx} className={`flex items-center justify-between p-4 rounded-2xl border transition cursor-pointer ${item.state ? "bg-teal-50/50 border-teal-200" : "bg-slate-50 border-slate-200 opacity-60"}`}>
                    <span className="text-xs font-bold text-slate-800">{item.label}</span>
                    <input type="checkbox" checked={item.state} onChange={(e) => item.setter(e.target.checked)} className="w-5 h-5 accent-[#14B8A6] rounded cursor-pointer" />
                  </label>
                ))}
              </div>
            </motion.div>

            {/* Section 4: Live Test Message */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <span className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700 font-bold">4</span>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Send Live Test Message</h2>
                  <p className="text-xs text-slate-500">Dispatch a test message to verify end-to-end delivery.</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input type="text" placeholder="Recipient Phone (e.g. 9833699887)" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#14B8A6]" />
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="button" onClick={handleSendTestMessage} disabled={sendingTest} className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition disabled:opacity-50">
                  {sendingTest ? "Sending..." : "📤 Send Test Message"}
                </motion.button>
              </div>
            </motion.div>
          </form>
        ) : (
          /* LOGS TAB */
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">WhatsApp Dispatch Logs</h2>
                <p className="text-xs text-slate-500">Real-time audit trail of all messages sent from PostgreSQL.</p>
              </div>
              <input type="text" placeholder="Search logs by phone or message..." value={logSearch} onChange={(e) => setLogSearch(e.target.value)} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm w-full sm:w-72 outline-none focus:ring-2 focus:ring-[#14B8A6]" />
            </div>

            {filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-medium">No WhatsApp dispatches recorded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                      <th className="p-4">Recipient</th>
                      <th className="p-4">Template</th>
                      <th className="p-4">Message Preview</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-4 font-mono font-semibold text-slate-900">{log.recipientPhone}</td>
                        <td className="p-4"><span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{log.templateName || "custom"}</span></td>
                        <td className="p-4 max-w-md truncate text-slate-600">{log.message}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${log.status === "SENT" || log.status === "DELIVERED" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="p-4 text-right text-xs text-slate-400">{new Date(log.createdAt).toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
