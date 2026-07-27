"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCart } from "@/components/CartProvider";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const cart = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [customer, setCustomer] = useState<any>(null);
  
  // Payment Method state: "ONLINE" (Razorpay) | "COD"
  const [paymentMethod, setPaymentMethod] = useState<"ONLINE" | "COD">("ONLINE");

  // COD Admin Settings state
  const [codSettings, setCodSettings] = useState({
    enabled: true,
    minAmount: 500,
    maxAmount: 5000,
    feeEnabled: false,
    feeAmount: 0
  });

  // Idempotency Key ref (persisted across retries, regenerated on form change)
  const idempotencyKeyRef = useState(() => `checkout-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`)[0];

  // Fetch customer session & live COD configuration settings
  useEffect(() => {
    fetch("/api/customer/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.customer) setCustomer(data.customer);
      })
      .catch(() => setCustomer(null));

    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setCodSettings({
            enabled: data.cod_enabled !== "false",
            minAmount: parseFloat(data.cod_min_amount) || 500,
            maxAmount: parseFloat(data.cod_max_amount) || 5000,
            feeEnabled: data.cod_fee_enabled === "true",
            feeAmount: data.cod_fee_enabled === "true" ? (parseFloat(data.cod_fee_amount) || 0) : 0
          });
        }
      })
      .catch(() => {});
  }, []);

  // Dynamically load Razorpay SDK Script
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Evaluate COD Availability
  const subtotal = cart.subtotal;
  const isCodTooLow = subtotal < codSettings.minAmount;
  const isCodTooHigh = subtotal > codSettings.maxAmount;
  const isCodDisabled = !codSettings.enabled || isCodTooLow || isCodTooHigh;

  const getCodDisabledReason = () => {
    if (!codSettings.enabled) return "Cash on Delivery is currently unavailable.";
    if (isCodTooLow) return `Cash on Delivery is available only for orders of ₹${codSettings.minAmount} or more.`;
    if (isCodTooHigh) return `Cash on Delivery is not available for orders above ₹${codSettings.maxAmount}. Please choose Online Payment.`;
    return "";
  };

  // Calculate final total including COD fee if applicable
  const codFee = (paymentMethod === "COD" && codSettings.feeEnabled) ? codSettings.feeAmount : 0;
  const grandTotal = cart.total + codFee;

  async function handlePayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return; // Prevent duplicate execution
    setLoading(true);
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const streetAddress = (formData.get("address") as string || "").trim();
    const city = (formData.get("city") as string || "").trim();
    const state = (formData.get("state") as string || "").trim();
    const pincode = (formData.get("pincode") as string || "").trim();

    const fullAddress = [streetAddress, city, state, pincode].filter(Boolean).join(", ");

    const customerDetails = {
      name: (formData.get("name") as string || "").trim(),
      phone: (formData.get("phone") as string || "").trim(),
      email: (formData.get("email") as string || "").trim(),
      address: fullAddress,
      notes: (formData.get("notes") as string || "").trim(),
    };

    if (cart.items.length === 0) {
      setErrorMessage("Your cart is empty.");
      setLoading(false);
      return;
    }

    // CASH ON DELIVERY (COD) FLOW
    if (paymentMethod === "COD") {
      if (isCodDisabled) {
        setErrorMessage(getCodDisabledReason());
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/checkout/cod", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer: customerDetails,
            items: cart.items,
            idempotencyKey: idempotencyKeyRef
          }),
        });

        const data = await res.json();

        if (!res.ok || data.error) {
          setErrorMessage(data.error || "Could not place COD order. Please try again.");
          setLoading(false);
          return;
        }

        cart.clear();
        router.push(`/payment-success?orderId=${data.orderId}&method=COD`);
        return;
      } catch (err: any) {
        console.error("COD checkout error:", err);
        setErrorMessage("Network error placing COD order. Please try again.");
        setLoading(false);
        return;
      }
    }

    // PAY ONLINE (RAZORPAY) FLOW
    try {
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        setErrorMessage("Failed to load Razorpay payment SDK. Please check your internet connection.");
        setLoading(false);
        return;
      }

      // Step 1: Create Razorpay Order on Backend
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: customerDetails,
          items: cart.items,
        }),
      });

      const orderData = await res.json();

      if (!res.ok || orderData.error) {
        setErrorMessage(orderData.error || "Could not initiate payment. Please try again.");
        setLoading(false);
        return;
      }

      const { orderId, razorpayOrderId, amount, currency, key } = orderData;

      // Step 2: Open Razorpay Checkout Modal
      const options = {
        key: key,
        amount: amount, // in paise
        currency: currency || "INR",
        name: "DermaDental 360",
        description: `Order #${orderId}`,
        image: "/icon.png",
        order_id: razorpayOrderId,
        prefill: {
          name: customerDetails.name,
          email: customerDetails.email || "",
          contact: customerDetails.phone,
        },
        theme: {
          color: "#2d5a27",
        },
        handler: async function (response: any) {
          setLoading(true);
          try {
            // Step 3: Verify Payment Signature on Backend
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: orderId,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              cart.clear();
              router.push(`/payment-success?orderId=${orderId}&paymentId=${response.razorpay_payment_id}&method=RAZORPAY`);
            } else {
              router.push(
                `/payment-failed?orderId=${orderId}&reason=${encodeURIComponent(
                  verifyData.error || "Signature verification failed"
                )}`
              );
            }
          } catch (err) {
            console.error("Payment verification network error:", err);
            router.push(
              `/payment-failed?orderId=${orderId}&reason=${encodeURIComponent(
                "Network error during payment verification"
              )}`
            );
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setErrorMessage("Payment process was cancelled.");
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on("payment.failed", function (response: any) {
        setLoading(false);
        const reason = response?.error?.description || "Payment authorization failed.";
        router.push(`/payment-failed?orderId=${orderId}&reason=${encodeURIComponent(reason)}`);
      });

      razorpayInstance.open();
    } catch (err: any) {
      console.error("Error during checkout:", err);
      setErrorMessage("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="section page-enter checkout-main">
      <div className="container split checkout-split">
        <form
          className="card pad form reveal checkout-form"
          onSubmit={handlePayment}
          noValidate={false}
          aria-label="Checkout Form"
        >
          <p className="eyebrow">Secure Razorpay Payment</p>
          <h1 className="checkout-title">Checkout Information</h1>

          {errorMessage && (
            <div
              className="checkout-error-banner"
              role="alert"
              aria-live="assertive"
            >
              ⚠️ {errorMessage}
            </div>
          )}

          <div className="field">
            <label htmlFor="checkout-name">Full Name *</label>
            <input
              id="checkout-name"
              className="input mobile-input"
              name="name"
              type="text"
              autoComplete="name"
              defaultValue={customer?.name || ""}
              required
              placeholder="Your full name"
              aria-required="true"
            />
          </div>

          <div className="field-group">
            <div className="field flex-1">
              <label htmlFor="checkout-phone">Phone Number *</label>
              <input
                id="checkout-phone"
                className="input mobile-input"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                defaultValue={customer?.phone || ""}
                required
                placeholder="10-digit mobile number"
                aria-required="true"
              />
            </div>

            <div className="field flex-1">
              <label htmlFor="checkout-email">Email Address</label>
              <input
                id="checkout-email"
                className="input mobile-input"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                defaultValue={customer?.email || ""}
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="checkout-address">Street Address *</label>
            <textarea
              id="checkout-address"
              className="input mobile-input textarea-input"
              name="address"
              rows={3}
              autoComplete="street-address"
              required
              placeholder="Flat, House no., Building, Street, Area"
              aria-required="true"
            />
          </div>

          <div className="field-grid-3">
            <div className="field">
              <label htmlFor="checkout-city">City *</label>
              <input
                id="checkout-city"
                className="input mobile-input"
                name="city"
                type="text"
                autoComplete="address-level2"
                required
                placeholder="City"
                aria-required="true"
              />
            </div>

            <div className="field">
              <label htmlFor="checkout-state">State *</label>
              <input
                id="checkout-state"
                className="input mobile-input"
                name="state"
                type="text"
                autoComplete="address-level1"
                required
                placeholder="State"
                aria-required="true"
              />
            </div>

            <div className="field">
              <label htmlFor="checkout-pincode">PIN Code *</label>
              <input
                id="checkout-pincode"
                className="input mobile-input"
                name="pincode"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="postal-code"
                required
                placeholder="6-digit PIN"
                aria-required="true"
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="checkout-notes">Special Instructions / Notes (Optional)</label>
            <textarea
              id="checkout-notes"
              className="input mobile-input textarea-notes"
              name="notes"
              rows={2}
              placeholder="E.g. Preferred delivery time or Landmark"
            />
          </div>

          {/* Payment Method Selector UI */}
          <div className="field" style={{ marginTop: 12 }}>
            <label style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, display: "block" }}>Select Payment Method *</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              {/* Online Payment Card */}
              <div
                onClick={() => setPaymentMethod("ONLINE")}
                style={{
                  padding: 16,
                  borderRadius: 10,
                  border: `2px solid ${paymentMethod === "ONLINE" ? "var(--sage-dark, #2d5a27)" : "var(--line, #cbd5e1)"}`,
                  background: paymentMethod === "ONLINE" ? "var(--sage-light, #eaf1ec)" : "#ffffff",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: 12
                }}
              >
                <input
                  type="radio"
                  name="paymentMethodRadio"
                  checked={paymentMethod === "ONLINE"}
                  onChange={() => setPaymentMethod("ONLINE")}
                  style={{ accentColor: "var(--sage-dark, #2d5a27)", width: 18, height: 18 }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>💳 Pay Online (Razorpay)</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>UPI, Credit/Debit Cards, NetBanking</div>
                </div>
              </div>

              {/* Cash on Delivery Card */}
              <div
                onClick={() => !isCodDisabled && setPaymentMethod("COD")}
                style={{
                  padding: 16,
                  borderRadius: 10,
                  border: `2px solid ${paymentMethod === "COD" ? "var(--sage-dark, #2d5a27)" : "var(--line, #cbd5e1)"}`,
                  background: isCodDisabled ? "#f8fafc" : (paymentMethod === "COD" ? "var(--sage-light, #eaf1ec)" : "#ffffff"),
                  cursor: isCodDisabled ? "not-allowed" : "pointer",
                  opacity: isCodDisabled ? 0.6 : 1,
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  position: "relative"
                }}
              >
                <input
                  type="radio"
                  name="paymentMethodRadio"
                  checked={paymentMethod === "COD"}
                  disabled={isCodDisabled}
                  onChange={() => !isCodDisabled && setPaymentMethod("COD")}
                  style={{ accentColor: "var(--sage-dark, #2d5a27)", width: 18, height: 18 }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>💵 Cash on Delivery (COD)</span>
                    {codSettings.feeEnabled && codSettings.feeAmount > 0 && (
                      <span style={{ fontSize: 11, background: "#e0f2fe", color: "#0369a1", padding: "2px 6px", borderRadius: 4 }}>+₹{codSettings.feeAmount} Fee</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Pay cash at your doorstep</div>
                </div>
              </div>
            </div>

            {/* COD Disabled Warning Message */}
            {isCodDisabled && (
              <div style={{ marginTop: 8, padding: "8px 12px", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 6, fontSize: 12, color: "#c2410c" }}>
                ℹ️ {getCodDisabledReason()}
              </div>
            )}
          </div>

          <div className="desktop-pay-btn-wrapper">
            <button
              type="submit"
              className="btn submit-btn"
              disabled={loading || cart.items.length === 0 || (paymentMethod === "COD" && isCodDisabled)}
              aria-label={paymentMethod === "COD" ? `Place COD Order (₹${grandTotal})` : `Pay ₹${grandTotal} via Razorpay`}
            >
              {loading ? (
                <>
                  <span className="spinner-icon" />
                  {paymentMethod === "COD" ? "Placing Order..." : "Processing Payment..."}
                </>
              ) : (
                paymentMethod === "COD" ? `Place Cash on Delivery Order (₹${grandTotal})` : `Pay ₹${grandTotal} via Razorpay`
              )}
            </button>
          </div>

          {/* Sticky Mobile Pay Button */}
          <div className="mobile-sticky-bar">
            <div className="mobile-sticky-inner">
              <div className="mobile-sticky-info">
                <span className="mobile-sticky-label">Total Payable</span>
                <span className="mobile-sticky-amount">₹{grandTotal}</span>
              </div>
              <button
                type="submit"
                className="btn submit-btn mobile-pay-btn"
                disabled={loading || cart.items.length === 0 || (paymentMethod === "COD" && isCodDisabled)}
                aria-label={paymentMethod === "COD" ? `Place COD Order (₹${grandTotal})` : `Pay ₹${grandTotal}`}
              >
                {loading ? (
                  <>
                    <span className="spinner-icon" />
                    Processing...
                  </>
                ) : (
                  paymentMethod === "COD" ? `Place Order (₹${grandTotal})` : `Pay ₹${grandTotal}`
                )}
              </button>
            </div>
          </div>
        </form>

        <aside className="card pad reveal reveal-delay-1 shop-sidebar order-summary-aside">
          <h2 className="summary-heading">Order Summary ({cart.count})</h2>
          <div className="summary-items-container">
            {cart.items.length === 0 ? (
              <p className="empty-cart-text">Your cart is empty.</p>
            ) : (
              cart.items.map((item) => (
                <div key={item.productId} className="summary-item-card">
                  {item.image && (
                    <div className="summary-item-img-box">
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={48}
                        height={48}
                        className="summary-item-img"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="summary-item-details">
                    <span className="summary-item-name">{item.name}</span>
                    <span className="summary-item-qty">Qty: {item.quantity}</span>
                  </div>
                  <span className="summary-item-price">₹{item.price * item.quantity}</span>
                </div>
              ))
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, borderTop: "1px solid var(--line, #e2e8f0)", paddingTop: 12, fontSize: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted, #64748b)" }}>
              <span>Products Total</span>
              <span style={{ fontWeight: 600, color: "var(--ink, #0f172a)" }}>₹{cart.subtotal}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted, #64748b)" }}>
              <span>Shipping</span>
              {cart.isFreeShipping ? (
                <span style={{ color: "#16a34a", fontWeight: 700 }}>FREE</span>
              ) : (
                <span style={{ fontWeight: 600, color: "var(--ink, #0f172a)" }}>₹{cart.shippingCharge}</span>
              )}
            </div>
            {paymentMethod === "COD" && codFee > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted, #64748b)" }}>
                <span>COD Handling Fee</span>
                <span style={{ fontWeight: 600, color: "var(--ink, #0f172a)" }}>+₹{codFee}</span>
              </div>
            )}
          </div>

          <div className="summary-total-row">
            <span>Grand Total</span>
            <span className="summary-total-price">₹{grandTotal}</span>
          </div>
        </aside>
      </div>

      <style jsx>{`
        .checkout-main {
          overflow-x: hidden;
        }
        .checkout-title {
          font-size: clamp(1.5rem, 4vw, 2.2rem);
          margin-bottom: 18px;
        }
        .checkout-error-banner {
          background-color: #fee2e2;
          color: #991b1b;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 16px;
          border: 1px solid #f87171;
        }
        .mobile-input {
          min-height: 48px;
          font-size: 16px !important; /* Prevents auto-zoom on iOS */
          padding: 12px 14px;
          width: 100%;
          border-radius: 8px;
          border: 1px solid var(--line, #e2e8f0);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .mobile-input:focus {
          outline: none;
          border-color: var(--sage-dark, #2d5a27);
          box-shadow: 0 0 0 3px rgba(45, 90, 39, 0.15);
        }
        .textarea-input {
          min-height: 90px;
          resize: vertical;
        }
        .textarea-notes {
          min-height: 60px;
          resize: vertical;
        }
        .field-group {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
        }
        .flex-1 {
          flex: 1;
          min-width: 220px;
        }
        .field-grid-3 {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 12px;
        }
        .submit-btn {
          width: 100%;
          min-height: 50px;
          font-size: 16px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border-radius: 8px;
          cursor: pointer;
        }
        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .spinner-icon {
          display: inline-block;
          width: 18px;
          height: 18px;
          border: 2px solid #ffffff;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        .summary-heading {
          font-size: 1.25rem;
          border-bottom: 1px solid var(--line, #e2e8f0);
          padding-bottom: 12px;
          margin-bottom: 16px;
        }
        .summary-items-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 320px;
          overflow-y: auto;
          margin-bottom: 16px;
          padding-right: 4px;
        }
        .empty-cart-text {
          color: var(--muted, #64748b);
          font-size: 14px;
        }
        .summary-item-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          font-size: 14px;
          padding: 8px 0;
          border-bottom: 1px dashed var(--line, #f1f5f9);
        }
        .summary-item-img-box {
          width: 44px;
          height: 44px;
          border-radius: 6px;
          overflow: hidden;
          flex-shrink: 0;
          background-color: #f8fafc;
        }
        .summary-item-img {
          object-fit: cover;
          width: 100%;
          height: 100%;
        }
        .summary-item-details {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 0;
        }
        .summary-item-name {
          color: var(--ink, #0f172a);
          font-weight: 500;
          word-break: break-word;
          overflow-wrap: anywhere;
        }
        .summary-item-qty {
          font-size: 12px;
          color: var(--muted, #64748b);
        }
        .summary-item-price {
          font-weight: 600;
          color: var(--ink, #0f172a);
          white-space: nowrap;
        }
        .summary-total-row {
          display: flex;
          justify-content: space-between;
          font-weight: 800;
          font-size: 1.2rem;
          color: var(--ink, #0f172a);
          border-top: 1px solid var(--line, #e2e8f0);
          padding-top: 12px;
        }
        .mobile-sticky-bar {
          display: none;
        }

        /* Responsive Breakpoints */
        @media (max-width: 768px) {
          .desktop-pay-btn-wrapper {
            display: none;
          }
          .mobile-sticky-bar {
            display: block;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #ffffff;
            box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.1);
            padding: 12px 16px max(12px, env(safe-area-inset-bottom));
            z-index: 99;
            border-top: 1px solid var(--line, #e2e8f0);
          }
          .mobile-sticky-inner {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            max-width: 600px;
            margin: 0 auto;
          }
          .mobile-sticky-info {
            display: flex;
            flex-direction: column;
          }
          .mobile-sticky-label {
            font-size: 12px;
            color: var(--muted, #64748b);
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .mobile-sticky-amount {
            font-size: 1.25rem;
            font-weight: 800;
            color: var(--sage-dark, #2d5a27);
          }
          .mobile-pay-btn {
            flex: 1;
            max-width: 240px;
            min-height: 48px;
          }
          .checkout-main {
            padding-bottom: 90px;
          }
        }

        @media (max-width: 480px) {
          .field-group {
            flex-direction: column;
            gap: 0;
          }
          .flex-1 {
            min-width: 100%;
          }
          .field-grid-3 {
            grid-template-columns: 1fr;
            gap: 0;
          }
        }
      `}</style>
    </main>
  );
}
