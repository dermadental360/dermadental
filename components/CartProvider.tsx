"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/demo";
import { calculateShippingDetails } from "@/lib/constants";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

type ToastMsg = {
  id: string;
  message: string;
};

export type CartContextValue = {
  sessionId: string;
  items: CartItem[];
  count: number;
  subtotal: number;
  shippingCharge: number;
  isFreeShipping: boolean;
  remainingForFreeShipping: number;
  total: number; // Grand Total = subtotal + shippingCharge
  add: (product: Product, quantity?: number) => void;
  addMultiple: (products: Product[]) => void;
  update: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  syncAbandonedCart: (details?: { customerName?: string; email?: string; phone?: string }) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [sessionId, setSessionId] = useState<string>("");

  const syncAbandonedCart = (details?: { customerName?: string; email?: string; phone?: string }, customItems?: CartItem[]) => {
    let currentSid = sessionId || (typeof window !== "undefined" ? localStorage.getItem("dd360_cart_session_id") || "" : "");
    if (!currentSid && typeof window !== "undefined") {
      currentSid = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem("dd360_cart_session_id", currentSid);
      setSessionId(currentSid);
    }

    const cartItems = customItems || items;
    if (!currentSid || !cartItems || cartItems.length === 0) return;

    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    fetch("/api/cart/abandoned", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: currentSid,
        items: cartItems,
        cartValue: subtotal,
        customerName: details?.customerName,
        email: details?.email,
        phone: details?.phone,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) console.warn("Abandoned cart sync response:", data);
      })
      .catch((err) => console.warn("Failed to sync abandoned cart:", err));
  };

  useEffect(() => {
    let sid = localStorage.getItem("dd360_cart_session_id");
    if (!sid) {
      sid = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem("dd360_cart_session_id", sid);
    }
    setSessionId(sid);

    try {
      const saved = localStorage.getItem("dd360_cart");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
          syncAbandonedCart(undefined, parsed);
        }
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem("dd360_cart", JSON.stringify(items));
      syncAbandonedCart();
    }
  }, [items]);

  const showToast = (message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts((current) => [...current, { id, message }]);
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, 3000);
  };

  const value = useMemo<CartContextValue>(() => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingInfo = calculateShippingDetails(subtotal);

    return {
      sessionId,
      items,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      shippingCharge: items.length > 0 ? shippingInfo.shippingCharge : 0,
      isFreeShipping: items.length > 0 ? shippingInfo.isFree : false,
      remainingForFreeShipping: shippingInfo.remainingForFreeShipping,
      total: items.length > 0 ? shippingInfo.grandTotal : 0,
      syncAbandonedCart,
      add(product, quantity = 1) {
        setItems((current) => {
          const found = current.find((item) => item.productId === product._id);
          if (found) {
            return current.map((item) =>
              item.productId === product._id ? { ...item, quantity: item.quantity + quantity } : item
            );
          }
          return [
            ...current,
            {
              productId: product._id,
              name: product.name,
              price: product.discountedPrice || product.price,
              image: product.images[0],
              quantity,
            },
          ];
        });
        showToast(`Added "${product.name}" to cart`);
      },
      addMultiple(products) {
        if (!products.length) return;
        setItems((current) => {
          let updated = [...current];
          for (const product of products) {
            const foundIdx = updated.findIndex((item) => item.productId === product._id);
            if (foundIdx >= 0) {
              updated[foundIdx] = { ...updated[foundIdx], quantity: updated[foundIdx].quantity + 1 };
            } else {
              updated.push({
                productId: product._id,
                name: product.name,
                price: product.discountedPrice || product.price,
                image: product.images[0],
                quantity: 1,
              });
            }
          }
          return updated;
        });
        showToast(`Added ${products.length} items to cart`);
      },
      update(productId, quantity) {
        setItems((current) =>
          current
            .map((item) => (item.productId === productId ? { ...item, quantity } : item))
            .filter((item) => item.quantity > 0)
        );
      },
      remove(productId) {
        setItems((current) => current.filter((item) => item.productId !== productId));
      },
      clear() {
        setItems([]);
      },
    };
  }, [items, sessionId]);

  return (
    <CartContext.Provider value={value}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div className="toast-notification" key={t.id}>
            <span>{t.message}</span>
            <button onClick={() => setToasts((current) => current.filter((toast) => toast.id !== t.id))}>
              &times;
            </button>
          </div>
        ))}
      </div>
    </CartContext.Provider>
  );
}

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("useCart must be used inside CartProvider");
  return cart;
}
