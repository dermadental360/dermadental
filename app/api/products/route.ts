import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { demoProducts } from "@/lib/demo";
import { logAction } from "@/lib/auditLogger";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" }
    });
    const formatted = products.map(p => ({
      _id: p.id,
      name: p.name,
      brand: p.brand,
      category: p.category,
      subcategory: p.subcategory || "",
      concerns: typeof p.concerns === "string" ? JSON.parse(p.concerns) : p.concerns,
      price: p.price,
      discountedPrice: p.discountedPrice,
      stock: p.stock,
      description: p.description,
      usage: p.usage,
      ingredients: p.ingredients,
      images: typeof p.images === "string" ? JSON.parse(p.images) : p.images,
      published: p.published,
      featured: p.featured,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString()
    }));
    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("GET /api/products failed:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch products" }, { status: 500 });
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

  try {
    const concerns = Array.isArray(body.concerns) ? body.concerns : [];
    const images = Array.isArray(body.images) ? body.images : [];

    const product = await prisma.product.create({
      data: {
        name: body.name,
        brand: body.brand,
        category: body.category,
        subcategory: body.subcategory || "",
        concerns: concerns,
        price: Number(body.price),
        discountedPrice: Number(body.discountedPrice),
        stock: Number(body.stock),
        description: body.description || "",
        usage: body.usage || "",
        ingredients: body.ingredients || "",
        images: images,
        published: body.published !== false,
        featured: body.featured === true
      }
    });

    await logAction("Create Product", `Product "${body.name}" (${body.brand}) created successfully with price ₹${body.price}.`);
    
    return NextResponse.json({
      ...product,
      _id: product.id,
      concerns,
      images
    });
  } catch (error: any) {
    console.error("POST /api/products failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save product details to database." },
      { status: 500 }
    );
  }
}
