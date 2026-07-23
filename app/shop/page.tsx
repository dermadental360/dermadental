import { ShopGrid } from "@/components/ShopGrid";
import { ShopFilters } from "@/components/ShopFilters";
import { getProducts } from "@/lib/products";
import Link from "next/link";

export const revalidate = 60;

export default async function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const products = await getProducts(params);
  return (
    <main className="section page-enter">
      <div className="container split">
        <ShopFilters initialQ={params.q} initialCategory={params.category} initialConcern={params.concern} />
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
