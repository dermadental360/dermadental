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

/**
 * Centralized Pricing Calculator
 * Computes subtotal, 5% prepaid discount, shipping, tax, COD fees, and final grand total.
 * Standardizes rounding to 2 decimal places.
 */
export function calculatePricingDetails(
  subtotal: number,
  isPrepaid: boolean,
  codFee: number = 0,
  tax: number = 0
): PricingBreakdown {
  const round = (val: number) => Math.round((val + Number.EPSILON) * 100) / 100;

  const cleanSubtotal = round(Math.max(0, subtotal));
  const cleanTax = round(Math.max(0, tax));
  
  // 5% discount ONLY for prepaid payment methods
  const discountPercentage = isPrepaid ? 5 : 0;
  const discountType = isPrepaid ? "PREPAID" : null;
  const discountAmount = isPrepaid ? round(cleanSubtotal * 0.05) : 0;

  const shippingInfo = calculateShippingDetails(cleanSubtotal);
  const shippingCharge = round(shippingInfo.shippingCharge);
  
  const cleanCodFee = !isPrepaid ? round(Math.max(0, codFee)) : 0;

  const finalAmount = round(
    cleanSubtotal - discountAmount + shippingCharge + cleanTax + cleanCodFee
  );

  return {
    subtotal: cleanSubtotal,
    discountType,
    discountPercentage,
    discountAmount,
    shippingCharge,
    isFreeShipping: shippingInfo.isFree,
    tax: cleanTax,
    codFee: cleanCodFee,
    finalAmount,
    grandTotal: finalAmount,
  };
}
