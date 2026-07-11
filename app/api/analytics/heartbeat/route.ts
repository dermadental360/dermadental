import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { visitorId } = body;
  if (!visitorId) {
    return NextResponse.json({ error: "Missing visitorId" }, { status: 400 });
  }

  try {
    await prisma.visitor.upsert({
      where: { visitorId },
      update: { lastActive: new Date() },
      create: { visitorId, lastActive: new Date() }
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/analytics/heartbeat failed, failing silently:", error);
    return NextResponse.json({ success: true });
  }
}
