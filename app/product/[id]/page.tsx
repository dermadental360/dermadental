import { notFound } from "next/navigation";
import { getProduct, getProducts, getFrequentlyBoughtTogether } from "@/lib/products";
import { ProductDetailPageClient } from "@/components/ProductDetailPageClient";
import { getAllSettings } from "@/lib/settings";

export const revalidate = 60;

export async function generateStaticParams() {
  const products = await getProducts();
  return products.slice(0, 20).map((p) => ({ id: p._id }));
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  // Fetch related products, FBT products, and settings in parallel
  const [allProducts, settings, fbtProducts] = await Promise.all([
    getProducts({ category: product.category }),
    getAllSettings(),
    getFrequentlyBoughtTogether(product._id, 3)
  ]);

  const relatedProducts = allProducts
    .filter((p) => p._id !== product._id)
    .slice(0, 4);

  return (
    <main className="section page-enter">
      <ProductDetailPageClient 
        product={product} 
        relatedProducts={relatedProducts} 
        fbtProducts={fbtProducts}
        shippingHighlightsStr={settings.shipping_highlights}
      />
    </main>
  );
}
