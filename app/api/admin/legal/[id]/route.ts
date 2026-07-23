import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/legal";
import { logAction } from "@/lib/auditLogger";

function genId() {
  return "c" + Math.random().toString(36).substr(2, 20) + Date.now().toString(36);
}

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const page = await (prisma as any).legalPage.findUnique({ where: { id } });
    if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ page });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const body = await request.json();
    const { title, content, seoTitle = "", seoDescription = "", keywords = "", ogTitle = "", ogDescription = "", ogImage = "", canonical = "", isDraft = true } = body;

    const existing = await (prisma as any).legalPage.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const cleanContent = sanitizeHtml(content || existing.content);
    const newVersion = existing.version + 1;
    const now = new Date();

    // Save revision of previous state
    await (prisma as any).legalPageRevision.create({
      data: {
        id: genId(),
        legalPageId: id,
        title: existing.title,
        content: existing.content,
        seoTitle: existing.seoTitle,
        seoDescription: existing.seoDescription,
        keywords: existing.keywords,
        ogTitle: existing.ogTitle,
        ogDescription: existing.ogDescription,
        ogImage: existing.ogImage,
        canonical: existing.canonical,
        version: existing.version,
        savedAt: now,
      },
    });

    const page = await (prisma as any).legalPage.update({
      where: { id },
      data: {
        title: title || existing.title,
        content: cleanContent,
        seoTitle,
        seoDescription,
        keywords,
        ogTitle,
        ogDescription,
        ogImage,
        canonical,
        isDraft,
        version: newVersion,
        lastUpdated: now,
        updatedAt: now,
      },
    });

    await logAction("Update Legal Page", `Updated legal page: ${page.title} (v${newVersion})`);
    return NextResponse.json({ page });
  } catch (err: any) {
    console.error("PUT /api/admin/legal/[id] failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const page = await (prisma as any).legalPage.findUnique({ where: { id } });
    if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await (prisma as any).legalPage.delete({ where: { id } });
    await logAction("Delete Legal Page", `Deleted legal page: ${page.title} (/${page.slug})`);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
