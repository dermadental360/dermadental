import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/auditLogger";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch (error: any) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const { _id, id: rawId, createdAt, updatedAt, __v, ...updateData } = body;

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: updateData.name,
        brand: updateData.brand,
        category: updateData.category,
        subcategory: updateData.subcategory,
        concerns: Array.isArray(updateData.concerns) ? updateData.concerns : undefined,
        price: updateData.price !== undefined ? Number(updateData.price) : undefined,
        discountedPrice: updateData.discountedPrice !== undefined ? Number(updateData.discountedPrice) : undefined,
        stock: updateData.stock !== undefined ? Number(updateData.stock) : undefined,
        description: updateData.description,
        usage: updateData.usage,
        ingredients: updateData.ingredients,
        images: Array.isArray(updateData.images) ? updateData.images : undefined,
        published: updateData.published !== undefined ? Boolean(updateData.published) : undefined,
        featured: updateData.featured !== undefined ? Boolean(updateData.featured) : undefined
      }
    });

    await logAction("Update Product", `Product "${product.name}" details updated by Administrator.`);
    
    return NextResponse.json({
      ...product,
      _id: product.id,
      concerns: typeof product.concerns === "string" ? JSON.parse(product.concerns) : product.concerns,
      images: typeof product.images === "string" ? JSON.parse(product.images) : product.images
    });
  } catch (error: any) {
    console.error("PUT /api/products/[id] failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update product details." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch (error: any) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.product.delete({
      where: { id }
    });
    await logAction("Delete Product", `Product ID "${id}" was deleted from the catalog.`);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("DELETE /api/products/[id] failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete product from database." },
      { status: 500 }
    );
  }
}
