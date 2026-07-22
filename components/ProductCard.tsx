"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/demo";
import { useCart } from "./CartProvider";

export const ProductCard = React.memo(function ProductCard({ product }: { product: Product }) {
  const cart = useCart();
  const router = useRouter();
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock < 10;
  const hasDiscount = product.price > product.discountedPrice;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountedPrice) / product.price) * 100)
    : 0;

  return (
    <article className="card" style={{ opacity: isOutOfStock ? 0.8 : 1, display: "flex", flexDirection: "column", height: "100%" }}>
      <Link href={`/product/${product._id}`} className="product-image" style={{ position: "relative", width: "100%", height: "240px", display: "block" }}>
        <div className="badge-container">
          {hasDiscount && <span className="badge discount">{discountPercent}% OFF</span>}
          {isOutOfStock ? (
            <span className="badge out-of-stock">Sold Out</span>
          ) : isLowStock ? (
            <span className="badge low-stock">Only {product.stock} Left</span>
          ) : (
            <span className="badge stock">In Stock</span>
          )}
        </div>
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          style={{ objectFit: "contain" }}
        />
      </Link>
      <div className="pad" style={{ display: "flex", flexDirection: "column", flexGrow: 1, minHeight: "220px", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
          <p className="eyebrow" style={{ margin: 0 }}>{product.brand}</p>
          <h3 style={{ margin: "6px 0", fontSize: 18, lineHeight: 1.3 }}>
            <Link href={`/product/${product._id}`}>{product.name}</Link>
          </h3>
          <p style={{ fontSize: 13, margin: "0 0 10px 0", color: "var(--muted)" }}>
            {product.category} {product.concerns?.[0] ? `· ${product.concerns[0]}` : ""}
          </p>
        </div>
        <div>
          <div className="price" style={{ margin: "0 0 14px 0" }}>
            <span>₹{product.discountedPrice}</span>
            {hasDiscount && <del>₹{product.price}</del>}
          </div>
          <div style={{ display: "flex", gap: "8px", width: "100%" }}>
            <button
              className="btn"
              style={{ flex: 1, padding: "10px 8px", fontSize: "13px" }}
              onClick={() => cart.add(product)}
              disabled={isOutOfStock}
            >
              {isOutOfStock ? "Out of Stock" : "Add to Cart"}
            </button>
            {!isOutOfStock && (
              <button
                className="btn secondary"
                style={{ flex: 1, padding: "10px 8px", fontSize: "13px" }}
                onClick={() => {
                  cart.add(product);
                  router.push("/checkout");
                }}
              >
                Buy Now
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
});


