import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/auditLogger";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (error: any) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let colors;
  try {
    colors = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    await prisma.setting.upsert({
      where: { key: "site_theme_colors" },
      update: { value: JSON.stringify(colors) },
      create: { key: "site_theme_colors", value: JSON.stringify(colors) },
    });

    await logAction("Update Theme Colors", "Admin updated site color palette configuration.");
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/admin/theme failed:", error);
    return NextResponse.json({ error: "Failed to save theme: " + error.message }, { status: 500 });
  }
}
