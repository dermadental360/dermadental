import { ShopGrid } from "@/components/ShopGrid";
import { categories, subcategoriesMap, slugify } from "@/lib/constants";
import { getProducts } from "@/lib/products";
import Link from "next/link";

export const revalidate = 60;

export async function generateStaticParams() {
  return categories.map((c) => ({ slug: slugify(c) }));
}

export default async function CategoryPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { slug } = await params;
  const search = await searchParams;
  const category = categories.find((item) => slugify(item) === slug) || "Skin";
  const activeSub = search.sub || "All";

  const products = await getProducts({ 
    category,
    subcategory: activeSub !== "All" ? activeSub : undefined
  });

  const subcategories = ["All", ...(subcategoriesMap[category] || [])];

  return (
    <main className="section page-enter">
      <div className="container reveal">
        <p className="eyebrow">Category Catalog</p>
        <h1 style={{ marginBottom: 20 }}>{category} essentials</h1>

        <div className="subcategory-container">
          <div className="subcategory-tabs">
            {subcategories.map((sub) => {
              const isActive = activeSub === sub;
              const href = sub === "All" 
                ? `/category/${slug}`
                : `/category/${slug}?sub=${encodeURIComponent(sub)}`;
              return (
                <Link key={sub} href={href} className={`subcategory-tab ${isActive ? "active" : ""}`}>
                  {sub}
                </Link>
              );
            })}
          </div>
        </div>

        <ShopGrid products={products} />
      </div>
    </main>
  );
}
