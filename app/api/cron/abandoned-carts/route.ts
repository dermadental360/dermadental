import { NextRequest, NextResponse } from "next/server";
import { processAbandonedCartReminders } from "@/lib/abandonedCart";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const result = await processAbandonedCartReminders();
    return NextResponse.json({
      success: true,
      message: "Abandoned cart reminders batch processed successfully.",
      ...result,
    });
  } catch (error: any) {
    console.error("Cron abandoned cart error:", error);
    return NextResponse.json({ error: error.message || "Failed to process abandoned cart reminders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
