"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";

export default function CheckoutPage() {
  const cart = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState<any>(null);

  // Fetch session on mount to prefill customer details
  useEffect(() => {
    fetch("/api/customer/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.customer) setCustomer(data.customer);
      })
      .catch(() => setCustomer(null));
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: {
          name: data.get("name"),
          phone: data.get("phone"),
          email: data.get("email"),
          address: data.get("address"),
          notes: data.get("notes")
        },
        items: cart.items,
        total: cart.total
      })
    });
    const order = await response.json();
    cart.clear();
    router.push(`/order-confirmation?order=${order._id}&whatsapp=${encodeURIComponent(order.whatsappUrl)}`);
  }

  return (
    <main className="section page-enter">
      <div className="container split checkout-split">
        <form className="card pad form reveal" onSubmit={submit}>
          <p className="eyebrow">Secure Order</p>
          <h1 style={{ marginBottom: 18 }}>Checkout Information</h1>
          
          <div className="field">
            <label>Name</label>
            <input className="input" name="name" defaultValue={customer?.name || ""} required placeholder="Your full name" />
          </div>
          
          <div className="field">
            <label>Phone Number</label>
            <input className="input" name="phone" type="tel" defaultValue={customer?.phone || ""} required placeholder="9833699887" />
          </div>

          <div className="field">
            <label>Email Address</label>
            <input className="input" name="email" type="email" defaultValue={customer?.email || ""} required placeholder="name@example.com" />
          </div>

          <div className="field">
            <label>Shipping Address</label>
            <textarea className="input" name="address" rows={4} required placeholder="Flat, Street, Area, Landmark, Pincode" />
          </div>

          <div className="field">
            <label>Special Instructions / Notes (Optional)</label>
            <textarea className="input" name="notes" rows={2} placeholder="E.g. Delivery timings or specific concern guidance" />
          </div>

          <button className="btn" style={{ width: "100%", marginTop: 14 }} disabled={loading || cart.items.length === 0}>
            {loading ? "Processing Order..." : "Place Order on WhatsApp"}
          </button>
        </form>
        <aside className="card pad reveal reveal-delay-1 shop-sidebar">
          <h3 style={{ fontSize: 20, borderBottom: "1px solid var(--line)", paddingBottom: 12, marginBottom: 16 }}>
            Order Summary
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: 300, overflowY: "auto", marginBottom: 16 }}>
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
    </main>
  );
}
