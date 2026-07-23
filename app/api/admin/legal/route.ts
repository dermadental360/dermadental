import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/legal";
import { logAction } from "@/lib/auditLogger";

function genId() {
  return "c" + Math.random().toString(36).substr(2, 20) + Date.now().toString(36);
}

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const pages = await (prisma as any).legalPage.findMany({
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ pages });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { title, slug, content = "", seoTitle = "", seoDescription = "", keywords = "", ogTitle = "", ogDescription = "", ogImage = "", canonical = "" } = body;
    if (!title || !slug) return NextResponse.json({ error: "Title and slug required" }, { status: 400 });

    const cleanContent = sanitizeHtml(content);
    const now = new Date();
    const page = await (prisma as any).legalPage.create({
      data: {
        id: genId(),
        title,
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        content: cleanContent,
        seoTitle,
        seoDescription,
        keywords,
        ogTitle,
        ogDescription,
        ogImage,
        canonical,
        published: false,
        isDraft: true,
        version: 1,
        lastUpdated: now,
        createdAt: now,
        updatedAt: now,
      },
    });
    await logAction("Create Legal Page", `Created legal page: ${title} (/${slug})`);
    return NextResponse.json({ page }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/admin/legal failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
