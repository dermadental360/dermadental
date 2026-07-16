export const clinic = {
  name: "DermaDental360",
  doctor: "Dr. Sadaf Yamin",
  phone: "9833699887",
  whatsapp: "919833699887",
  address: "Flat No 10, New Ambe Bhavan, Rd Number 24, Khar W, Mumbai, Maharashtra 400052",
  timing: "12:00 PM to 7:00 PM, Sunday closed",
  email: "dermadental360@gmail.com"
};

export const categories = ["Skin", "Oral Care", "Hair", "Supplements", "Luxe"];

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
  "Under Eye Concerns"
];

export const hairConcerns = [
  "Hair Fall",
  "Dandruff",
  "Frizzy Hair",
  "Itchy Scalp"
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
