import { slugify } from "./constants";

export type Product = {
  _id: string;
  name: string;
  brand: string;
  category: string;
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
  ["Calm Barrier Cleanser", "Facewash", ["Sensitive Skin", "Acne & Acne Scars"], 699, 549],
  ["Bright Even Tone Serum", "Serum", ["Pigmentation", "Ageing"], 1299, 999],
  ["Daily Cloud Sunscreen SPF 50", "Sunscreen", ["Pigmentation", "Sensitive Skin"], 899, 749],
  ["Hydra Repair Moisturiser", "Moisturiser", ["Sensitive Skin", "Ageing"], 799, 649],
  ["Scalp Balance Shampoo", "Hair", ["Dandruff", "Itchy Scalp"], 699, 599],
  ["Hair Density Tonic", "Hair", ["Hair Fall"], 1499, 1199],
  ["Collagen Glow Support", "Supplements", ["Ageing"], 1599, 1299],
  ["Pediatric Gentle Lotion", "Pediatric", ["Sensitive Skin"], 599, 499],
  ["Luxe Retinal Night Cream", "Luxe", ["Ageing", "Pigmentation"], 2199, 1799]
];

export const demoProducts: Product[] = names.map(([name, category, concerns, price, discountedPrice], index) => ({
  _id: `demo-${index + 1}`,
  name: name as string,
  brand: index % 2 ? "Dermalab" : "DermaDental360 Select",
  category: category as string,
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
