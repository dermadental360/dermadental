import { ShopGrid } from "@/components/ShopGrid";
import { getProducts } from "@/lib/products";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const products = await getProducts({ q: params.q });
  return (
    <main className="section page-enter">
      <div className="container reveal">
        <p className="eyebrow">Product Search</p>
        <h1 style={{ marginBottom: 14 }}>Search Catalog</h1>
        <form className="form" style={{ maxWidth: 620, marginBottom: 40, display: "grid", gridTemplateColumns: "1fr auto", gap: 12 }}>
          <input className="input" name="q" placeholder="Search skin, hair, sunscreen..." defaultValue={params.q || ""} />
          <button className="btn">Search</button>
        </form>
        {products.length === 0 ? (
          <div className="card pad" style={{ textAlign: "center", padding: 48 }}>
            <h3>No products match your search</h3>
            <p style={{ color: "var(--muted)", marginTop: 8 }}>Try double-checking your spelling or searching another concern.</p>
          </div>
        ) : (
          <ShopGrid products={products} />
        )}
      </div>
    </main>
  );
}
