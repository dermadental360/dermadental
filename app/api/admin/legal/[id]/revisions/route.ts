import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/auditLogger";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const revisions = await (prisma as any).legalPageRevision.findMany({
      where: { legalPageId: id },
      orderBy: { savedAt: "desc" },
      take: 30,
    });
    return NextResponse.json({ revisions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const body = await request.json();
    const { revisionId } = body;

    const revision = await (prisma as any).legalPageRevision.findUnique({
      where: { id: revisionId },
    });
    if (!revision || revision.legalPageId !== id) {
      return NextResponse.json({ error: "Revision not found" }, { status: 404 });
    }

    const page = await (prisma as any).legalPage.update({
      where: { id },
      data: {
        title: revision.title,
        content: revision.content,
        seoTitle: revision.seoTitle,
        seoDescription: revision.seoDescription,
        keywords: revision.keywords,
        ogTitle: revision.ogTitle,
        ogDescription: revision.ogDescription,
        ogImage: revision.ogImage,
        canonical: revision.canonical,
        isDraft: true,
        lastUpdated: new Date(),
        updatedAt: new Date(),
      },
    });

    await logAction("Restore Revision", `Restored revision v${revision.version} for legal page: ${page.title}`);
    return NextResponse.json({ page });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
