export const clinic = {
  name: "DermaDental360",
  legalEntityName: "Moeen International",
  gstin: "27AHTPG5622L2ZU",
  doctor: "Dr. Sadaf Yamin",
  phone: "9833699887",
  whatsapp: "919833699887",
  address: "Flat No 10, New Ambe Bhavan, Rd Number 24, Khar W, Mumbai, Maharashtra 400052",
  timing: "12:00 PM to 7:00 PM, Sunday closed",
  email: "dd360health@gmail.com"
};

export const FREE_SHIPPING_THRESHOLD = 999;
export const SHIPPING_CHARGE = 99;

export function calculateShippingDetails(
  subtotal: number,
  options?: {
    freeShippingThreshold?: number;
    shippingFlatRate?: number;
    enableFreeShipping?: boolean;
  }
) {
  const isFreeShippingAllowed = options?.enableFreeShipping !== false;
  const threshold = options?.freeShippingThreshold ?? 999;
  const flatRate = options?.shippingFlatRate ?? 99;

  let isFree = false;
  let shippingCharge = flatRate;

  if (isFreeShippingAllowed) {
    if (subtotal >= threshold) {
      isFree = true;
      shippingCharge = 0;
    }
  } else {
    // Rule OFF -> Shipping is ALWAYS ₹0
    isFree = false;
    shippingCharge = 0;
  }

  const remainingForFreeShipping = (isFree || !isFreeShippingAllowed) ? 0 : Math.max(0, threshold - subtotal);
  const grandTotal = subtotal + shippingCharge;

  return {
    subtotal,
    shippingCharge,
    isFree,
    remainingForFreeShipping,
    grandTotal
  };
}

export const categories = ["Skin", "Oral Care", "Hair", "Supplements"/*, "Luxe"*/];

export const subcategoriesMap: Record<string, string[]> = {
  "Skin": [
    "Facewash / Cleansers",
    "Serums",
    "Moisturisers",
    "Sunscreen",
    "Acne Care",
    "Pigmentation Care",
    "Anti-Aging",
    "Other"
  ],
  "Oral Care": [
    "Toothpaste",
    "Remineralizing Gel",
    "Tooth Gel",
    "Mouthwash",
    "Tooth Serum",
    "Dental Cream",
    "Sensitive Teeth Care",
    "Whitening Products",
    "Gum Care",
    "Kids Oral Care",
    "Orthodontic Care",
    "Fluoride Treatment",
    "Dental Accessories",
    "Other"
  ],
  "Hair": [
    "Shampoo",
    "Conditioner",
    "Hair Treatment",
    "Scalp Care",
    "Other"
  ],
  "Supplements": [
    "Vitamins",
    "Collagen",
    "Daily Nutrients",
    "Other"
  ],
  "Luxe": [
    "Premium Anti-Aging",
    "Luxury Serums",
    "Exclusive Oils",
    "Other"
  ]
};

export const skincareConcerns = [
  "Acne & Acne Scars",
  "Ageing",
  "Sensitive Skin",
  "Pigmentation",
  "Under Eye Concerns",
  "Other"
];

export const hairConcerns = [
  "Hair Fall",
  "Dandruff",
  "Frizzy Hair",
  "Itchy Scalp",
  "Other"
];

export const oralCareConcerns = [
  "Tooth Decay",
  "Cavities",
  "Sensitive Teeth",
  "Damaged Enamel",
  "Enamel Repair",
  "Weak Enamel",
  "Plaque",
  "Tartar",
  "Gum Bleeding",
  "Gingivitis",
  "Bad Breath",
  "Tooth Sensitivity",
  "Stained Teeth",
  "Teeth Whitening",
  "Dry Mouth",
  "Oral Hygiene",
  "Gum Inflammation",
  "Post Dental Treatment",
  "Braces Care",
  "Fresh Breath",
  "Other"
];

export const concerns = [
  ...skincareConcerns,
  ...hairConcerns,
  ...oralCareConcerns
];

export function slugify(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
