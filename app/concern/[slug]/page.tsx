import { ShopGrid } from "@/components/ShopGrid";
import { concerns, slugify } from "@/lib/constants";
import { getProducts } from "@/lib/products";

export default async function ConcernPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const concern = concerns.find((item) => slugify(item) === slug) || "Acne & Acne Scars";
  const products = await getProducts({ concern });
  return (
    <main className="section page-enter">
      <div className="container reveal">
        <p className="eyebrow">Concern Care</p>
        <h1 style={{ marginBottom: 28 }}>Solutions for {concern}</h1>
        <ShopGrid products={products} />
      </div>
    </main>
  );
}
