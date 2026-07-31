import { ShopGrid } from "@/components/ShopGrid";
import { getProducts } from "@/lib/products";
import { SearchTracker } from "@/components/SearchTracker";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const q = params.q?.trim() || "";
  const products = await getProducts({ q });

  return (
    <main className="section page-enter">
      {q && <SearchTracker query={q} />}
      <div className="container">
        <div className="reveal">
          <p className="eyebrow">Product Search</p>
          <h1 style={{ marginBottom: 14 }}>Search Catalog</h1>
          <form
            action="/search"
            method="GET"
            className="form"
            style={{ maxWidth: 620, marginBottom: 32, display: "grid", gridTemplateColumns: "1fr auto", gap: 12 }}
          >
            <div style={{ position: "relative", width: "100%" }}>
              <input
                className="input"
                name="q"
                placeholder="Search skin, hair, sunscreen, cleanser..."
                defaultValue={q}
                style={{ width: "100%", paddingRight: q ? 40 : 16 }}
              />
              {q && (
                <Link
                  href="/search"
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--muted)",
                    fontSize: 18,
                    lineHeight: 1,
                    textDecoration: "none",
                    padding: "4px 8px",
                    borderRadius: "50%",
                    fontWeight: 700
                  }}
                  title="Clear search"
                >
                  &times;
                </Link>
              )}
            </div>
            <button className="btn" type="submit">Search</button>
          </form>
        </div>

        {q && (
          <div style={{ marginBottom: 24, fontSize: 15, color: "var(--muted)" }}>
            Showing results for <strong style={{ color: "var(--fg)" }}>&ldquo;{q}&rdquo;</strong> ({products.length} {products.length === 1 ? "product" : "products"} found)
          </div>
        )}

        {products.length === 0 ? (
          <div className="card pad reveal" style={{ textAlign: "center", padding: 48 }}>
            <h3>No products match your search</h3>
            <p style={{ color: "var(--muted)", marginTop: 8 }}>
              Try double-checking your spelling or searching another category or concern like sunscreen, hair, or acne.
            </p>
            {q && (
              <Link className="btn secondary" href="/search" style={{ marginTop: 18, display: "inline-block" }}>
                Clear Search
              </Link>
            )}
          </div>
        ) : (
          <ShopGrid products={products} />
        )}
      </div>
    </main>
  );
}
