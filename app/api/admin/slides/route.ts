import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { saveSlides } from "@/lib/slides";
import { logAction } from "@/lib/auditLogger";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (error: any) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body)) {
    return NextResponse.json({ error: "Expected an array of slides" }, { status: 400 });
  }

  try {
    const success = await saveSlides(body);
    if (!success) throw new Error("Failed to persist slides");

    await logAction("Update Hero Slides", `Admin updated ${body.length} hero slider slides`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/admin/slides failed:", error);
    return NextResponse.json({ error: "Failed to save slides: " + error.message }, { status: 500 });
  }
}
