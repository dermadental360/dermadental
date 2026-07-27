"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

  // Fetch customer session on mount to prefill form fields
  useEffect(() => {
    fetch("/api/customer/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.customer) setCustomer(data.customer);
      })
      .catch(() => setCustomer(null));
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

  async function handlePayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const customerDetails = {
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      address: formData.get("address") as string,
      notes: formData.get("notes") as string,
    };

    if (cart.items.length === 0) {
      setErrorMessage("Your cart is empty.");
      setLoading(false);
      return;
    }

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
              router.push(`/payment-success?orderId=${orderId}&paymentId=${response.razorpay_payment_id}`);
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
    <main className="section page-enter">
      <div className="container split checkout-split">
        <form className="card pad form reveal" onSubmit={handlePayment}>
          <p className="eyebrow">Secure Razorpay Payment</p>
          <h1 style={{ marginBottom: 18 }}>Checkout Information</h1>

          {errorMessage && (
            <div
              style={{
                backgroundColor: "#fee2e2",
                color: "#991b1b",
                padding: "12px 16px",
                borderRadius: "8px",
                fontSize: 14,
                marginBottom: 16,
                border: "1px solid #f87171",
              }}
            >
              ⚠️ {errorMessage}
            </div>
          )}

          <div className="field">
            <label>Full Name *</label>
            <input
              className="input"
              name="name"
              defaultValue={customer?.name || ""}
              required
              placeholder="Your full name"
            />
          </div>

          <div className="field">
            <label>Phone Number *</label>
            <input
              className="input"
              name="phone"
              type="tel"
              defaultValue={customer?.phone || ""}
              required
              placeholder="10-digit mobile number"
            />
          </div>

          <div className="field">
            <label>Email Address</label>
            <input
              className="input"
              name="email"
              type="email"
              defaultValue={customer?.email || ""}
              placeholder="name@example.com"
            />
          </div>

          <div className="field">
            <label>Shipping Address *</label>
            <textarea
              className="input"
              name="address"
              rows={4}
              required
              placeholder="Flat, Street, Area, Landmark, Pincode"
            />
          </div>

          <div className="field">
            <label>Special Instructions / Notes (Optional)</label>
            <textarea
              className="input"
              name="notes"
              rows={2}
              placeholder="E.g. Delivery timings or specific guidance"
            />
          </div>

          <button
            type="submit"
            className="btn"
            style={{
              width: "100%",
              marginTop: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
            disabled={loading || cart.items.length === 0}
          >
            {loading ? (
              <>
                <span
                  style={{
                    display: "inline-block",
                    width: 16,
                    height: 16,
                    border: "2px solid #ffffff",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
                Processing Payment...
              </>
            ) : (
              `Pay ₹${cart.total} via Razorpay`
            )}
          </button>
        </form>

        <aside className="card pad reveal reveal-delay-1 shop-sidebar">
          <h3 style={{ fontSize: 20, borderBottom: "1px solid var(--line)", paddingBottom: 12, marginBottom: 16 }}>
            Order Summary
          </h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              maxHeight: 300,
              overflowY: "auto",
              marginBottom: 16,
            }}
          >
            {cart.items.map((item) => (
              <div key={item.productId} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <span style={{ color: "var(--ink)", fontWeight: 500 }}>
                  {item.quantity} x {item.name}
                </span>
                <span style={{ color: "var(--muted)" }}>₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontWeight: 800,
              fontSize: 20,
              color: "var(--ink)",
              borderTop: "1px solid var(--line)",
              paddingTop: 12,
            }}
          >
            <span>Total</span>
            <span>₹{cart.total}</span>
          </div>
        </aside>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </main>
  );
}
