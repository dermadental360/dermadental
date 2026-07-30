"use client";

import { useEffect, useState } from "react";

export default function WhatsAppSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Connection Settings
  const [provider, setProvider] = useState("META");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [businessAccountId, setBusinessAccountId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [adminNumbers, setAdminNumbers] = useState("");

  // Test message target phone
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
        setStatusMessage({ text: "WhatsApp API & Notification settings saved successfully!", type: "success" });
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
      const res = await fetch("/api/admin/whatsapp/test-connection", {
        method: "POST",
      });
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
      } else {
        setStatusMessage({ text: data.error || "Failed to send test message", type: "error" });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Failed to send test message", type: "error" });
    } finally {
      setSendingTest(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-600 font-sans">Loading WhatsApp Settings...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 font-sans text-slate-800">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <span className="text-green-600 text-3xl">💬</span> WhatsApp Integration & Notification Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure Meta WhatsApp Cloud API, Twilio, or Custom Webhooks with live status triggers and multiple admin recipient numbers.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition disabled:opacity-50 flex items-center gap-2 border border-slate-300"
          >
            {testing ? "Testing..." : "⚡ Test Connection"}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 mb-6 rounded-lg text-sm font-medium border ${
            statusMessage.type === "success" ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Section 1: Provider Credentials */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            ⚙️ API Provider Configuration
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">WhatsApp Provider</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="META">Meta WhatsApp Cloud API (Recommended)</option>
                <option value="TWILIO">Twilio WhatsApp Sandbox / API</option>
                <option value="CUSTOM_WEBHOOK">Custom Gateway Webhook</option>
              </select>
            </div>

            {provider === "META" && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 104829104920194"
                    value={phoneNumberId}
                    onChange={(e) => setPhoneNumberId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Business Account ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 984029481948291"
                    value={businessAccountId}
                    onChange={(e) => setBusinessAccountId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Permanent System User Access Token</label>
                  <input
                    type="password"
                    placeholder="EAA..."
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Webhook Verify Token</label>
                  <input
                    type="text"
                    value={verifyToken}
                    onChange={(e) => setVerifyToken(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Webhook Callback URL</label>
                  <input
                    type="text"
                    placeholder="https://yourdomain.com/api/webhooks/whatsapp"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
              </>
            )}

            {provider === "TWILIO" && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Twilio Account SID</label>
                  <input
                    type="text"
                    value={businessAccountId}
                    onChange={(e) => setBusinessAccountId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Twilio Auth Token</label>
                  <input
                    type="password"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">From WhatsApp Number</label>
                  <input
                    type="text"
                    placeholder="+14155238886"
                    value={phoneNumberId}
                    onChange={(e) => setPhoneNumberId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none"
                  />
                </div>
              </>
            )}

            {provider === "CUSTOM_WEBHOOK" && (
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Custom Webhook Endpoint URL</label>
                <input
                  type="text"
                  placeholder="https://api.yourgateway.com/send"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Admin Recipient Numbers */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            📲 Admin Recipient WhatsApp Numbers
          </h2>
          <p className="text-xs text-slate-500 mb-3">
            Enter one or multiple phone numbers (separated by commas) to receive instant business order alerts.
          </p>
          <input
            type="text"
            placeholder="9833699887, 9876543210"
            value={adminNumbers}
            onChange={(e) => setAdminNumbers(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-green-500 outline-none"
          />
        </div>

        {/* Section 3: Notification Event Toggles */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            🔔 Automated Notification Triggers
          </h2>
          <p className="text-xs text-slate-500 mb-6">Select which events automatically dispatch WhatsApp messages to customers or admins.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100">
              <span className="text-sm font-semibold text-slate-800">🛍️ New Order WhatsApp (Admin Alert)</span>
              <input type="checkbox" checked={enableNewOrder} onChange={(e) => setEnableNewOrder(e.target.checked)} className="w-4 h-4 accent-green-600" />
            </label>

            <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100">
              <span className="text-sm font-semibold text-slate-800">📩 New Inquiry WhatsApp</span>
              <input type="checkbox" checked={enableNewInquiry} onChange={(e) => setEnableNewInquiry(e.target.checked)} className="w-4 h-4 accent-green-600" />
            </label>

            <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100">
              <span className="text-sm font-semibold text-slate-800">✅ Payment Success / Order Confirmed</span>
              <input type="checkbox" checked={enablePaymentSuccess} onChange={(e) => setEnablePaymentSuccess(e.target.checked)} className="w-4 h-4 accent-green-600" />
            </label>

            <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100">
              <span className="text-sm font-semibold text-slate-800">📦 Order Packed</span>
              <input type="checkbox" checked={enableOrderPacked} onChange={(e) => setEnableOrderPacked(e.target.checked)} className="w-4 h-4 accent-green-600" />
            </label>

            <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100">
              <span className="text-sm font-semibold text-slate-800">🚚 Order Shipped</span>
              <input type="checkbox" checked={enableOrderShipped} onChange={(e) => setEnableOrderShipped(e.target.checked)} className="w-4 h-4 accent-green-600" />
            </label>

            <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100">
              <span className="text-sm font-semibold text-slate-800">🛵 Out For Delivery</span>
              <input type="checkbox" checked={enableOutForDelivery} onChange={(e) => setEnableOutForDelivery(e.target.checked)} className="w-4 h-4 accent-green-600" />
            </label>

            <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100">
              <span className="text-sm font-semibold text-slate-800">🎉 Delivered</span>
              <input type="checkbox" checked={enableDelivered} onChange={(e) => setEnableDelivered(e.target.checked)} className="w-4 h-4 accent-green-600" />
            </label>

            <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100">
              <span className="text-sm font-semibold text-slate-800">❌ Cancelled</span>
              <input type="checkbox" checked={enableCancelled} onChange={(e) => setEnableCancelled(e.target.checked)} className="w-4 h-4 accent-green-600" />
            </label>

            <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100">
              <span className="text-sm font-semibold text-slate-800">💸 Refunded</span>
              <input type="checkbox" checked={enableRefunded} onChange={(e) => setEnableRefunded(e.target.checked)} className="w-4 h-4 accent-green-600" />
            </label>

            <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100">
              <span className="text-sm font-semibold text-slate-800">🛒 Abandoned Cart Recovery</span>
              <input type="checkbox" checked={enableAbandonedCart} onChange={(e) => setEnableAbandonedCart(e.target.checked)} className="w-4 h-4 accent-green-600" />
            </label>
          </div>
        </div>

        {/* Section 4: Test Message Dispatch */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
            ✉️ Send Live Test Message
          </h2>
          <p className="text-xs text-slate-500 mb-4">Send a sample test message to verify end-to-end delivery.</p>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Recipient Phone Number (e.g. 9833699887)"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              className="flex-1 p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
            <button
              type="button"
              onClick={handleSendTestMessage}
              disabled={sendingTest}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50 whitespace-nowrap"
            >
              {sendingTest ? "Sending..." : "📤 Send Test Message"}
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl text-base shadow-md transition disabled:opacity-50"
          >
            {saving ? "Saving Changes..." : "Save WhatsApp Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
