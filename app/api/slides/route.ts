import { NextRequest, NextResponse } from "next/server";
import { getSlides } from "@/lib/slides";

export async function GET() {
  try {
    const slides = await getSlides();
    return NextResponse.json(slides, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600"
      }
    });
  } catch (error: any) {
    console.error("GET /api/slides failed:", error);
    return NextResponse.json({ error: "Failed to fetch hero slides" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
