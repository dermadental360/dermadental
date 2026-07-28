import { cache } from "react";
import { prisma } from "./prisma";

// Default settings matching current website defaults
export const DEFAULT_SETTINGS = {
  hero_eyebrow: "Dermatology-led care in Khar West",
  hero_title: "Skin and hair routines chosen with clinical calm.",
  hero_subtitle: "Shop dermatologist-curated skincare, book guidance with Dr. Sadaf Yamin, and place orders directly through WhatsApp without payment complications.",
  hero_image: "/hero/dermadental-hero.webp",
  top_bar_text: "Book clinic guidance with Dr. Sadaf Yamin - 12:00 PM to 7:00 PM, Sunday Closed",
  about_eyebrow: "Dermatologist-led Care",
  about_title: "About DermaDental360",
  about_subtitle: "DermaDental360 brings clinic-led skin, hair and dental wellness together with a carefully selected product catalog. Under the clinical guidance of Dr. Sadaf Yamin, our clinic focuses on calm discovery, personalized treatment selection, and direct WhatsApp support.",
  about_image: "/api/placeholder?label=Dr.%20Sadaf%20Yamin",
  consultation_eyebrow: "Medical Consultation",
  consultation_title: "Book clinic guidance",
  consultation_subtitle: "Schedule an appointment for a personalized, dermatologist-led skin or hair assessment. Visit us at Khar West, Mumbai. Timings are 12:00 PM to 7:00 PM, Sunday Closed.",
  consultation_image: "/api/placeholder?label=Skin%20Consultation",
  shipping_highlights: JSON.stringify([
    { icon: "🚚", title: "Free Express Shipping", text: "On orders above ₹499. Same day dispatch." },
    { icon: "📦", title: "Secure Delivery", text: "Standard delivery in 3 to 5 business days." },
    { icon: "🛡️", title: "Authentic Clinic Sourced", text: "Directly selected and recommended by our medical experts." }
  ]),
  legal_entity_name: "Moeen International",
  gstin: "27AHTPG5622L2ZU",
  registered_address: "Flat No 10, New Ambe Bhavan, Rd Number 24, Khar W, Mumbai, Maharashtra 400052",
  support_email: "dd360health@gmail.com",
  support_phone: "9833699887",
  clinic_doctor: "Dr. Sadaf Yamin",
  clinic_timing: "12:00 PM to 7:00 PM, Sunday closed",
  cod_enabled: "true",
  cod_min_amount: "500",
  cod_max_amount: "5000",
  cod_fee_enabled: "false",
  cod_fee_amount: "0",
};

export type SettingKey = keyof typeof DEFAULT_SETTINGS;

let settingsCache: { data: Record<string, string>; expiresAt: number } | null = null;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

export const getAllSettings = cache(async function getAllSettings() {
  const now = Date.now();
  if (settingsCache && settingsCache.expiresAt > now) {
    return settingsCache.data;
  }

  const result: Record<string, string> = { ...DEFAULT_SETTINGS };
  try {
    const settings = await prisma.setting.findMany();
    for (const s of settings) {
      result[s.key] = s.value;
    }
    settingsCache = { data: result, expiresAt: now + CACHE_TTL_MS };
  } catch (err) {
    console.warn("Prisma failed to fetch settings:", err);
  }
  return result;
});

export const getSetting = cache(async function getSetting(key: SettingKey): Promise<string> {
  const all = await getAllSettings();
  return all[key] !== undefined ? all[key] : DEFAULT_SETTINGS[key];
});

export async function setSetting(key: SettingKey, value: string) {
  settingsCache = null; // Invalidate cache on setting update
  return prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}
