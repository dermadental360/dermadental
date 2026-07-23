import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/auditLogger";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const existing = await (prisma as any).legalPage.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const newPublished = !existing.published;
    const page = await (prisma as any).legalPage.update({
      where: { id },
      data: {
        published: newPublished,
        isDraft: newPublished ? false : existing.isDraft,
        updatedAt: new Date(),
      },
    });

    await logAction(
      newPublished ? "Publish Legal Page" : "Unpublish Legal Page",
      `${newPublished ? "Published" : "Unpublished"} legal page: ${page.title}`
    );
    return NextResponse.json({ page, published: newPublished });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
