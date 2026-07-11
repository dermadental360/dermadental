import { prisma } from "./prisma";

// Default settings matching current website defaults
export const DEFAULT_SETTINGS = {
  hero_eyebrow: "Dermatology-led care in Khar West",
  hero_title: "Skin and hair routines chosen with clinical calm.",
  hero_subtitle: "Shop dermatologist-curated skincare, book guidance with Dr. Sadaf Yamin, and place orders directly through WhatsApp without payment complications.",
  hero_image: "/hero/dermadental-hero.png",
  top_bar_text: "Book clinic guidance with Dr. Sadaf Yamin - 12:00 PM to 7:00 PM, Sunday Closed",
  about_eyebrow: "Dermatologist-led Care",
  about_title: "About DermaDental360",
  about_subtitle: "DermaDental360 brings clinic-led skin, hair and dental wellness together with a carefully selected product catalog. Under the clinical guidance of Dr. Sadaf Yamin, our clinic focuses on calm discovery, personalized treatment selection, and direct WhatsApp support.",
  about_image: "/api/placeholder?label=Dr.%20Sadaf%20Yamin",
  consultation_eyebrow: "Medical Consultation",
  consultation_title: "Book clinic guidance",
  consultation_subtitle: "Schedule an appointment for a personalized, dermatologist-led skin or hair assessment. Visit us at Khar West, Mumbai. Timings are 12:00 PM to 7:00 PM, Sunday Closed.",
  consultation_image: "/api/placeholder?label=Skin%20Consultation",
};

export type SettingKey = keyof typeof DEFAULT_SETTINGS;

export async function getSetting(key: SettingKey): Promise<string> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key },
    });
    return setting ? setting.value : DEFAULT_SETTINGS[key];
  } catch (err) {
    console.warn(`Prisma failed fetching setting "${key}":`, err);
    return DEFAULT_SETTINGS[key];
  }
}

export async function getAllSettings() {
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
}

export async function setSetting(key: SettingKey, value: string) {
  return prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}
