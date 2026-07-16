import { notFound } from "next/navigation";
import { getProduct, getProducts } from "@/lib/products";
import { ProductDetailPageClient } from "@/components/ProductDetailPageClient";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  // Fetch related products from the same category (limit to 4, excluding current product)
  const allProducts = await getProducts({ category: product.category });
  const relatedProducts = allProducts
    .filter((p) => p._id !== product._id)
    .slice(0, 4);

  return (
    <main className="section page-enter">
      <ProductDetailPageClient product={product} relatedProducts={relatedProducts} />
    </main>
  );
}
