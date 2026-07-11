"use client";

import { useRouter } from "next/navigation";
import type { Product } from "@/lib/demo";
import { useCart } from "./CartProvider";

export function ProductActions({ product }: { product: Product }) {
  const cart = useCart();
  const router = useRouter();
  const isOutOfStock = product.stock <= 0;

  return (
    <div className="actions" style={{ marginTop: 22, flexWrap: "wrap", gap: 14 }}>
      <button
        className="btn"
        onClick={() => cart.add(product)}
        disabled={isOutOfStock}
        style={{ minWidth: 160 }}
      >
        {isOutOfStock ? "Out of Stock" : "Add to Cart"}
      </button>
      <button
        className="btn soft"
        onClick={() => {
          cart.add(product);
          router.push("/checkout");
        }}
        disabled={isOutOfStock}
        style={{ minWidth: 160 }}
      >
        Buy Now
      </button>
    </div>
  );
}
