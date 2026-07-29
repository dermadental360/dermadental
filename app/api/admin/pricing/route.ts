import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/auditLogger";
import { setSetting, SettingKey } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            "free_shipping_threshold",
            "shipping_flat_rate",
            "prepaid_discount_percentage",
            "cod_fee",
            "enable_prepaid_discount",
            "enable_free_shipping",
            "enable_cod_fee"
          ]
        }
      }
    });

    const map = new Map(settings.map(s => [s.key, s.value]));

    return NextResponse.json({
      freeShippingThreshold: Number(map.get("free_shipping_threshold") || "999"),
      shippingFlatRate: Number(map.get("shipping_flat_rate") || "99"),
      prepaidDiscountPercentage: Number(map.get("prepaid_discount_percentage") || "5"),
      codFee: Number(map.get("cod_fee") || "0"),
      enablePrepaidDiscount: map.get("enable_prepaid_discount") !== "false",
      enableFreeShipping: map.get("enable_free_shipping") !== "false",
      enableCodFee: map.get("enable_cod_fee") === "true"
    });
  } catch (error: any) {
    console.error("GET /api/admin/pricing error:", error);
    return NextResponse.json({ error: "Failed to load pricing settings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const updates: { key: SettingKey; value: string }[] = [
      { key: "free_shipping_threshold", value: String(body.freeShippingThreshold ?? 999) },
      { key: "shipping_flat_rate", value: String(body.shippingFlatRate ?? 99) },
      { key: "prepaid_discount_percentage", value: String(body.prepaidDiscountPercentage ?? 5) },
      { key: "cod_fee", value: String(body.codFee ?? 0) },
      { key: "enable_prepaid_discount", value: String(body.enablePrepaidDiscount !== false) },
      { key: "enable_free_shipping", value: String(body.enableFreeShipping !== false) },
      { key: "enable_cod_fee", value: String(body.enableCodFee === true) }
    ];

    for (const item of updates) {
      await setSetting(item.key, item.value);
    }

    await logAction(
      "Update Pricing Settings",
      `Pricing settings updated by admin: Free Shipping > ₹${body.freeShippingThreshold}, Flat Rate: ₹${body.shippingFlatRate}, Prepaid Discount: ${body.prepaidDiscountPercentage}%, COD Fee: ₹${body.codFee}.`
    );

    return NextResponse.json({ success: true, message: "Pricing and shipping settings updated successfully." });
  } catch (error: any) {
    console.error("POST /api/admin/pricing error:", error);
    return NextResponse.json({ error: "Failed to save pricing settings" }, { status: 500 });
  }
}
