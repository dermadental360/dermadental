import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProduct, getFrequentlyBoughtTogether } from "@/lib/products";
import { demoProducts } from "@/lib/demo";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    // Check manual setting
    const key = `fbt_${productId}`;
    const setting = await prisma.setting.findUnique({ where: { key } }).catch(() => null);
    
    let manualIds: string[] = [];
    if (setting?.value) {
      try {
        manualIds = JSON.parse(setting.value);
      } catch {
        manualIds = [];
      }
    }

    const fbtProducts = await getFrequentlyBoughtTogether(productId, 3);

    return NextResponse.json({
      productId,
      manualIds,
      products: fbtProducts,
    });
  } catch (error: any) {
    console.error("GET /api/admin/products/frequently-bought error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch FBT items" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, assignedIds } = body;

    if (!productId || !Array.isArray(assignedIds)) {
      return NextResponse.json({ error: "productId and assignedIds array are required" }, { status: 400 });
    }

    // Filter out productId if accidentally included, and cap at 3 products
    const validIds = assignedIds
      .map((id: any) => String(id).trim())
      .filter((id: string) => id.length > 0 && id !== productId)
      .slice(0, 3);

    const key = `fbt_${productId}`;
    const value = JSON.stringify(validIds);

    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    // Fetch full product objects for response
    const products = [];
    for (const id of validIds) {
      const p = await getProduct(id);
      if (p) products.push(p);
      else {
        const demoP = demoProducts.find((dp) => dp._id === id);
        if (demoP) products.push(demoP);
      }
    }

    return NextResponse.json({
      success: true,
      productId,
      assignedIds: validIds,
      products,
    });
  } catch (error: any) {
    console.error("POST /api/admin/products/frequently-bought error:", error);
    return NextResponse.json({ error: error.message || "Failed to update FBT items" }, { status: 500 });
  }
}
