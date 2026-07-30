import { cache } from "react";
import { prisma } from "./prisma";

// Default settings matching database defaults
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
    { icon: "🚚", title: "Free Express Shipping", text: "On orders above ₹999. Same day dispatch." },
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
  free_shipping_threshold: "999",
  shipping_flat_rate: "99",
  prepaid_discount_percentage: "5",
  cod_fee: "0",
  enable_prepaid_discount: "true",
  enable_free_shipping: "true",
  enable_cod_fee: "false",
  // WhatsApp Settings
  whatsapp_provider: "META",
  whatsapp_phone_number_id: "",
  whatsapp_business_account_id: "",
  whatsapp_access_token: "",
  whatsapp_verify_token: "dd360_verify_token",
  whatsapp_webhook_url: "",
  whatsapp_admin_numbers: "9833699887",
  whatsapp_enable_new_order: "true",
  whatsapp_enable_new_inquiry: "true",
  whatsapp_enable_payment_success: "true",
  whatsapp_enable_order_packed: "true",
  whatsapp_enable_order_shipped: "true",
  whatsapp_enable_out_for_delivery: "true",
  whatsapp_enable_delivered: "true",
  whatsapp_enable_cancelled: "true",
  whatsapp_enable_refunded: "true",
  whatsapp_enable_abandoned_cart: "true",
  // Abandoned Cart Settings
  abandoned_cart_timer: "60", // in minutes
  abandoned_cart_auto_reminder: "true",
  // Coupon Defaults
  coupon_default_min_order: "0",
  coupon_default_usage_limit: "100"
};

export type SettingKey = keyof typeof DEFAULT_SETTINGS;

let settingsCache: { data: Record<string, string>; expiresAt: number } | null = null;

export function clearSettingsCache() {
  settingsCache = null;
}

export const getAllSettings = async function getAllSettings() {
  // Always query database live to guarantee 100% instant sync with Admin Panel
  const result: Record<string, string> = { ...DEFAULT_SETTINGS };
  try {
    const settings = await prisma.setting.findMany();
    for (const s of settings) {
      result[s.key] = s.value;
    }
  } catch (err) {
    console.warn("Prisma failed to fetch settings:", err);
  }
  return result;
};

export const getSetting = async function getSetting(key: SettingKey): Promise<string> {
  const all = await getAllSettings();
  return all[key] !== undefined ? all[key] : DEFAULT_SETTINGS[key];
};

export async function setSetting(key: SettingKey, value: string) {
  clearSettingsCache();
  return prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}
