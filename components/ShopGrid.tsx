import { ProductCard } from "./ProductCard";
import type { Product } from "@/lib/demo";

export function ShopGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid cols-4">
      {products.map((product) => <ProductCard key={product._id} product={product} />)}
    </div>
  );
}
