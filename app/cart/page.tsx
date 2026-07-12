"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";

export default function CartPage() {
  const cart = useCart();

  if (cart.items.length === 0) {
    return (
      <main className="section page-enter">
        <div className="container reveal" style={{ maxWidth: 640, textAlign: "center", padding: "64px 20px" }}>
          <p className="eyebrow">Your Cart</p>
          <h1 style={{ marginBottom: 18 }}>Your cart is empty</h1>
          <p style={{ color: "var(--muted)", marginBottom: 28 }}>
            It looks like you haven't added any products to your skincare routine yet. Explore our curated dermaceutical collection.
          </p>
          <Link className="btn" href="/shop">Start Shopping</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="section page-enter">
      <div className="container reveal">
        <p className="eyebrow">Shopping Cart</p>
        <h1 style={{ marginBottom: 32 }}>Review your routine selection</h1>
        <div className="split cart-split">
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {cart.items.map((item) => (
              <div
                className="card pad"
                key={item.productId}
                style={{
                  display: "grid",
                  gridTemplateColumns: "100px 1fr auto",
                  gap: 20,
                  alignItems: "center",
                }}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  style={{
                    width: 100,
                    height: 100,
                    objectFit: "cover",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--line)",
                  }}
                />
                  <div>
                    <h3 style={{ fontSize: 18, margin: 0 }}>{item.name}</h3>
                    <p style={{ color: "var(--sage-dark)", fontWeight: 700, marginTop: 6, fontSize: 15 }}>
                      ₹{item.price} each
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
                    <div className="quantity-selector">
                      <button
                        className="quantity-btn"
                        onClick={() => cart.update(item.productId, item.quantity - 1)}
                      >
                        &minus;
                      </button>
                      <input
                        className="quantity-input"
                        type="text"
                        readOnly
                        value={item.quantity}
                      />
                      <button
                        className="quantity-btn"
                        onClick={() => cart.update(item.productId, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="btn secondary"
                      onClick={() => cart.remove(item.productId)}
                      style={{ padding: "8px 14px", fontSize: 13, borderColor: "var(--error)", color: "var(--error)" }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <aside className="card pad shop-sidebar">
            <h3 style={{ fontSize: 20, borderBottom: "1px solid var(--line)", paddingBottom: 12, marginBottom: 16 }}>
              Summary
            </h3>
            <div style={{ display: "grid", gap: 12, fontSize: 15, color: "var(--muted)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Subtotal</span>
                <span>₹{cart.total}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Shipping</span>
                <span style={{ color: "var(--success)", fontWeight: 600 }}>Free</span>
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
                  marginTop: 6,
                }}
              >
                <span>Total</span>
                <span>₹{cart.total}</span>
              </div>
            </div>
            <Link className="btn" href="/checkout" style={{ width: "100%", marginTop: 24 }}>
              Proceed to Checkout
            </Link>
            <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", marginTop: 14, margin: "14px 0 0 0" }}>
              Orders are placed via WhatsApp. No payment is required here.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
