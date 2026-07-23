import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";
import { Product } from "./demo";

const LEAN_PRODUCT_SELECT = {
  id: true,
  name: true,
  brand: true,
  category: true,
  subcategory: true,
  concerns: true,
  price: true,
  discountedPrice: true,
  stock: true,
  images: true,
  published: true,
  featured: true,
  createdAt: true,
};

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

export const getFeaturedProducts = cache(async function getFeaturedProducts(limit = 4) {
  try {
    const products = await prisma.product.findMany({
      where: { published: true, featured: true },
      take: limit,
      select: LEAN_PRODUCT_SELECT,
      orderBy: { createdAt: "desc" }
    });
    return products.map(normalize);
  } catch (error) {
    console.error("Prisma getFeaturedProducts failed:", error);
    return [];
  }
});

const CATEGORY_MAP: Record<string, string> = {
  "skin": "Skin",
  "oral-care": "Oral Care",
  "oral care": "Oral Care",
  "hair": "Hair",
  "supplements": "Supplements",
};

export const getProducts = cache(async function getProducts(filters: Record<string, string | undefined> = {}) {
  try {
    const where: any = { published: true };
    if (filters.category) {
      const rawCat = filters.category.toLowerCase();
      const mappedCat = CATEGORY_MAP[rawCat] || filters.category;
      where.category = { contains: mappedCat };
    }
    if (filters.subcategory) {
      where.subcategory = { contains: filters.subcategory };
    }
    if (filters.q) {
      where.OR = [
        { name: { contains: filters.q } },
        { brand: { contains: filters.q } }
      ];
    }
    const products = await prisma.product.findMany({
      where,
      select: LEAN_PRODUCT_SELECT,
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
    return [];
  }
});

export const getProduct = cache(async function getProduct(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id }
    });
    return product ? normalize(product) : null;
  } catch (error) {
    console.error("Prisma getProduct failed:", error);
    return null;
  }
});


