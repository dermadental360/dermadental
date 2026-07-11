export const clinic = {
  name: "DermaDental360",
  doctor: "Dr. Sadaf Yamin",
  phone: "9833699887",
  whatsapp: "919833699887",
  address: "Flat No 10, New Ambe Bhavan, Rd Number 24, Khar W, Mumbai, Maharashtra 400052",
  timing: "12:00 PM to 7:00 PM, Sunday closed",
  email: "dermadental360@gmail.com"
};

export const categories = ["Skin", "Hair", "Supplements", "Pediatric", "Luxe", "Facewash", "Serum", "Moisturiser", "Sunscreen"];
export const concerns = ["Acne & Acne Scars", "Ageing", "Sensitive Skin", "Pigmentation", "Under Eye Concerns", "Hair Fall", "Dandruff", "Frizzy Hair", "Itchy Scalp"];

export function slugify(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
