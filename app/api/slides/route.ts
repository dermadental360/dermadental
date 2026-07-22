import { NextRequest, NextResponse } from "next/server";
import { getSlides } from "@/lib/slides";

export async function GET() {
  try {
    const slides = await getSlides();
    return NextResponse.json(slides);
  } catch (error: any) {
    console.error("GET /api/slides failed:", error);
    return NextResponse.json({ error: "Failed to fetch hero slides" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
