"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCart } from "@/components/CartProvider";
import { calculatePricingDetails } from "@/lib/pricing";
import { trackInitiateCheckout, trackAddPaymentInfo } from "@/lib/metaPixel";

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

  // Dynamic Admin Pricing Options state
  const [pricingOptions, setPricingOptions] = useState({
    freeShippingThreshold: 999,
    shippingFlatRate: 99,
    prepaidDiscountPercentage: 5,
    enablePrepaidDiscount: true,
    enableFreeShipping: true,
    enableCodFee: false,
  });

  // COD Admin Settings state
  const [codSettings, setCodSettings] = useState({
    enabled: true,
    minAmount: 500,
    maxAmount: 5000,
    feeEnabled: false,
    feeAmount: 0
  });

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    coupon?: any;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Idempotency Key ref (persisted across retries, regenerated on form change)
  const idempotencyKeyRef = useState(() => `checkout-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`)[0];

  // Track Meta Pixel InitiateCheckout Event on mount
  useEffect(() => {
    if (cart.items && cart.items.length > 0) {
      trackInitiateCheckout({
        content_ids: cart.items.map((i) => i.productId),
        value: cart.total || cart.subtotal,
        currency: "INR",
        num_items: cart.count,
      });
    }
  }, [cart.items.length]);

  // Fetch customer session & live COD configuration settings
  useEffect(() => {
    fetch("/api/customer/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.customer) {
          setCustomer(data.customer);
          cart.syncAbandonedCart({
            customerName: data.customer.name,
            email: data.customer.email,
            phone: data.customer.phone,
          });
        }
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

          setPricingOptions({
            freeShippingThreshold: parseFloat(data.free_shipping_threshold) || 999,
            shippingFlatRate: parseFloat(data.shipping_flat_rate) || 99,
            prepaidDiscountPercentage: parseFloat(data.prepaid_discount_percentage) || 5,
            enablePrepaidDiscount: data.enable_prepaid_discount !== "false",
            enableFreeShipping: data.enable_free_shipping !== "false",
            enableCodFee: data.enable_cod_fee === "true"
          });
        }
      })
      .catch(() => {});
  }, []);

  // Coupon validation handler
  async function handleApplyCoupon(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!couponInput.trim()) return;

    setValidatingCoupon(true);
    setCouponError(null);
    setCouponSuccess(null);

    const formEl = document.getElementById("checkout-form") as HTMLFormElement | null;
    const formData = formEl ? new FormData(formEl) : null;
    const typedEmail = (formData?.get("email") as string || customer?.email || "").trim();
    const typedPhone = (formData?.get("phone") as string || customer?.phone || "").trim();

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponInput.trim(),
          subtotal: cart.subtotal,
          cartItems: cart.items.map((i: any) => ({
            productId: i.productId,
            category: i.category,
            price: i.price,
            quantity: i.quantity,
          })),
          customerEmail: typedEmail,
          customerPhone: typedPhone,
        }),
      });

      const data = await res.json();

      if (data.valid) {
        setAppliedCoupon({
          code: data.coupon?.code || couponInput.trim().toUpperCase(),
          discountAmount: data.discountAmount || 0,
          coupon: data.coupon,
        });
        setCouponSuccess(`Coupon "${data.coupon?.code || couponInput.trim().toUpperCase()}" applied! Saved ₹${data.discountAmount}`);
        setCouponInput("");
      } else {
        setCouponError(data.message || "Invalid coupon code");
        setAppliedCoupon(null);
      }
    } catch (err: any) {
      setCouponError("Failed to validate coupon code.");
    } finally {
      setValidatingCoupon(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponSuccess(null);
    setCouponError(null);
  }

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

  // Centralized pricing calculation based on current payment method selection & dynamic admin settings
  const isPrepaid = paymentMethod === "ONLINE";
  const codFeeAmount = (paymentMethod === "COD" && codSettings.feeEnabled) ? codSettings.feeAmount : 0;
  const pricing = calculatePricingDetails(cart.subtotal, isPrepaid, codFeeAmount, 0, pricingOptions);
  const couponDiscountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const grandTotal = Math.max(0, Math.round((pricing.finalAmount - couponDiscountAmount) * 100) / 100);

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

    // Track AddPaymentInfo event
    trackAddPaymentInfo({
      content_ids: cart.items.map((i) => i.productId),
      value: grandTotal,
      currency: "INR",
    });

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
            idempotencyKey: idempotencyKeyRef,
            couponCode: appliedCoupon?.code,
            sessionId: cart.sessionId,
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
          couponCode: appliedCoupon?.code,
          sessionId: cart.sessionId,
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

  // Sync abandoned cart immediately on entering checkout
  useEffect(() => {
    if (cart.items.length > 0) {
      const formEl = document.getElementById("checkout-form") as HTMLFormElement | null;
      const formData = formEl ? new FormData(formEl) : null;
      const name = (formData?.get("name") as string || customer?.name || "").trim();
      const email = (formData?.get("email") as string || customer?.email || "").trim();
      const phone = (formData?.get("phone") as string || customer?.phone || "").trim();
      cart.syncAbandonedCart({ customerName: name, email, phone });
    }
  }, [cart.items.length, customer]);

  function handleFieldBlur() {
    const formEl = document.getElementById("checkout-form") as HTMLFormElement | null;
    if (!formEl) return;
    const formData = new FormData(formEl);
    const name = (formData.get("name") as string || "").trim();
    const email = (formData.get("email") as string || "").trim();
    const phone = (formData.get("phone") as string || "").trim();
    if (name || email || phone) {
      cart.syncAbandonedCart({ customerName: name, email, phone });
    }
  }

  return (
    <main className="section page-enter checkout-main">
      <div className="container split checkout-split">
        <form
          id="checkout-form"
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
              onBlur={handleFieldBlur}
              onChange={handleFieldBlur}
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
                onBlur={handleFieldBlur}
                onChange={handleFieldBlur}
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
                onBlur={handleFieldBlur}
                onChange={handleFieldBlur}
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
          <div className="field" style={{ marginTop: 16 }}>
            <label style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, display: "block" }}>Select Payment Method *</label>
            <div className="payment-methods-grid">
              {/* Online Payment Card */}
              <div
                onClick={() => setPaymentMethod("ONLINE")}
                className={`payment-card ${paymentMethod === "ONLINE" ? "active" : ""}`}
              >
                <input
                  type="radio"
                  name="paymentMethodRadio"
                  checked={paymentMethod === "ONLINE"}
                  onChange={() => setPaymentMethod("ONLINE")}
                  style={{ accentColor: "var(--sage-dark, #2d5a27)", width: 20, height: 20, cursor: "pointer" }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                    <span>💳 Pay Online (Razorpay)</span>
                    <span className="badge-prepaid-discount">5% OFF</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>UPI, Credit/Debit Cards, NetBanking</div>
                </div>
              </div>

              {/* Cash on Delivery Card */}
              <div
                onClick={() => !isCodDisabled && setPaymentMethod("COD")}
                className={`payment-card ${paymentMethod === "COD" ? "active" : ""} ${isCodDisabled ? "disabled" : ""}`}
              >
                <input
                  type="radio"
                  name="paymentMethodRadio"
                  checked={paymentMethod === "COD"}
                  disabled={isCodDisabled}
                  onChange={() => !isCodDisabled && setPaymentMethod("COD")}
                  style={{ accentColor: "var(--sage-dark, #2d5a27)", width: 20, height: 20, cursor: isCodDisabled ? "not-allowed" : "pointer" }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                    <span>💵 Cash on Delivery (COD)</span>
                    {codSettings.feeEnabled && codSettings.feeAmount > 0 && (
                      <span style={{ fontSize: 11, background: "#e0f2fe", color: "#0369a1", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>+₹{codSettings.feeAmount} Fee</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Pay cash at your doorstep</div>
                </div>
              </div>
            </div>

            {/* Prepaid Highlighted Discount Banner */}
            {isPrepaid && (
              <div className="prepaid-congrats-banner" role="status" aria-live="polite">
                🎉 Congratulations! You saved 5% by choosing a prepaid payment.
              </div>
            )}

            {/* COD Disabled Warning Message */}
            {isCodDisabled && (
              <div style={{ marginTop: 10, padding: "10px 14px", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, fontSize: 13, color: "#c2410c", lineHeight: 1.4 }}>
                ℹ️ {getCodDisabledReason()}
              </div>
            )}
          </div>

          <div className="desktop-pay-btn-wrapper" style={{ marginTop: 20 }}>
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
        </form>

        <aside className="card pad shop-sidebar order-summary-aside">
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
          {/* Coupon Code Input Section */}
          <div style={{ borderTop: "1px solid var(--line, #e2e8f0)", paddingTop: 14, marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink, #0f172a)", display: "block", marginBottom: 8 }}>
              Have a Coupon?
            </span>
            {!appliedCoupon ? (
              <form onSubmit={handleApplyCoupon} style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  className="mobile-input"
                  style={{ minHeight: 40, fontSize: 13, textTransform: "uppercase", fontFamily: "monospace", fontWeight: 700, flex: 1 }}
                />
                <button
                  type="submit"
                  disabled={validatingCoupon || !couponInput.trim()}
                  className="btn"
                  style={{ borderRadius: 8, padding: "8px 16px", fontSize: 13, whiteSpace: "nowrap" }}
                >
                  {validatingCoupon ? "Applying..." : "Apply"}
                </button>
              </form>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f0fdf4", border: "1px border #86efac", padding: "8px 12px", borderRadius: 8 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#16a34a", fontFamily: "monospace" }}>
                    🎟️ {appliedCoupon.code}
                  </span>
                  <span style={{ fontSize: 11, color: "#15803d", display: "block" }}>
                    Save ₹{appliedCoupon.discountAmount}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  style={{ background: "none", border: "none", color: "#dc2626", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  Remove
                </button>
              </div>
            )}

            {couponError && (
              <p style={{ color: "#dc2626", fontSize: 12, marginTop: 6, margin: "6px 0 0 0", fontWeight: 600 }}>
                ⚠️ {couponError}
              </p>
            )}
            {couponSuccess && (
              <p style={{ color: "#16a34a", fontSize: 12, marginTop: 6, margin: "6px 0 0 0", fontWeight: 600 }}>
                ✅ {couponSuccess}
              </p>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, borderTop: "1px solid var(--line, #e2e8f0)", paddingTop: 12, fontSize: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted, #64748b)" }}>
              <span>Subtotal</span>
              <span style={{ fontWeight: 600, color: "var(--ink, #0f172a)" }}>₹{pricing.subtotal}</span>
            </div>

            {/* Prepaid Discount Row */}
            {isPrepaid && pricingOptions.enablePrepaidDiscount && pricing.discountAmount > 0 && (
              <div className="animated-discount-row">
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span>Prepaid Discount ({pricing.discountPercentage}%)</span>
                  <span className="badge-prepaid-pill">{pricing.discountPercentage}% OFF</span>
                </div>
                <span style={{ fontWeight: 700, color: "#16a34a" }}>-₹{pricing.discountAmount}</span>
              </div>
            )}

            {/* Coupon Discount Row */}
            {appliedCoupon && appliedCoupon.discountAmount > 0 && (
              <div className="animated-discount-row" style={{ backgroundColor: "#f0fdf4", borderColor: "#86efac" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span>Coupon ({appliedCoupon.code})</span>
                  <span className="badge-prepaid-pill" style={{ background: "#16a34a" }}>APPLIED</span>
                </div>
                <span style={{ fontWeight: 700, color: "#16a34a" }}>-₹{appliedCoupon.discountAmount}</span>
              </div>
            )}

            {/* Shipping Row */}
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted, #64748b)" }}>
              <span>Shipping</span>
              {!pricingOptions.enableFreeShipping ? (
                <span style={{ fontWeight: 600, color: "var(--ink, #0f172a)" }}>₹0</span>
              ) : pricing.isFreeShipping ? (
                <span style={{ color: "#16a34a", fontWeight: 700 }}>FREE</span>
              ) : (
                <span style={{ fontWeight: 600, color: "var(--ink, #0f172a)" }}>₹{pricing.shippingCharge}</span>
              )}
            </div>

            {/* COD Handling Fee Row */}
            {paymentMethod === "COD" && pricingOptions.enableCodFee && pricing.codFee > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted, #64748b)" }}>
                <span>COD Handling Fee</span>
                <span style={{ fontWeight: 600, color: "var(--ink, #0f172a)" }}>+₹{pricing.codFee}</span>
              </div>
            )}
          </div>

          <div className="summary-total-row">
            <span>Grand Total</span>
            <span className="summary-total-price">₹{grandTotal}</span>
          </div>
        </aside>
      </div>

      {/* Sticky Mobile Pay Footer (Extracted outside transform container for true viewport attachment) */}
      <div className="mobile-sticky-bar">
        <div className="mobile-sticky-inner">
          <div className="mobile-sticky-info">
            <span className="mobile-sticky-label">Total Payable</span>
            <span className="mobile-sticky-amount">₹{grandTotal}</span>
          </div>
          <button
            type="submit"
            form="checkout-form"
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

      <style jsx>{`
        .checkout-main {
          min-height: 100dvh;
        }
        .checkout-form, .order-summary-aside {
          opacity: 1 !important;
          transform: none !important;
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
          font-size: 16px !important; /* Prevents auto-zoom on iOS Safari */
          padding: 12px 14px;
          width: 100%;
          border-radius: 8px;
          border: 1px solid var(--line, #cbd5e1);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          background: #ffffff;
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
        .payment-methods-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
        }
        .payment-card {
          padding: 16px;
          border-radius: 10px;
          border: 2px solid var(--line, #cbd5e1);
          background: #ffffff;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 12px;
          min-height: 54px;
        }
        .payment-card.active {
          border-color: var(--sage-dark, #2d5a27);
          background: var(--sage-light, #eaf1ec);
        }
        .payment-card.disabled {
          background: #f8fafc;
          cursor: not-allowed;
          opacity: 0.6;
        }
        .submit-btn {
          width: 100%;
          min-height: 52px;
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
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
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

        /* Responsive Breakpoints & Mobile Enhancements */
        @media (max-width: 768px) {
          .checkout-main {
            padding-bottom: calc(140px + env(safe-area-inset-bottom, 16px)) !important;
          }
          .checkout-form {
            padding-bottom: 24px !important;
            margin-bottom: 24px !important;
          }
          .payment-methods-grid {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }
          .payment-card {
            width: 100% !important;
            min-height: 60px !important;
            padding: 16px 18px !important;
            box-sizing: border-box !important;
          }
          .summary-items-container {
            max-height: none !important;
            overflow-y: visible !important;
          }
          .desktop-pay-btn-wrapper {
            display: none;
          }
          .mobile-sticky-bar {
            display: block;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            width: 100%;
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.12);
            padding: 12px 16px max(14px, env(safe-area-inset-bottom, 14px));
            z-index: 99;
            border-top: 1px solid var(--line, #cbd5e1);
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
            font-size: 11px;
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
        }

        .badge-prepaid-discount {
          background-color: #16a34a;
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 999px;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }

        .prepaid-congrats-banner {
          margin-top: 12px;
          padding: 12px 16px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #15803d;
          line-height: 1.4;
          animation: fadeInBanner 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animated-discount-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: #f0fdf4;
          padding: 6px 10px;
          border-radius: 6px;
          border: 1px dashed #86efac;
          animation: pulseInDiscount 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          color: #15803d;
          font-size: 14px;
        }

        .badge-prepaid-pill {
          background-color: #16a34a;
          color: #ffffff;
          font-size: 10px;
          font-weight: 800;
          padding: 1px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        }

        @keyframes fadeInBanner {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulseInDiscount {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
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

