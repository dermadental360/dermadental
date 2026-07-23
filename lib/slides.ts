import { cache } from "react";
import { prisma } from "./prisma";

export interface HeroSlide {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaUrl: string;
  desktopImage: string;
  mobileImage: string;
  videoUrl?: string;
  mobileVideoUrl?: string;
  altText: string;
  overlayOpacity: number;
  enabled: boolean;
  order: number;
}

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: "slide-1",
    eyebrow: "Clinical Skincare Collection",
    title: "Dermatologist-Formulated Radiance & Hydration",
    subtitle: "Experience clinical-grade serums and creams designed to restore natural barrier health under expert care.",
    ctaText: "Explore Essentials",
    ctaUrl: "/shop",
    desktopImage: "/hero/slide-1.webp",
    mobileImage: "/hero/slide-1.webp",
    altText: "Premium glass serum bottle with natural sunlight",
    overlayOpacity: 0.25,
    enabled: true,
    order: 1,
  },
  {
    id: "slide-2",
    eyebrow: "Personalized Medical Guidance",
    title: "Expert Skin & Hair Consultations in Khar West",
    subtitle: "Guided by Dr. Sadaf Yamin, receive custom routine recommendations tailored to your unique skin biology.",
    ctaText: "Book Guidance",
    ctaUrl: "/consultation",
    desktopImage: "/hero/slide-2.webp",
    mobileImage: "/hero/slide-2.webp",
    altText: "Modern luxury medical spa consultation room",
    overlayOpacity: 0.3,
    enabled: true,
    order: 2,
  },
  {
    id: "slide-3",
    eyebrow: "Targeted Cellular Repair",
    title: "Science-Backed Actives for Cellular Longevity",
    subtitle: "Precision formulations that hydrate deeply, calm inflammation, and restore youthful elasticity.",
    ctaText: "View Clinical Range",
    ctaUrl: "/shop",
    desktopImage: "/hero/slide-3.webp",
    mobileImage: "/hero/slide-3.webp",
    altText: "Macro glistening hydra-serum droplet on radiant skin",
    overlayOpacity: 0.2,
    enabled: true,
    order: 3,
  },
  {
    id: "slide-4",
    eyebrow: "Curated Daily Care",
    title: "Pure Botanicals & Advanced Bio-Peptides",
    subtitle: "Elevate your morning routine with light, fast-absorbing botanical formulations that protect all day.",
    ctaText: "Discover Routines",
    ctaUrl: "/category/serums",
    desktopImage: "/hero/slide-4.webp",
    mobileImage: "/hero/slide-4.webp",
    altText: "Luxury cosmetic product collection on travertine pedestal",
    overlayOpacity: 0.25,
    enabled: true,
    order: 4,
  },
  {
    id: "slide-5",
    eyebrow: "Direct WhatsApp Ordering",
    title: "Clinic-Verified Products Delivered to Your Door",
    subtitle: "Order directly through WhatsApp with direct prescription verification and seamless clinic support.",
    ctaText: "WhatsApp Assistant",
    ctaUrl: "https://wa.me/919999999999",
    desktopImage: "/hero/slide-5.webp",
    mobileImage: "/hero/slide-5.webp",
    altText: "Dermatologist doctor holding clinical skincare bottle",
    overlayOpacity: 0.3,
    enabled: true,
    order: 5,
  },
];

export const getSlides = cache(async function getSlides(): Promise<HeroSlide[]> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "hero_slides_v2" },
    });
    if (setting && setting.value) {
      const parsed = JSON.parse(setting.value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.sort((a: HeroSlide, b: HeroSlide) => a.order - b.order);
      }
    }
  } catch (err) {
    console.warn("Prisma failed fetching hero slides, falling back to defaults:", err);
  }
  return DEFAULT_HERO_SLIDES;
});

export async function saveSlides(slides: HeroSlide[]): Promise<boolean> {
  try {
    await prisma.setting.upsert({
      where: { key: "hero_slides_v2" },
      update: { value: JSON.stringify(slides) },
      create: { key: "hero_slides_v2", value: JSON.stringify(slides) },
    });
    return true;
  } catch (err) {
    console.error("Failed to save hero slides to Prisma database:", err);
    return false;
  }
}
