import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const updated = await prisma.coupon.update({
      where: { id },
      data: {
        ...(body.code && { code: body.code.trim().toUpperCase() }),
        ...(body.discountType && { discountType: body.discountType }),
        ...(body.discountValue !== undefined && { discountValue: parseFloat(body.discountValue) }),
        ...(body.minOrderAmount !== undefined && { minOrderAmount: parseFloat(body.minOrderAmount) }),
        ...(body.maxDiscountAmount !== undefined && { maxDiscountAmount: body.maxDiscountAmount ? parseFloat(body.maxDiscountAmount) : null }),
        ...(body.startDate && { startDate: new Date(body.startDate) }),
        ...(body.expiryDate !== undefined && { expiryDate: body.expiryDate ? new Date(body.expiryDate) : null }),
        ...(body.usageLimit !== undefined && { usageLimit: body.usageLimit ? parseInt(body.usageLimit, 10) : null }),
        ...(body.usagePerCustomer !== undefined && { usagePerCustomer: parseInt(body.usagePerCustomer, 10) }),
        ...(body.active !== undefined && { active: Boolean(body.active) }),
        ...(body.applicableCustomerEmails !== undefined && { applicableCustomerEmails: body.applicableCustomerEmails }),
        ...(body.applicableCategories !== undefined && { applicableCategories: body.applicableCategories }),
        ...(body.applicableProductIds !== undefined && { applicableProductIds: body.applicableProductIds }),
        ...(body.firstOrderOnly !== undefined && { firstOrderOnly: Boolean(body.firstOrderOnly) }),
        ...(body.birthdayOnly !== undefined && { birthdayOnly: Boolean(body.birthdayOnly) }),
      },
    });

    return NextResponse.json({ success: true, coupon: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update coupon" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.coupon.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete coupon" }, { status: 500 });
  }
}
