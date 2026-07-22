import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_THEME_COLORS, ThemeColors } from "@/lib/theme";

export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "site_theme_colors" },
    });
    if (setting && setting.value) {
      const colors: ThemeColors = JSON.parse(setting.value);
      return NextResponse.json(colors);
    }
  } catch (err) {
    console.warn("Failed to fetch theme colors from DB:", err);
  }
  return NextResponse.json(DEFAULT_THEME_COLORS);
}

export const dynamic = "force-dynamic";
