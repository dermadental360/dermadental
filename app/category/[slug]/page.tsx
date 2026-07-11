import { ShopGrid } from "@/components/ShopGrid";
import { categories, slugify } from "@/lib/constants";
import { getProducts } from "@/lib/products";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = categories.find((item) => slugify(item) === slug) || "Skin";
  const products = await getProducts({ category });
  return (
    <main className="section page-enter">
      <div className="container reveal">
        <p className="eyebrow">Category Catalog</p>
        <h1 style={{ marginBottom: 28 }}>{category} essentials</h1>
        <ShopGrid products={products} />
      </div>
    </main>
  );
}
