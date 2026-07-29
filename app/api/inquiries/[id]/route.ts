import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAction } from "@/lib/auditLogger";

export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch (error: any) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.inquiry.delete({
      where: { id }
    });
    await logAction("Delete Inquiry", `Inquiry ID "${id}" was deleted by Administrator.`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`DELETE /api/inquiries/${id} error:`, error?.message || error);
    return NextResponse.json({ error: "Failed to delete inquiry from database" }, { status: 500 });
  }
}

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

  const { status } = body;

  try {
    const updated = await prisma.inquiry.update({
      where: { id },
      data: { status: status || "Resolved" }
    });
    await logAction("Update Inquiry", `Inquiry ID "${id}" status updated to "${status || 'Resolved'}".`);
    return NextResponse.json({ success: true, inquiry: { ...updated, _id: updated.id } });
  } catch (error: any) {
    console.error(`PUT /api/inquiries/${id} error:`, error?.message || error);
    return NextResponse.json({ error: "Failed to update inquiry status" }, { status: 500 });
  }
}
