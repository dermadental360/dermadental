import { prisma } from "./prisma";
import { demoProducts, Product } from "./demo";

function normalize(product: any): Product {
  let concerns: string[] = [];
  try {
    concerns = typeof product.concerns === "string" 
      ? JSON.parse(product.concerns) 
      : (Array.isArray(product.concerns) ? product.concerns : []);
  } catch {
    concerns = [];
  }

  let images: string[] = [];
  try {
    images = typeof product.images === "string" 
      ? JSON.parse(product.images) 
      : (Array.isArray(product.images) ? product.images : []);
  } catch {
    images = [];
  }

  return {
    _id: String(product.id || product._id),
    name: product.name,
    brand: product.brand,
    category: product.category,
    subcategory: product.subcategory || "",
    concerns: concerns,
    price: Number(product.price),
    discountedPrice: Number(product.discountedPrice),
    stock: Number(product.stock),
    description: product.description || "",
    usage: product.usage || "",
    ingredients: product.ingredients || "",
    images: images.length ? images : ["/api/placeholder?label=DermaDental360"],
    published: Boolean(product.published),
    featured: Boolean(product.featured)
  };
}

export async function getProducts(filters: Record<string, string | undefined> = {}) {
  try {
    const where: any = { published: true };
    if (filters.category) {
      where.category = { equals: filters.category };
    }
    if (filters.subcategory) {
      where.subcategory = { equals: filters.subcategory };
    }
    if (filters.q) {
      where.OR = [
        { name: { contains: filters.q } },
        { brand: { contains: filters.q } }
      ];
    }
    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" }
    });
    
    let results = products.map(normalize);
    if (filters.concern) {
      const targetConcern = filters.concern.toLowerCase();
      results = results.filter(p => p.concerns.some(c => c.toLowerCase().includes(targetConcern)));
    }
    return results;
  } catch (error) {
    console.error("Prisma getProducts failed:", error);
    return filterDemo(filters);
  }
}

export async function getProduct(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id }
    });
    return product ? normalize(product) : demoProducts.find((item) => item._id === id);
  } catch (error) {
    console.error("Prisma getProduct failed:", error);
    return demoProducts.find((product) => product._id === id);
  }
}

function filterDemo(filters: Record<string, string | undefined>) {
  return demoProducts.filter((product) => {
    const categoryOk = !filters.category || product.category.toLowerCase() === filters.category.toLowerCase();
    const subcategoryOk = !filters.subcategory || product.subcategory.toLowerCase() === filters.subcategory.toLowerCase();
    const concernOk = !filters.concern || product.concerns.some((concern) => concern.toLowerCase().includes(filters.concern!.toLowerCase()));
    const qOk = !filters.q || [product.name, product.brand, product.category, product.subcategory].some((value) => value && value.toLowerCase().includes(filters.q!.toLowerCase()));
    const publishedOk = product.published !== false;
    return categoryOk && subcategoryOk && concernOk && qOk && publishedOk;
  });
}
