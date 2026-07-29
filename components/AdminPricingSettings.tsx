"use client";

import React, { useState, useEffect } from "react";

export function AdminPricingSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(999);
  const [shippingFlatRate, setShippingFlatRate] = useState<number>(99);
  const [prepaidDiscountPercentage, setPrepaidDiscountPercentage] = useState<number>(5);
  const [codFee, setCodFee] = useState<number>(0);

  const [enablePrepaidDiscount, setEnablePrepaidDiscount] = useState<boolean>(true);
  const [enableFreeShipping, setEnableFreeShipping] = useState<boolean>(true);
  const [enableCodFee, setEnableCodFee] = useState<boolean>(false);

  useEffect(() => {
    fetchPricingSettings();
  }, []);

  const fetchPricingSettings = async () => {
    try {
      const res = await fetch("/api/admin/pricing");
      if (res.ok) {
        const data = await res.json();
        setFreeShippingThreshold(data.freeShippingThreshold ?? 999);
        setShippingFlatRate(data.shippingFlatRate ?? 99);
        setPrepaidDiscountPercentage(data.prepaidDiscountPercentage ?? 5);
        setCodFee(data.codFee ?? 0);
        setEnablePrepaidDiscount(data.enablePrepaidDiscount !== false);
        setEnableFreeShipping(data.enableFreeShipping !== false);
        setEnableCodFee(data.enableCodFee === true);
      }
    } catch (err) {
      console.error("Failed to load pricing settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    try {
      const res = await fetch("/api/admin/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          freeShippingThreshold,
          shippingFlatRate,
          prepaidDiscountPercentage,
          codFee,
          enablePrepaidDiscount,
          enableFreeShipping,
          enableCodFee
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMsg({ text: "✅ Pricing and shipping rules saved successfully!", type: "success" });
      } else {
        setMsg({ text: `❌ ${data.error || "Failed to save settings."}`, type: "error" });
      }
    } catch (err: any) {
      setMsg({ text: `❌ Error: ${err.message || "Failed to save."}`, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="card pad skeleton" style={{ height: 320 }} />;
  }

  return (
    <div style={{ maxWidth: 840, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "#0f172a" }}>
          💳 Online Shipping & Prepaid Discounts Manager
        </h2>
        <p style={{ color: "#64748b", marginTop: 4, fontSize: 14 }}>
          Control live online discount percentages, free shipping thresholds, flat delivery rates, and COD cash fees.
        </p>
      </div>

      {msg && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 8,
            marginBottom: 20,
            backgroundColor: msg.type === "success" ? "#dcfce7" : "#fee2e2",
            color: msg.type === "success" ? "#15803d" : "#991b1b",
            fontSize: 14,
            fontWeight: 600
          }}
        >
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: "grid", gap: 24 }}>
        {/* Section 1: Online Prepaid Discount */}
        <div className="card pad" style={{ backgroundColor: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, color: "#0f172a" }}>🎁 Online Prepaid Discount Rule</h3>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>
                Automatic discount percentage applied when customers choose Razorpay Online Payment.
              </p>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={enablePrepaidDiscount}
                onChange={(e) => setEnablePrepaidDiscount(e.target.checked)}
                style={{ width: 18, height: 18 }}
              />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Enable Discount</span>
            </label>
          </div>

          {enablePrepaidDiscount && (
            <div style={{ display: "grid", gap: 12, maxWidth: 320 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
                Prepaid Discount Percentage (%)
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="input"
                  value={prepaidDiscountPercentage}
                  onChange={(e) => setPrepaidDiscountPercentage(Number(e.target.value))}
                  style={{ width: 120, fontSize: 15, padding: "8px 12px" }}
                />
                <span style={{ fontSize: 14, fontWeight: 700, color: "#16a34a" }}>% OFF on Online Payments</span>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Shipping Charges & Free Threshold */}
        <div className="card pad" style={{ backgroundColor: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, color: "#0f172a" }}>🚚 Shipping Charges & Free Delivery Threshold</h3>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>
                Set standard delivery charges and minimum order subtotal for Free Express Shipping.
              </p>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={enableFreeShipping}
                onChange={(e) => setEnableFreeShipping(e.target.checked)}
                style={{ width: 18, height: 18 }}
              />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Enable Free Shipping Rule</span>
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>
                Flat Shipping Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                className="input"
                value={shippingFlatRate}
                onChange={(e) => setShippingFlatRate(Number(e.target.value))}
                style={{ width: "100%", fontSize: 15, padding: "8px 12px" }}
              />
              <span style={{ fontSize: 12, color: "#64748b", marginTop: 4, display: "block" }}>
                Charged when order subtotal is below free threshold.
              </span>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>
                Free Shipping Minimum Subtotal (₹)
              </label>
              <input
                type="number"
                min="0"
                className="input"
                disabled={!enableFreeShipping}
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
                style={{ width: "100%", fontSize: 15, padding: "8px 12px" }}
              />
              <span style={{ fontSize: 12, color: "#64748b", marginTop: 4, display: "block" }}>
                Orders above ₹{freeShippingThreshold} get 100% Free Shipping.
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Cash on Delivery Handling Fee */}
        <div className="card pad" style={{ backgroundColor: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, color: "#0f172a" }}>💵 Cash on Delivery (COD) Handling Fee</h3>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>
                Optional cash collection handling charge for COD orders.
              </p>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={enableCodFee}
                onChange={(e) => setEnableCodFee(e.target.checked)}
                style={{ width: 18, height: 18 }}
              />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Enable COD Fee</span>
            </label>
          </div>

          {enableCodFee && (
            <div style={{ maxWidth: 320 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>
                COD Fee Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                className="input"
                value={codFee}
                onChange={(e) => setCodFee(Number(e.target.value))}
                style={{ width: 140, fontSize: 15, padding: "8px 12px" }}
              />
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button type="submit" className="btn primary" disabled={saving} style={{ padding: "12px 24px", fontSize: 15 }}>
            {saving ? "Saving Changes..." : "💾 Save All Pricing Rules"}
          </button>
        </div>
      </form>
    </div>
  );
}
