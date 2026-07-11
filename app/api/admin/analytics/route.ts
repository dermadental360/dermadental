import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();
  } catch (error: any) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cutoff = new Date(Date.now() - 60 * 1000); // last 60 seconds
    const count = await prisma.visitor.count({
      where: { lastActive: { gte: cutoff } }
    });

    return NextResponse.json({ activeVisitors: count || 1 });
  } catch (error: any) {
    console.error("GET /api/admin/analytics failed, using fallback:", error);
    return NextResponse.json({ activeVisitors: 1 });
  }
}
