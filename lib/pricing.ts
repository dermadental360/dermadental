export interface PricingBreakdown {
  subtotal: number;
  discountType: "PREPAID" | null;
  discountPercentage: number;
  discountAmount: number;
  shippingCharge: number;
  isFreeShipping: boolean;
  tax: number;
  codFee: number;
  finalAmount: number;
  grandTotal: number;
}

export interface PricingOptions {
  freeShippingThreshold?: number;
  shippingFlatRate?: number;
  prepaidDiscountPercentage?: number;
  enablePrepaidDiscount?: boolean;
  enableFreeShipping?: boolean;
  enableCodFee?: boolean;
}

/**
 * Single Source of Truth Pricing & Shipping Calculator
 * Strictly follows Admin Panel toggles and database values.
 */
export function calculatePricingDetails(
  subtotal: number,
  isPrepaid: boolean,
  codFee: number = 0,
  tax: number = 0,
  options?: PricingOptions
): PricingBreakdown {
  const round = (val: number) => Math.round((val + Number.EPSILON) * 100) / 100;

  const cleanSubtotal = round(Math.max(0, subtotal));
  const cleanTax = round(Math.max(0, tax));

  // 1. ONLINE PREPAID DISCOUNT RULE
  // If "Enable Discount" is OFF:
  // - Do NOT calculate any discount.
  // - Discount amount must be ₹0.
  // - Do NOT subtract any amount.
  const isPrepaidDiscountEnabled = options?.enablePrepaidDiscount === true;
  const configuredDiscountPct = options?.prepaidDiscountPercentage ?? 0;

  let discountPercentage = 0;
  let discountType: "PREPAID" | null = null;
  let discountAmount = 0;

  if (isPrepaid && isPrepaidDiscountEnabled && configuredDiscountPct > 0) {
    discountPercentage = configuredDiscountPct;
    discountType = "PREPAID";
    discountAmount = round(cleanSubtotal * (discountPercentage / 100));
  }

  // 2. FREE SHIPPING & SHIPPING CHARGES RULE
  // If "Enable Free Shipping Rule" is OFF:
  // - Shipping must ALWAYS be ₹0.
  // - Do NOT check any minimum order threshold.
  // - Do NOT apply any free shipping logic.
  const isFreeShippingRuleEnabled = options?.enableFreeShipping === true;
  const configuredFreeThreshold = options?.freeShippingThreshold ?? 0;
  const configuredFlatRate = options?.shippingFlatRate ?? 0;

  let shippingCharge = 0;
  let isFreeShipping = false;

  if (isFreeShippingRuleEnabled) {
    if (cleanSubtotal >= configuredFreeThreshold) {
      shippingCharge = 0;
      isFreeShipping = true;
    } else {
      shippingCharge = configuredFlatRate;
      isFreeShipping = false;
    }
  } else {
    // If OFF -> Shipping = ₹0
    shippingCharge = 0;
    isFreeShipping = false;
  }

  // 3. COD HANDLING FEE RULE
  // If "Enable COD Fee" is OFF:
  // - COD Fee = ₹0.
  const isCodFeeEnabled = options?.enableCodFee === true;
  let cleanCodFee = 0;
  if (!isPrepaid && isCodFeeEnabled) {
    cleanCodFee = round(Math.max(0, codFee));
  }

  // 4. GRAND TOTAL CALCULATION
  const finalAmount = round(
    cleanSubtotal - discountAmount + shippingCharge + cleanTax + cleanCodFee
  );

  return {
    subtotal: cleanSubtotal,
    discountType,
    discountPercentage,
    discountAmount,
    shippingCharge: round(shippingCharge),
    isFreeShipping,
    tax: cleanTax,
    codFee: cleanCodFee,
    finalAmount,
    grandTotal: finalAmount,
  };
}
