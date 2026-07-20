"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/demo";
import { useCart } from "./CartProvider";
import { ProductImages } from "./ProductImages";
import { ProductReviews } from "./ProductReviews";
import { ProductCard } from "./ProductCard";

interface ProductDetailPageClientProps {
  product: Product;
  relatedProducts: Product[];
  shippingHighlightsStr?: string;
}

export function ProductDetailPageClient({ product, relatedProducts, shippingHighlightsStr }: ProductDetailPageClientProps) {
  const cart = useCart();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [inWishlist, setInWishlist] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<string | null>("description");

  // Parse shipping highlights or fallback to default
  let shippingHighlights = [
    { icon: "🚚", title: "Free Express Shipping", text: "On orders above ₹499. Same day dispatch." },
    { icon: "📦", title: "Secure Delivery", text: "Standard delivery in 3 to 5 business days." },
    { icon: "🛡️", title: "Authentic Clinic Sourced", text: "Directly selected and recommended by our medical experts." }
  ];

  if (shippingHighlightsStr) {
    try {
      shippingHighlights = JSON.parse(shippingHighlightsStr);
    } catch (e) {
      console.error("Failed to parse shipping highlights", e);
    }
  }

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock < 10;
  const hasDiscount = product.price > product.discountedPrice;
  const discountAmt = product.price - product.discountedPrice;
  const discountPercent = hasDiscount
    ? Math.round((discountAmt / product.price) * 100)
    : 0;

  // Initialize wishlist from localStorage
  useEffect(() => {
    const list = localStorage.getItem("dd360_wishlist");
    if (list) {
      try {
        const ids = JSON.parse(list) as string[];
        setInWishlist(ids.includes(product._id));
      } catch (e) {
        console.error(e);
      }
    }
  }, [product._id]);

  const toggleWishlist = () => {
    const list = localStorage.getItem("dd360_wishlist");
    let ids: string[] = [];
    if (list) {
      try {
        ids = JSON.parse(list) as string[];
      } catch (e) {
        ids = [];
      }
    }
    if (ids.includes(product._id)) {
      ids = ids.filter((id) => id !== product._id);
      setInWishlist(false);
    } else {
      ids.push(product._id);
      setInWishlist(true);
    }
    localStorage.setItem("dd360_wishlist", JSON.stringify(ids));
  };

  const handleQuantityChange = (val: number) => {
    if (val < 1) return;
    if (val > product.stock) return;
    setQuantity(val);
  };

  const handleAddToCart = () => {
    cart.add(product, quantity);
  };

  const handleBuyNow = () => {
    cart.add(product, quantity);
    router.push("/checkout");
  };

  const toggleAccordion = (section: string) => {
    setActiveAccordion(activeAccordion === section ? null : section);
  };

  // Mock average ratings
  const averageRating = 4.8;
  const reviewCount = 18;

  return (
    <div className="product-detail-container">
      {/* 2-Column Responsive Layout */}
      <div className="product-detail-grid">
        {/* Left Column - Sticky Image Gallery */}
        <div className="product-gallery-sticky">
          <ProductImages images={product.images} name={product.name} />
          
          <div className="trust-badges-premium desktop-only">
            <div className="trust-badge-premium-item">
              <span className="trust-badge-premium-icon">✓</span>
              <span className="trust-badge-premium-text">Clinic Selected</span>
            </div>
            <div className="trust-badge-premium-item">
              <span className="trust-badge-premium-icon">✦</span>
              <span className="trust-badge-premium-text">Dr. Certified</span>
            </div>
            <div className="trust-badge-premium-item">
              <span className="trust-badge-premium-icon">☘</span>
              <span className="trust-badge-premium-text">Gentle Formula</span>
            </div>
          </div>
        </div>

        {/* Right Column - Product Purchase Info & Specs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Eyebrow: Brand & Category */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="eyebrow" style={{ margin: 0, fontSize: 12 }}>
              {product.brand} &middot; {product.category}
            </span>
            {isOutOfStock ? (
              <span className="badge out-of-stock" style={{ padding: "4px 10px", fontSize: 11 }}>Sold Out</span>
            ) : isLowStock ? (
              <span className="badge low-stock" style={{ padding: "4px 10px", fontSize: 11 }}>Only {product.stock} Left</span>
            ) : (
              <span className="badge stock" style={{ padding: "4px 10px", fontSize: 11 }}>In Stock</span>
            )}
          </div>

          {/* Product Title */}
          <h1 style={{ margin: "4px 0 8px 0", fontSize: "clamp(24px, 3.5vw, 38px)", fontWeight: 700, lineHeight: 1.25 }}>
            {product.name}
          </h1>

          {/* Ratings (future ready mock) */}
          <div 
            style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
            onClick={() => {
              const element = document.getElementById("reviews-section");
              if (element) {
                element.scrollIntoView({ behavior: "smooth" });
              }
            }}
          >
            <div style={{ display: "flex", gap: 2 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <svg key={star} width="16" height="16" viewBox="0 0 24 24" fill={star <= Math.floor(averageRating) ? "var(--gold)" : "none"} stroke="var(--gold)" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{averageRating}</span>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>({reviewCount} reviews)</span>
          </div>

          {/* Price & Savings */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, margin: "8px 0" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span style={{ fontSize: 32, fontWeight: 700, color: "var(--ink)" }}>₹{product.discountedPrice}</span>
              {hasDiscount && (
                <>
                  <del style={{ fontSize: 18, color: "var(--muted)" }}>₹{product.price}</del>
                  <span className="premium-price-badge">
                    {discountPercent}% OFF
                  </span>
                </>
              )}
            </div>
            {hasDiscount && (
              <span style={{ fontSize: 13, color: "var(--success)", fontWeight: 600 }}>
                You save ₹{discountAmt} on this clinical formula
              </span>
            )}
          </div>

          {/* Short Description */}
          <p style={{ fontSize: 15.5, color: "var(--muted)", lineHeight: 1.6, margin: "4px 0" }}>
            {product.description}
          </p>

          {/* Quantity Selector & Wishlist */}
          {!isOutOfStock && (
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--muted)" }}>Quantity</span>
                <div className="quantity-stepper">
                  <button 
                    className="quantity-stepper-btn"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    &minus;
                  </button>
                  <span className="quantity-stepper-value">{quantity}</span>
                  <button 
                    className="quantity-stepper-btn"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= product.stock}
                  >
                    &#43;
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--muted)" }}>Wishlist</span>
                <button 
                  className={`wishlist-circle-btn ${inWishlist ? "active" : ""}`}
                  onClick={toggleWishlist}
                  aria-label="Add to wishlist"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={inWishlist ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Buy Now & Add to Cart Buttons */}
          <div style={{ display: "flex", gap: 12, marginTop: 16, width: "100%" }}>
            <button
              className="premium-btn premium-btn-secondary"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
            >
              Add to Cart
            </button>
            <button
              className="premium-btn premium-btn-primary"
              onClick={handleBuyNow}
              disabled={isOutOfStock}
            >
              Buy Now
            </button>
          </div>

          {/* Delivery Information */}
          {shippingHighlights && shippingHighlights.length > 0 && (
            <div 
              style={{ 
                marginTop: 20, 
                padding: 16, 
                borderRadius: 12, 
                border: "1px solid var(--line)", 
                backgroundColor: "var(--bg-secondary)",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                fontSize: 13.5
              }}
            >
              {shippingHighlights.map((highlight, index) => (
                <div key={index} style={{ display: "flex", gap: 10 }}>
                  <span style={{ fontSize: 16 }}>{highlight.icon}</span>
                  <div>
                    <strong>{highlight.title}</strong>
                    <p style={{ margin: "2px 0 0 0", color: "var(--muted)" }}>{highlight.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Product Highlights */}
          <div style={{ marginTop: 8 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--muted)", marginBottom: 8 }}>
              Formula Highlights
            </h3>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: "var(--muted)", display: "flex", flexDirection: "column", gap: 4 }}>
              <li>Dermatologist curated &amp; clinically verified</li>
              <li>PH balanced &amp; free from synthetic fragrance</li>
              <li>Suitable for sensitive skin and post-procedure recovery</li>
              <li>Non-comedogenic (won't clog skin or dental-adjacent pores)</li>
            </ul>
          </div>

          {/* Trust badges for mobile (hidden on desktop) */}
          <div className="trust-badges-premium" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 12, borderTop: "none" }}>
            <div className="trust-badge-premium-item" style={{ padding: "8px 4px" }}>
              <span style={{ fontSize: 16 }}>✓</span>
              <span style={{ fontSize: 10, fontWeight: 600 }}>Clinic Selected</span>
            </div>
            <div className="trust-badge-premium-item" style={{ padding: "8px 4px" }}>
              <span style={{ fontSize: 16 }}>✦</span>
              <span style={{ fontSize: 10, fontWeight: 600 }}>Dr. Certified</span>
            </div>
            <div className="trust-badge-premium-item" style={{ padding: "8px 4px" }}>
              <span style={{ fontSize: 16 }}>☘</span>
              <span style={{ fontSize: 10, fontWeight: 600 }}>Gentle Formula</span>
            </div>
          </div>

          {/* Premium Accordions for Product Info Details */}
          <div className="premium-accordion">
            {/* Description Accordion */}
            <div className="premium-accordion-item">
              <button className="premium-accordion-trigger" onClick={() => toggleAccordion("description")}>
                <span>Description</span>
                <span className="premium-accordion-icon">{activeAccordion === "description" ? "−" : "+"}</span>
              </button>
              <div className={`premium-accordion-content ${activeAccordion === "description" ? "open" : ""}`}>
                <p>{product.description || "No description provided."}</p>
              </div>
            </div>

            {/* Benefits Accordion */}
            <div className="premium-accordion-item">
              <button className="premium-accordion-trigger" onClick={() => toggleAccordion("benefits")}>
                <span>Clinical Benefits</span>
                <span className="premium-accordion-icon">{activeAccordion === "benefits" ? "−" : "+"}</span>
              </button>
              <div className={`premium-accordion-content ${activeAccordion === "benefits" ? "open" : ""}`}>
                <p>Designed with medical-grade efficacy in mind, this formula offers several target advantages:</p>
                <ul style={{ paddingLeft: 20, marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                  <li><strong>Target Concerns:</strong> {product.concerns?.join(", ") || "General maintenance"}</li>
                  <li><strong>Barrier Support:</strong> Strengthens dermal defenses and maintains optimum pH levels.</li>
                  <li><strong>High Bioavailability:</strong> Fast absorbing formula ensures active ingredients penetrate effectively.</li>
                  <li><strong>Multi-Action Comfort:</strong> Soothes inflammation while offering active correction.</li>
                </ul>
              </div>
            </div>

            {/* Ingredients Accordion */}
            <div className="premium-accordion-item">
              <button className="premium-accordion-trigger" onClick={() => toggleAccordion("ingredients")}>
                <span>Ingredients</span>
                <span className="premium-accordion-icon">{activeAccordion === "ingredients" ? "−" : "+"}</span>
              </button>
              <div className={`premium-accordion-content ${activeAccordion === "ingredients" ? "open" : ""}`}>
                <p style={{ fontStyle: "italic" }}>{product.ingredients || "Ingredients list unavailable."}</p>
              </div>
            </div>

            {/* How to Use Accordion */}
            <div className="premium-accordion-item">
              <button className="premium-accordion-trigger" onClick={() => toggleAccordion("usage")}>
                <span>How to Use</span>
                <span className="premium-accordion-icon">{activeAccordion === "usage" ? "−" : "+"}</span>
              </button>
              <div className={`premium-accordion-content ${activeAccordion === "usage" ? "open" : ""}`}>
                <p>{product.usage || "Use as directed by your clinician."}</p>
              </div>
            </div>

            {/* Warnings Accordion */}
            <div className="premium-accordion-item">
              <button className="premium-accordion-trigger" onClick={() => toggleAccordion("warnings")}>
                <span>Warnings &amp; Cautions</span>
                <span className="premium-accordion-icon">{activeAccordion === "warnings" ? "−" : "+"}</span>
              </button>
              <div className={`premium-accordion-content ${activeAccordion === "warnings" ? "open" : ""}`}>
                <p style={{ color: "var(--error)" }}>
                  &bull; For external use only. Do not ingest.<br />
                  &bull; Avoid contact with eyes. If contact occurs, rinse thoroughly with fresh water.<br />
                  &bull; Perform a patch test on a small area of skin before first usage.<br />
                  &bull; If persistent irritation or sensitivity occurs, discontinue use and consult a physician.
                </p>
              </div>
            </div>

            {/* Specifications Accordion */}
            <div className="premium-accordion-item">
              <button className="premium-accordion-trigger" onClick={() => toggleAccordion("specs")}>
                <span>Specifications</span>
                <span className="premium-accordion-icon">{activeAccordion === "specs" ? "−" : "+"}</span>
              </button>
              <div className={`premium-accordion-content ${activeAccordion === "specs" ? "open" : ""}`}>
                <table className="spec-table">
                  <tbody>
                    <tr>
                      <td>Brand</td>
                      <td>{product.brand}</td>
                    </tr>
                    <tr>
                      <td>Category</td>
                      <td>{product.category}</td>
                    </tr>
                    <tr>
                      <td>Subcategory</td>
                      <td>{product.subcategory || "N/A"}</td>
                    </tr>
                    <tr>
                      <td>Availability</td>
                      <td>{product.stock > 0 ? `${product.stock} Units In Stock` : "Temporarily Out of Stock"}</td>
                    </tr>
                    <tr>
                      <td>Intended Concerns</td>
                      <td>{product.concerns?.join(", ") || "General Care"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div id="reviews-section" style={{ marginTop: 64, paddingTop: 40, borderTop: "1px solid var(--line)" }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Customer Reviews &amp; Ratings</h2>
        <ProductReviews productId={product._id} />
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div style={{ marginTop: 64, paddingTop: 40, borderTop: "1px solid var(--line)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <p className="eyebrow" style={{ margin: 0 }}>Recommended for you</p>
              <h2 style={{ fontSize: 24, fontWeight: 700, margin: "4px 0 0 0" }}>Related Products</h2>
            </div>
          </div>
          <div className="grid cols-4" style={{ gap: 24 }}>
            {relatedProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom Action Bar */}
      {!isOutOfStock && (
        <div className="mobile-sticky-action-bar">
          <button className="premium-btn premium-btn-secondary" onClick={handleAddToCart}>
            Add to Cart
          </button>
          <button className="premium-btn premium-btn-primary" onClick={handleBuyNow}>
            Buy Now
          </button>
        </div>
      )}
    </div>
  );
}
