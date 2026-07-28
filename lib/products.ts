import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";
import { Product, demoProducts } from "./demo";

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
    if (products.length === 0) {
      return demoProducts.filter(p => p.published && p.featured).slice(0, limit);
    }
    return products.map(normalize);
  } catch (error) {
    console.error("Prisma getFeaturedProducts failed:", error);
    return demoProducts.filter(p => p.published && p.featured).slice(0, limit);
  }
});

const CATEGORY_MAP: Record<string, string> = {
  "skin": "Skin",
  "oral-care": "Oral Care",
  "oral care": "Oral Care",
  "hair": "Hair",
  "supplements": "Supplements",
  "luxe": "Luxe",
};

export const getProducts = cache(async function getProducts(filters: Record<string, string | undefined> = {}) {
  const qTrim = filters.q?.trim();
  const targetCategory = filters.category ? (CATEGORY_MAP[filters.category.toLowerCase()] || filters.category) : undefined;
  const targetSubcategory = filters.subcategory;
  const targetConcern = filters.concern?.toLowerCase();

  const filterList = (list: Product[]): Product[] => {
    let res = list.filter(p => p.published !== false);

    if (targetCategory) {
      const catLower = targetCategory.toLowerCase();
      res = res.filter(p => p.category.toLowerCase().includes(catLower));
    }

    if (targetSubcategory) {
      const subLower = targetSubcategory.toLowerCase();
      res = res.filter(p => p.subcategory.toLowerCase().includes(subLower));
    }

    if (qTrim) {
      const qLower = qTrim.toLowerCase();
      res = res.filter(p => {
        const matchName = p.name.toLowerCase().includes(qLower);
        const matchBrand = p.brand.toLowerCase().includes(qLower);
        const matchCat = p.category.toLowerCase().includes(qLower);
        const matchSub = p.subcategory.toLowerCase().includes(qLower);
        const matchDesc = p.description.toLowerCase().includes(qLower);
        const matchIngr = p.ingredients.toLowerCase().includes(qLower);
        const matchConcern = p.concerns.some(c => c.toLowerCase().includes(qLower));
        return matchName || matchBrand || matchCat || matchSub || matchDesc || matchIngr || matchConcern;
      });
    }

    if (targetConcern) {
      res = res.filter(p => p.concerns.some(c => c.toLowerCase().includes(targetConcern)));
    }

    return res;
  };

  try {
    const where: any = { published: true };
    if (targetCategory) {
      where.category = { contains: targetCategory, mode: "insensitive" };
    }
    if (targetSubcategory) {
      where.subcategory = { contains: targetSubcategory, mode: "insensitive" };
    }
    if (qTrim) {
      where.OR = [
        { name: { contains: qTrim, mode: "insensitive" } },
        { brand: { contains: qTrim, mode: "insensitive" } },
        { category: { contains: qTrim, mode: "insensitive" } },
        { subcategory: { contains: qTrim, mode: "insensitive" } },
        { description: { contains: qTrim, mode: "insensitive" } },
        { ingredients: { contains: qTrim, mode: "insensitive" } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      select: LEAN_PRODUCT_SELECT,
      orderBy: { createdAt: "desc" }
    });

    if (products.length === 0) {
      // If DB has no matches or is unseeded, fall back to demoProducts
      return filterList(demoProducts);
    }

    let results = products.map(normalize);

    // If query string q is specified, check concerns array on DB results as well
    if (qTrim || targetConcern) {
      const allDbProducts = await prisma.product.findMany({
        where: { published: true },
        select: LEAN_PRODUCT_SELECT,
        orderBy: { createdAt: "desc" }
      });
      return filterList(allDbProducts.map(normalize));
    }

    return results;
  } catch (error) {
    console.error("Prisma getProducts failed, falling back to demo products:", error);
    return filterList(demoProducts);
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


