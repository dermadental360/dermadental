import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { setSetting, SettingKey } from "@/lib/settings";
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

  try {
    const keys = Object.keys(body) as SettingKey[];
    for (const key of keys) {
      if (typeof body[key] === "string") {
        await setSetting(key, body[key]);
      }
    }

    await logAction("Update Site Settings", `Admin updated site configuration keys: ${keys.join(", ")}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/admin/settings failed:", error);
    return NextResponse.json({ error: "Failed to save settings: " + error.message }, { status: 500 });
  }
}
