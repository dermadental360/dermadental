import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/auditLogger";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (error: any) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: "desc" },
    });

    const products = await prisma.product.findMany({
      select: { id: true, name: true, brand: true },
    });

    const productMap = new Map(products.map((p) => [p.id, `${p.brand} - ${p.name}`]));

    const formatted = reviews.map((r) => ({
      ...r,
      productName: productMap.get(r.productId) || "Unknown Product",
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("GET /api/admin/reviews failed:", error);
    return NextResponse.json({ error: "Failed to fetch admin reviews" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (error: any) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { productId, userName, userEmail, userAvatar, rating, comment, approved } = body;

  if (!productId || !userName || rating === undefined || !comment) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const review = await prisma.review.create({
      data: {
        productId,
        userName,
        userEmail: userEmail || null,
        userAvatar: userAvatar || null,
        rating: Number(rating),
        comment,
        approved: approved === true,
      },
    });

    await logAction(
      "Create Review Admin",
      `Review from "${userName}" was created by admin for product ID: ${productId}.`
    );

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    console.error("POST /api/admin/reviews failed:", error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (error: any) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { id, productId, userName, userEmail, userAvatar, rating, comment, approved } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing review ID" }, { status: 400 });
  }

  try {
    const updateData: any = {};
    if (productId !== undefined) updateData.productId = productId;
    if (userName !== undefined) updateData.userName = userName;
    if (userEmail !== undefined) updateData.userEmail = userEmail || null;
    if (userAvatar !== undefined) updateData.userAvatar = userAvatar || null;
    if (rating !== undefined) updateData.rating = Number(rating);
    if (comment !== undefined) updateData.comment = comment;
    if (approved !== undefined) updateData.approved = approved === true;

    const review = await prisma.review.update({
      where: { id },
      data: updateData,
    });

    await logAction(
      "Update Review",
      `Review ID ${id} from "${review.userName}" was updated by admin.`
    );

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    console.error("PUT /api/admin/reviews failed:", error);
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (error: any) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing review ID" }, { status: 400 });
  }

  try {
    const review = await prisma.review.delete({
      where: { id },
    });

    await logAction(
      "Delete Review",
      `Review from "${review.userName}" for product ID: ${review.productId} was permanently deleted.`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/admin/reviews failed:", error);
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }
}
