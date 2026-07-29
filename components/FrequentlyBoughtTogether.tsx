"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/demo";
import { useCart } from "./CartProvider";

interface FrequentlyBoughtTogetherProps {
  mainProduct: Product;
  complementaryProducts: Product[];
}

export function FrequentlyBoughtTogether({ mainProduct, complementaryProducts }: FrequentlyBoughtTogetherProps) {
  const cart = useCart();

  // Combine main product and complementary products into bundle items
  const allBundleProducts = [mainProduct, ...complementaryProducts];

  // Selected product IDs state (all selected by default)
  const [selectedIds, setSelectedIds] = useState<string[]>(
    allBundleProducts.map((p) => p._id)
  );

  if (!complementaryProducts || complementaryProducts.length === 0) {
    return null;
  }

  const toggleSelect = (id: string) => {
    // Keep at least 1 item selected
    if (selectedIds.includes(id)) {
      if (selectedIds.length === 1) return;
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectedProducts = allBundleProducts.filter((p) => selectedIds.includes(p._id));
  
  const totalPrice = selectedProducts.reduce(
    (sum, p) => sum + (p.discountedPrice || p.price),
    0
  );
  
  const totalOriginalPrice = selectedProducts.reduce(
    (sum, p) => sum + p.price,
    0
  );

  const totalSavings = totalOriginalPrice > totalPrice ? totalOriginalPrice - totalPrice : 0;

  const handleAddSelected = () => {
    if (selectedProducts.length > 0) {
      cart.addMultiple(selectedProducts);
    }
  };

  return (
    <section 
      style={{ 
        marginTop: 48, 
        paddingTop: 36, 
        borderTop: "1px solid var(--line)", 
        display: "flex", 
        flexDirection: "column", 
        gap: 24 
      }}
    >
      <div>
        <p className="eyebrow" style={{ margin: 0 }}>Complete Your Routine</p>
        <h2 style={{ fontSize: "clamp(20px, 3vw, 26px)", fontWeight: 700, margin: "4px 0 0 0" }}>
          Frequently Bought Together
        </h2>
      </div>

      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: "1fr 340px", 
          gap: 32, 
          alignItems: "start",
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--line)",
          borderRadius: 20,
          padding: 28,
          boxShadow: "var(--shadow-sm)"
        }}
        className="fbt-grid-container"
      >
        {/* Left Column: Visual Product Gallery with '+' connectors */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div 
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 16, 
              flexWrap: "wrap" 
            }}
          >
            {allBundleProducts.map((product, idx) => {
              const isSelected = selectedIds.includes(product._id);
              const isMain = product._id === mainProduct._id;

              return (
                <div key={product._id} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  {idx > 0 && (
                    <span 
                      style={{ 
                        fontSize: 22, 
                        fontWeight: 600, 
                        color: "var(--muted)", 
                        userSelect: "none" 
                      }}
                    >
                      &#43;
                    </span>
                  )}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 10,
                      width: 140,
                      opacity: isSelected ? 1 : 0.45,
                      transition: "var(--transition-smooth)"
                    }}
                  >
                    <Link
                      href={`/product/${product._id}`}
                      style={{
                        position: "relative",
                        width: 120,
                        height: 120,
                        borderRadius: 14,
                        overflow: "hidden",
                        backgroundColor: "#ffffff",
                        border: isSelected ? "2px solid var(--sage-dark)" : "1px solid var(--line)",
                        boxShadow: isSelected ? "0 4px 14px rgba(15,127,143,0.15)" : "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 8
                      }}
                    >
                      {isMain && (
                        <span 
                          style={{
                            position: "absolute",
                            top: 4,
                            left: 4,
                            fontSize: 9,
                            fontWeight: 800,
                            textTransform: "uppercase",
                            backgroundColor: "var(--sage-dark)",
                            color: "#ffffff",
                            padding: "2px 6px",
                            borderRadius: 4,
                            zIndex: 2
                          }}
                        >
                          This Item
                        </span>
                      )}
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        width={100}
                        height={100}
                        style={{ objectFit: "contain", width: "100%", height: "100%" }}
                      />
                    </Link>
                    <div style={{ textAlign: "center", width: "100%" }}>
                      <p 
                        style={{ 
                          fontSize: 12.5, 
                          fontWeight: 600, 
                          color: "var(--ink)", 
                          margin: "0 0 2px 0",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}
                        title={product.name}
                      >
                        {product.name}
                      </p>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--sage-dark)" }}>
                        ₹{product.discountedPrice || product.price}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Checkbox List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
            {allBundleProducts.map((product) => {
              const isSelected = selectedIds.includes(product._id);
              const isMain = product._id === mainProduct._id;

              return (
                <label
                  key={product._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    fontSize: 14,
                    color: isSelected ? "var(--ink)" : "var(--muted)",
                    cursor: "pointer",
                    userSelect: "none"
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(product._id)}
                    style={{
                      width: 18,
                      height: 18,
                      accentColor: "var(--sage-dark)",
                      cursor: "pointer"
                    }}
                  />
                  <span>
                    <strong>{isMain ? "This item: " : ""}</strong>
                    {product.name} &ndash;{" "}
                    <span style={{ fontWeight: 700, color: "var(--ink)" }}>
                      ₹{product.discountedPrice || product.price}
                    </span>
                    {product.price > product.discountedPrice && (
                      <del style={{ marginLeft: 6, color: "var(--muted)", fontSize: 12 }}>
                        ₹{product.price}
                      </del>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Right Column: Total Price & One-Click Add to Cart Action */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid var(--line)",
            borderRadius: 16,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            boxShadow: "var(--shadow-sm)"
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: "var(--muted)" }}>
              Total Bundle Price ({selectedProducts.length} {selectedProducts.length === 1 ? "item" : "items"})
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 4 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: "var(--ink)" }}>
                ₹{totalPrice}
              </span>
              {totalOriginalPrice > totalPrice && (
                <del style={{ fontSize: 16, color: "var(--muted)" }}>
                  ₹{totalOriginalPrice}
                </del>
              )}
            </div>
            {totalSavings > 0 && (
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--success)" }}>
                ✓ Bundle Savings: ₹{totalSavings}
              </span>
            )}
          </div>

          <button
            className="btn"
            onClick={handleAddSelected}
            disabled={selectedProducts.length === 0}
            style={{
              width: "100%",
              height: 48,
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              borderRadius: 12,
              backgroundColor: "var(--sage-dark)",
              color: "#ffffff"
            }}
          >
            Add Selected to Cart ({selectedProducts.length})
          </button>

          <p style={{ fontSize: 12, color: "var(--muted)", margin: 0, textAlign: "center" }}>
            🔒 Includes standard warranty and express dispatch
          </p>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 900px) {
          .fbt-grid-container {
            grid-template-columns: 1fr !important;
            padding: 20px !important;
          }
        }
      `}</style>
    </section>
  );
}
