"use client";

import { useEffect, useState } from "react";

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
        alert("WhatsApp settings saved successfully!");
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to save settings");
      }
    } catch (err: any) {
      alert(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    setTesting(true);
    try {
      const res = await fetch("/api/admin/whatsapp/test-connection", { method: "POST" });
      const data = await res.json();
      alert(data.message || (data.success ? "Connection successful!" : "Connection failed"));
    } catch (err: any) {
      alert(err.message || "Failed to test connection");
    } finally {
      setTesting(false);
    }
  }

  async function handleSendTestMessage() {
    if (!testPhone) {
      alert("Please enter a recipient phone number for the test message");
      return;
    }

    setSendingTest(true);
    try {
      const res = await fetch("/api/admin/whatsapp/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testPhone }),
      });
      const data = await res.json();

      if (data.success) {
        alert(data.message || "Test message sent!");
        fetchLogs();
      } else {
        alert(data.error || "Failed to send test message");
      }
    } catch (err: any) {
      alert(err.message || "Failed to send test message");
    } finally {
      setSendingTest(false);
    }
  }

  const totalSent = logs.length;
  const deliveredCount = logs.filter((l) => l.status === "SENT" || l.status === "DELIVERED").length;
  const failedCount = logs.filter((l) => l.status === "FAILED").length;
  const isConnected = Boolean(phoneNumberId && accessToken);

  const filteredLogs = logSearch
    ? logs.filter((l) => l.recipientPhone.includes(logSearch) || l.message.toLowerCase().includes(logSearch.toLowerCase()))
    : logs;

  if (loading) {
    return (
      <div className="card pad" style={{ textAlign: "center", padding: 48 }}>
        <h3>Loading WhatsApp Settings...</h3>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header & Sub-Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <p className="eyebrow">Admin Center</p>
          <h1 style={{ margin: "4px 0 0 0", fontSize: 28 }}>WhatsApp Settings & Controls</h1>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            className={`btn ${activeTab === "settings" ? "" : "secondary"}`}
            onClick={() => setActiveTab("settings")}
            style={{ borderRadius: 8, padding: "8px 16px", fontSize: 13 }}
          >
            ⚙️ Configuration & Triggers
          </button>
          <button
            className={`btn ${activeTab === "logs" ? "" : "secondary"}`}
            onClick={() => setActiveTab("logs")}
            style={{ borderRadius: 8, padding: "8px 16px", fontSize: 13 }}
          >
            📋 Dispatch Logs ({logs.length})
          </button>
        </div>
      </div>

      {/* Statistics Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <div className="card pad" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 28 }}>💬</span>
          <div>
            <span style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Connection Status</span>
            <h3 style={{ margin: "2px 0 0 0", fontSize: 18, fontWeight: 800, color: isConnected ? "#16a34a" : "#d97706" }}>
              {isConnected ? "CONNECTED" : "NOT CONFIGURED"}
            </h3>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>Meta WhatsApp Cloud API</span>
          </div>
        </div>

        <div className="card pad" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 28 }}>📨</span>
          <div>
            <span style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Total Dispatches</span>
            <h3 style={{ margin: "2px 0 0 0", fontSize: 24, fontWeight: 800, color: "var(--ink)" }}>{totalSent}</h3>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>Messages logged</span>
          </div>
        </div>

        <div className="card pad" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 28 }}>✅</span>
          <div>
            <span style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Delivered</span>
            <h3 style={{ margin: "2px 0 0 0", fontSize: 24, fontWeight: 800, color: "#16a34a" }}>{deliveredCount}</h3>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>Successful dispatches</span>
          </div>
        </div>

        <div className="card pad" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 28 }}>⚠️</span>
          <div>
            <span style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Failed</span>
            <h3 style={{ margin: "2px 0 0 0", fontSize: 24, fontWeight: 800, color: "#dc2626" }}>{failedCount}</h3>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>Delivery errors</span>
          </div>
        </div>
      </div>

      {activeTab === "settings" ? (
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Card 1: API Configuration */}
          <div className="card pad" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <h3 style={{ fontSize: 18, margin: "0 0 4px 0" }}>1. API Provider Credentials</h3>
              <p style={{ color: "var(--muted)", margin: 0, fontSize: 13 }}>
                Configure Meta WhatsApp Cloud API or Twilio parameters. Credentials are securely stored in PostgreSQL.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, borderTop: "1px solid var(--line)", paddingTop: 16 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: 6 }}>WhatsApp Provider</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="input"
                  style={{ padding: "10px 14px", fontSize: 14 }}
                >
                  <option value="META">Meta WhatsApp Cloud API (Recommended)</option>
                  <option value="TWILIO">Twilio WhatsApp API</option>
                  <option value="CUSTOM_WEBHOOK">Custom Gateway Webhook</option>
                </select>
              </div>

              {provider === "META" && (
                <>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: 6 }}>Phone Number ID</label>
                    <input
                      type="text"
                      placeholder="e.g. 104829104920194"
                      value={phoneNumberId}
                      onChange={(e) => setPhoneNumberId(e.target.value)}
                      className="input"
                      style={{ padding: "10px 14px", fontSize: 14 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: 6 }}>WhatsApp Business Account ID</label>
                    <input
                      type="text"
                      placeholder="e.g. 984029481948291"
                      value={businessAccountId}
                      onChange={(e) => setBusinessAccountId(e.target.value)}
                      className="input"
                      style={{ padding: "10px 14px", fontSize: 14 }}
                    />
                  </div>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <label style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Permanent Access Token</label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ background: "none", border: "none", color: "var(--sage-dark)", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
                      >
                        {showPassword ? "Hide Token" : "Show Token"}
                      </button>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="EAA..."
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      className="input"
                      style={{ padding: "10px 14px", fontSize: 14, fontFamily: "monospace" }}
                    />
                  </div>
                </>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
              <button
                type="button"
                className="btn secondary"
                onClick={handleTestConnection}
                disabled={testing}
                style={{ borderRadius: 8, padding: "8px 16px", fontSize: 13 }}
              >
                {testing ? "Testing..." : "⚡ Test Connection"}
              </button>
            </div>
          </div>

          {/* Card 2: Webhook & Admin Recipients */}
          <div className="card pad" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <h3 style={{ fontSize: 18, margin: "0 0 4px 0" }}>2. Webhook & Admin Recipients</h3>
              <p style={{ color: "var(--muted)", margin: 0, fontSize: 13 }}>
                Configure incoming webhook verify parameters and phone numbers receiving business alerts.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, borderTop: "1px solid var(--line)", paddingTop: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: 6 }}>Webhook Verify Token</label>
                <input
                  type="text"
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value)}
                  className="input"
                  style={{ padding: "10px 14px", fontSize: 14 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: 6 }}>Webhook Callback URL</label>
                <input
                  type="text"
                  placeholder="https://dd360health.com/api/webhooks/whatsapp"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="input"
                  style={{ padding: "10px 14px", fontSize: 14 }}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: 6 }}>
                  Admin Recipient Phone Numbers (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="9833699887, 9876543210"
                  value={adminNumbers}
                  onChange={(e) => setAdminNumbers(e.target.value)}
                  className="input"
                  style={{ padding: "10px 14px", fontSize: 14, fontFamily: "monospace" }}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Automated Event Notification Triggers */}
          <div className="card pad" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <h3 style={{ fontSize: 18, margin: "0 0 4px 0" }}>3. Automated Notification Triggers</h3>
              <p style={{ color: "var(--muted)", margin: 0, fontSize: 13 }}>
                Enable or disable automated WhatsApp dispatches for specific customer & admin order events.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, borderTop: "1px solid var(--line)", paddingTop: 16 }}>
              {[
                { label: "🛍️ New Order WhatsApp (Admin Alert)", value: enableNewOrder, setter: setEnableNewOrder },
                { label: "📩 New Inquiry WhatsApp Alert", value: enableNewInquiry, setter: setEnableNewInquiry },
                { label: "✅ Payment Success / Order Confirmed", value: enablePaymentSuccess, setter: setEnablePaymentSuccess },
                { label: "📦 Order Packed Alert", value: enableOrderPacked, setter: setEnableOrderPacked },
                { label: "🚚 Order Shipped Alert", value: enableOrderShipped, setter: setEnableOrderShipped },
                { label: "🛵 Out For Delivery Alert", value: enableOutForDelivery, setter: setEnableOutForDelivery },
                { label: "🎉 Order Delivered Alert", value: enableDelivered, setter: setEnableDelivered },
                { label: "❌ Order Cancelled Alert", value: enableCancelled, setter: setEnableCancelled },
                { label: "💸 Order Refunded Alert", value: enableRefunded, setter: setEnableRefunded },
                { label: "🛒 Abandoned Cart Recovery Alert", value: enableAbandonedCart, setter: setEnableAbandonedCart },
              ].map((item, idx) => (
                <label key={idx} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, cursor: "pointer", background: "var(--bg-secondary)", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--line)" }}>
                  <input
                    type="checkbox"
                    checked={item.value}
                    onChange={(e) => item.setter(e.target.checked)}
                    style={{ width: 18, height: 18, cursor: "pointer" }}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Card 4: Send Live Test Message */}
          <div className="card pad" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <h3 style={{ fontSize: 18, margin: 0 }}>4. Send Live Test Message</h3>
            <p style={{ color: "var(--muted)", margin: 0, fontSize: 13 }}>
              Send an instant test message to any phone number to verify provider API connectivity.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", borderTop: "1px solid var(--line)", paddingTop: 14 }}>
              <input
                type="text"
                placeholder="Target Phone Number (e.g. 9833699887)"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                className="input"
                style={{ flex: 1, minWidth: 240, padding: "8px 14px", fontSize: 14 }}
              />
              <button
                type="button"
                className="btn secondary"
                onClick={handleSendTestMessage}
                disabled={sendingTest}
                style={{ borderRadius: 8, padding: "8px 16px", fontSize: 13 }}
              >
                {sendingTest ? "Sending..." : "📤 Send Test Message"}
              </button>
            </div>
          </div>

          {/* Form Submit Bar */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" className="btn" disabled={saving} style={{ borderRadius: 8, padding: "12px 28px", fontSize: 15 }}>
              {saving ? "Saving Settings..." : "💾 Save WhatsApp Settings"}
            </button>
          </div>
        </form>
      ) : (
        /* Card 5: Recent Message Logs Table */
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card pad" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <input
              type="text"
              placeholder="Search logs by phone number or text..."
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              className="input"
              style={{ width: 320, padding: "8px 14px", fontSize: 13 }}
            />
            <span style={{ fontSize: 12, color: "var(--muted)" }}>Showing {filteredLogs.length} of {logs.length} dispatches</span>
          </div>

          <div className="table-container">
            {filteredLogs.length === 0 ? (
              <div style={{ textAlign: "center", padding: 48 }}>
                <h3>No WhatsApp Dispatches Found</h3>
                <p style={{ color: "var(--muted)", marginTop: 8 }}>Dispatched WhatsApp messages will be logged here automatically.</p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Recipient Phone</th>
                    <th>Template</th>
                    <th>Message Preview</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontWeight: 700, fontFamily: "monospace" }}>{log.recipientPhone}</td>
                      <td>
                        <span className="status-pill new">{log.templateName || "custom"}</span>
                      </td>
                      <td style={{ maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--muted)" }}>
                        {log.message}
                      </td>
                      <td>
                        <span className={`status-pill ${log.status === "SENT" || log.status === "DELIVERED" ? "completed" : "cancelled"}`}>
                          {log.status}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", color: "var(--muted)", fontSize: 12 }}>
                        {new Date(log.createdAt).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
