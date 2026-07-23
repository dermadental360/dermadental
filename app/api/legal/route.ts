import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const pages = await (prisma as any).legalPage.findMany({
      where: { published: true },
      select: { id: true, title: true, slug: true, lastUpdated: true, updatedAt: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ pages });
  } catch (err) {
    console.error("GET /api/legal failed:", err);
    return NextResponse.json({ pages: [] });
  }
}
