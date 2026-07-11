"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/demo";

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

type CartContextValue = {
  items: CartItem[];
  count: number;
  total: number;
  add: (product: Product, quantity?: number) => void;
  update: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("dd360_cart");
    if (saved) setItems(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("dd360_cart", JSON.stringify(items));
  }, [items]);

  const showToast = (message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts((current) => [...current, { id, message }]);
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, 3000);
  };

  const value = useMemo<CartContextValue>(() => ({
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
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
  }), [items]);

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
