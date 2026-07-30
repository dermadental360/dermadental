import { prisma } from "./prisma";

export interface CartItemInput {
  productId: string;
  category?: string;
  price: number;
  quantity: number;
}

export interface ValidateCouponInput {
  code: string;
  cartItems: CartItemInput[];
  subtotal: number;
  customerEmail?: string;
  customerPhone?: string;
}

export interface CouponValidationResult {
  valid: boolean;
  message?: string;
  discountAmount: number;
  coupon?: {
    id: string;
    code: string;
    discountType: string;
    discountValue: number;
  };
}

/**
 * Validate and calculate dynamic coupon discount
 */
export async function validateCoupon(input: ValidateCouponInput): Promise<CouponValidationResult> {
  const codeClean = input.code.trim().toUpperCase();
  if (!codeClean) {
    return { valid: false, message: "Coupon code is required", discountAmount: 0 };
  }

  const coupon = await prisma.coupon.findUnique({
    where: { code: codeClean },
    include: { usages: true },
  });

  if (!coupon) {
    return { valid: false, message: "Invalid coupon code", discountAmount: 0 };
  }

  if (!coupon.active) {
    return { valid: false, message: "This coupon is currently inactive", discountAmount: 0 };
  }

  const now = new Date();
  if (coupon.startDate && new Date(coupon.startDate) > now) {
    return { valid: false, message: "This coupon is not active yet", discountAmount: 0 };
  }

  if (coupon.expiryDate && new Date(coupon.expiryDate) < now) {
    return { valid: false, message: "This coupon has expired", discountAmount: 0 };
  }

  if (input.subtotal < coupon.minOrderAmount) {
    return {
      valid: false,
      message: `Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon`,
      discountAmount: 0,
    };
  }

  // Check global usage limit
  if (coupon.usageLimit !== null && coupon.usageLimit !== undefined && coupon.usageLimit > 0) {
    if (coupon.usages.length >= coupon.usageLimit) {
      return { valid: false, message: "This coupon usage limit has been reached", discountAmount: 0 };
    }
  }

  // Check per customer usage limit
  if (input.customerEmail) {
    const customerEmailClean = input.customerEmail.trim().toLowerCase();
    const customerUsages = coupon.usages.filter((u) => u.customerEmail.toLowerCase() === customerEmailClean);
    if (customerUsages.length >= coupon.usagePerCustomer) {
      return {
        valid: false,
        message: `You have already used this coupon the maximum allowed times (${coupon.usagePerCustomer})`,
        discountAmount: 0,
      };
    }

    // Customer specific validation
    if (coupon.applicableCustomerEmails && Array.isArray(coupon.applicableCustomerEmails)) {
      const allowedEmails = (coupon.applicableCustomerEmails as string[]).map((e) => e.toLowerCase().trim());
      if (allowedEmails.length > 0 && !allowedEmails.includes(customerEmailClean)) {
        return { valid: false, message: "This coupon is not valid for your account", discountAmount: 0 };
      }
    }

    // First order coupon validation
    if (coupon.firstOrderOnly) {
      const existingOrder = await prisma.order.findFirst({
        where: { customerEmail: { equals: customerEmailClean, mode: "insensitive" } },
      });
      if (existingOrder) {
        return { valid: false, message: "This coupon is valid only on your first order", discountAmount: 0 };
      }
    }
  }

  // Category and Product Specific filtering
  let eligibleSubtotal = input.subtotal;
  const applicableCategories = (coupon.applicableCategories as string[]) || [];
  const applicableProductIds = (coupon.applicableProductIds as string[]) || [];

  if (applicableCategories.length > 0 || applicableProductIds.length > 0) {
    eligibleSubtotal = 0;
    for (const item of input.cartItems) {
      const matchCat = applicableCategories.length === 0 || (item.category && applicableCategories.includes(item.category));
      const matchProd = applicableProductIds.length === 0 || applicableProductIds.includes(item.productId);
      if (matchCat && matchProd) {
        eligibleSubtotal += item.price * item.quantity;
      }
    }

    if (eligibleSubtotal <= 0) {
      return { valid: false, message: "Coupon is not applicable to the items in your cart", discountAmount: 0 };
    }
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon.discountType === "FLAT") {
    discountAmount = Math.min(coupon.discountValue, eligibleSubtotal);
  } else {
    // PERCENTAGE
    discountAmount = (eligibleSubtotal * coupon.discountValue) / 100;
    if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
    }
  }

  discountAmount = Math.round(discountAmount * 100) / 100;

  return {
    valid: true,
    discountAmount,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
    },
  };
}

/**
 * Record Coupon Usage after order placement
 */
export async function recordCouponUsage(couponId: string, orderId: string, customerEmail: string, customerPhone: string | null, discountAmount: number) {
  try {
    await prisma.couponUsage.create({
      data: {
        couponId,
        orderId,
        customerEmail: customerEmail.toLowerCase().trim(),
        customerPhone,
        discountAmount,
      },
    });
  } catch (err) {
    console.error("Failed to record coupon usage:", err);
  }
}
