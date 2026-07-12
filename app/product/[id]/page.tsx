import { notFound } from "next/navigation";
import { ProductActions } from "@/components/ProductActions";
import { getProduct } from "@/lib/products";
import { ProductReviews } from "@/components/ProductReviews";
import { ProductImages } from "@/components/ProductImages";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const hasDiscount = product.price > product.discountedPrice;
  const discountAmt = product.price - product.discountedPrice;

  return (
    <main className="section page-enter">
      <div className="container hero-grid reveal">
        <div>
          <ProductImages images={product.images} name={product.name} />
          <div className="trust-badges">
            <div className="trust-badge-card">
              <p>✓ Clinic Selected</p>
            </div>
            <div className="trust-badge-card">
              <p>✦ Dr. Certified</p>
            </div>
            <div className="trust-badge-card">
              <p>☘ Gentle Formula</p>
            </div>
          </div>
        </div>
        <div className="reveal reveal-delay-1" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p className="eyebrow" style={{ margin: 0 }}>{product.brand} · {product.category}</p>
          <h1 style={{ margin: "6px 0 12px 0", fontSize: "clamp(28px, 4vw, 48px)" }}>{product.name}</h1>
          <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6 }}>{product.description}</p>
          
          <div className="price" style={{ fontSize: 32, gap: 14, margin: "14px 0" }}>
            <span>₹{product.discountedPrice}</span>
            {hasDiscount && (
              <>
                <del style={{ fontSize: 18 }}>₹{product.price}</del>
                <span className="badge discount" style={{ fontSize: 12, padding: "6px 12px", borderRadius: 999 }}>
                  Save ₹{discountAmt}
                </span>
              </>
            )}
          </div>
          
          <ProductActions product={product} />

          <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 32 }}>
            <div className="card pad" style={{ borderLeft: "4px solid var(--sage)" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--sage-dark)" }}>How to use</h3>
              <p style={{ fontSize: 15, marginTop: 8, marginBottom: 0 }}>{product.usage}</p>
            </div>
            <div className="card pad" style={{ borderLeft: "4px solid var(--gold)" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--gold)" }}>Ingredients</h3>
              <p style={{ fontSize: 15, marginTop: 8, marginBottom: 0, fontStyle: "italic" }}>{product.ingredients}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="container" style={{ marginTop: 40 }}>
        <ProductReviews productId={product._id} />
      </div>
    </main>
  );
}

