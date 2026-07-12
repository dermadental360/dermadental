import { ShopGrid } from "@/components/ShopGrid";
import { categories, concerns } from "@/lib/constants";
import { getProducts } from "@/lib/products";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const products = await getProducts(params);
  return (
    <main className="section page-enter">
      <div className="container split">
        <aside className="card pad reveal" style={{ position: "sticky", top: 120 }}>
          <h2 className="filters-title">Filter Catalog</h2>
          <form className="form" method="GET" action="/shop">
            <div className="filters-group">
              <label className="filters-group-title">Search Key</label>
              <input className="input" name="q" placeholder="Type keywords..." defaultValue={params.q || ""} />
            </div>
            
            <div className="filters-group">
              <label className="filters-group-title">Category</label>
              <select className="input" name="category" defaultValue={params.category || ""}>
                <option value="">All Categories</option>
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>

            <div className="filters-group">
              <label className="filters-group-title">Concern</label>
              <select className="input" name="concern" defaultValue={params.concern || ""}>
                <option value="">All Concerns</option>
                {concerns.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, marginTop: 14 }}>
              <button className="btn" type="submit" style={{ width: "100%" }}>Filter</button>
              {(params.q || params.category || params.concern) && (
                <Link className="btn secondary" href="/shop" style={{ padding: "12px 16px", display: "grid", placeItems: "center" }} title="Reset Filters">
                  &times;
                </Link>
              )}
            </div>
          </form>
        </aside>
        <section className="reveal reveal-delay-1">
          <div className="section-head">
            <div>
              <p className="eyebrow">Dermaceutic catalog</p>
              <h2>{products.length} {products.length === 1 ? "Product" : "Products"} Available</h2>
            </div>
          </div>
          {products.length === 0 ? (
            <div className="card pad" style={{ textAlign: "center", padding: "64px 24px" }}>
              <h3>No products found</h3>
              <p style={{ marginTop: 8 }}>Try adjusting your filters or search key.</p>
              <Link className="btn" href="/shop" style={{ marginTop: 18 }}>Reset Filters</Link>
            </div>
          ) : (
            <ShopGrid products={products} />
          )}
        </section>
      </div>
    </main>
  );
}
