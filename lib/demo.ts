import { slugify } from "./constants";

export type Product = {
  _id: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  concerns: string[];
  price: number;
  discountedPrice: number;
  stock: number;
  description: string;
  usage: string;
  ingredients: string;
  images: string[];
  published: boolean;
  featured?: boolean;
};

const names = [
  ["Calm Barrier Cleanser", "Skin", "Facewash / Cleansers", ["Sensitive Skin", "Acne & Acne Scars"], 699, 549],
  ["Bright Even Tone Serum", "Skin", "Serums", ["Pigmentation", "Ageing"], 1299, 999],
  ["Daily Cloud Sunscreen SPF 50", "Skin", "Sunscreen", ["Pigmentation", "Sensitive Skin"], 899, 749],
  ["Hydra Repair Moisturiser", "Skin", "Moisturisers", ["Sensitive Skin", "Ageing"], 799, 649],
  ["Scalp Balance Shampoo", "Hair", "Scalp Care", ["Dandruff", "Itchy Scalp"], 699, 599],
  ["Hair Density Tonic", "Hair", "Hair Treatment", ["Hair Fall"], 1499, 1199],
  ["Collagen Glow Support", "Supplements", "Collagen", ["Ageing"], 1599, 1299],
  ["Pediatric Gentle Lotion", "Skin", "Moisturisers", ["Sensitive Skin"], 599, 499],
  ["Luxe Retinal Night Cream", "Luxe", "Premium Anti-Aging", ["Ageing", "Pigmentation"], 2199, 1799]
];

export const demoProducts: Product[] = names.map(([name, category, subcategory, concerns, price, discountedPrice], index) => ({
  _id: `demo-${index + 1}`,
  name: name as string,
  brand: index % 2 ? "Dermalab" : "DermaDental360 Select",
  category: category as string,
  subcategory: subcategory as string,
  concerns: concerns as string[],
  price: price as number,
  discountedPrice: discountedPrice as number,
  stock: 24 + index,
  description: "Dermatologist-curated care for everyday skin and hair routines, chosen for gentle performance and visible consistency.",
  usage: "Use as directed on the pack. For active treatments, start slowly and follow professional advice.",
  ingredients: "Dermatology-grade active blend with soothing support ingredients.",
  images: [`/api/placeholder?label=${encodeURIComponent(name as string)}`],
  published: true,
  featured: index < 4
}));

export function findDemoProduct(id: string) {
  return demoProducts.find((product) => product._id === id || slugify(product.name) === id);
}
