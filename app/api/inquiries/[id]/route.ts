import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { fallbackStore } from "@/lib/fallbackStore";
import { logAction } from "@/lib/auditLogger";

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
  } catch (error) {
    console.warn("Failed to delete inquiry in SQLite, falling back to memory:", error);
    fallbackStore.inquiries = fallbackStore.inquiries.filter((inq: any) => inq._id !== id);
    await logAction("Delete Inquiry", `Inquiry ID "${id}" was deleted by Administrator (Offline).`);
    return NextResponse.json({ success: true });
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
    await prisma.inquiry.update({
      where: { id },
      data: { status }
    });
    await logAction("Update Inquiry", `Inquiry ID "${id}" status updated to "${status}".`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.warn("Failed to update inquiry in SQLite, falling back to memory:", error);
    const inq = fallbackStore.inquiries.find((x: any) => x._id === id);
    if (inq) {
      inq.status = status;
    }
    await logAction("Update Inquiry", `Inquiry ID "${id}" status updated to "${status}" (Offline).`);
    return NextResponse.json({ success: true });
  }
}
