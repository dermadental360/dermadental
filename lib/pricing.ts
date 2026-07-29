import { calculateShippingDetails } from "./constants";

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
 * Centralized Pricing Calculator
 * Computes subtotal, dynamic prepaid discount %, shipping, tax, COD fees, and final grand total.
 * Dynamically evaluates Admin settings when options are provided.
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
  
  // Evaluate Prepaid Discount Rule
  const isPrepaidDiscountAllowed = options?.enablePrepaidDiscount !== false;
  const configuredDiscountPct = options?.prepaidDiscountPercentage ?? 5;
  const discountPercentage = (isPrepaid && isPrepaidDiscountAllowed) ? configuredDiscountPct : 0;
  const discountType = (isPrepaid && isPrepaidDiscountAllowed && discountPercentage > 0) ? "PREPAID" : null;
  const discountAmount = discountPercentage > 0 ? round(cleanSubtotal * (discountPercentage / 100)) : 0;

  // Evaluate Shipping Rule
  const isFreeShippingAllowed = options?.enableFreeShipping !== false;
  const configuredFreeThreshold = options?.freeShippingThreshold ?? 999;
  const configuredFlatRate = options?.shippingFlatRate ?? 99;

  let shippingCharge = configuredFlatRate;
  let isFreeShipping = false;

  if (isFreeShippingAllowed && cleanSubtotal >= configuredFreeThreshold) {
    shippingCharge = 0;
    isFreeShipping = true;
  }

  const cleanCodFee = (!isPrepaid && options?.enableCodFee !== false) ? round(Math.max(0, codFee)) : 0;

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
