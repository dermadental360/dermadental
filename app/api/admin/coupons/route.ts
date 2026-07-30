import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();
    const coupons = await prisma.coupon.findMany({
      include: {
        usages: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = coupons.map((c) => {
      const totalUses = c.usages.length;
      const revenueGenerated = c.usages.reduce((sum, u) => sum + u.discountAmount, 0);
      const uniqueCustomers = new Set(c.usages.map((u) => u.customerEmail)).size;
      return {
        ...c,
        totalUses,
        revenueGenerated,
        uniqueCustomers,
      };
    });

    return NextResponse.json({ coupons: formatted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      startDate,
      expiryDate,
      usageLimit,
      usagePerCustomer,
      active,
      applicableCustomerEmails,
      applicableCategories,
      applicableProductIds,
      firstOrderOnly,
      birthdayOnly,
    } = body;

    if (!code || !discountValue) {
      return NextResponse.json({ error: "Code and Discount Value are required" }, { status: 400 });
    }

    const codeClean = code.trim().toUpperCase();

    const existing = await prisma.coupon.findUnique({
      where: { code: codeClean },
    });

    if (existing) {
      return NextResponse.json({ error: `Coupon code '${codeClean}' already exists.` }, { status: 400 });
    }

    const newCoupon = await prisma.coupon.create({
      data: {
        code: codeClean,
        discountType: discountType || "PERCENTAGE",
        discountValue: parseFloat(discountValue),
        minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : 0,
        maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
        startDate: startDate ? new Date(startDate) : new Date(),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        usageLimit: usageLimit ? parseInt(usageLimit, 10) : null,
        usagePerCustomer: usagePerCustomer ? parseInt(usagePerCustomer, 10) : 1,
        active: active !== undefined ? Boolean(active) : true,
        applicableCustomerEmails: applicableCustomerEmails || [],
        applicableCategories: applicableCategories || [],
        applicableProductIds: applicableProductIds || [],
        firstOrderOnly: Boolean(firstOrderOnly),
        birthdayOnly: Boolean(birthdayOnly),
      },
    });

    return NextResponse.json({ success: true, coupon: newCoupon });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create coupon" }, { status: 500 });
  }
}
