import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const page = await (prisma as any).legalPage.findFirst({
      where: { slug, published: true },
    });
    if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ page });
  } catch (err) {
    console.error(`GET /api/legal/${slug} failed:`, err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
