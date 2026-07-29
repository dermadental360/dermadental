import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
  } catch (error: any) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100
    });
    const plainLogs = logs.map(l => ({
      _id: l.id,
      id: l.id,
      action: l.action,
      details: l.details,
      timestamp: l.timestamp.toISOString()
    }));

    return NextResponse.json(plainLogs);
  } catch (error: any) {
    console.error("GET /api/admin/logs error:", error?.message || error);
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}
