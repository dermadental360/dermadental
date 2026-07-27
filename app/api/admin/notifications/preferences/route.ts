import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    let pref = await prisma.notificationPreference.findFirst({
      where: { adminEmail: "admin" }
    });

    if (!pref) {
      pref = await prisma.notificationPreference.create({
        data: { adminEmail: "admin" }
      });
    }

    return NextResponse.json(pref);
  } catch (error: any) {
    console.error("GET /api/admin/notifications/preferences error:", error);
    // Return default preference object fallback
    return NextResponse.json({
      id: "default",
      adminEmail: "admin",
      enableOrders: true,
      enableSales: true,
      enableReviews: true,
      enableCustomers: true,
      enableInventory: true,
      enableInquiries: true,
      enableProducts: true,
      enableSystemAlerts: true,
      enableAdminActivity: true,
      enableSound: true,
      enableDesktopPopups: true,
      lowStockThreshold: 10
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const existing = await prisma.notificationPreference.findFirst({
      where: { adminEmail: "admin" }
    });

    let pref;
    if (existing) {
      pref = await prisma.notificationPreference.update({
        where: { id: existing.id },
        data: {
          enableOrders: typeof body.enableOrders === "boolean" ? body.enableOrders : existing.enableOrders,
          enableSales: typeof body.enableSales === "boolean" ? body.enableSales : existing.enableSales,
          enableReviews: typeof body.enableReviews === "boolean" ? body.enableReviews : existing.enableReviews,
          enableCustomers: typeof body.enableCustomers === "boolean" ? body.enableCustomers : existing.enableCustomers,
          enableInventory: typeof body.enableInventory === "boolean" ? body.enableInventory : existing.enableInventory,
          enableInquiries: typeof body.enableInquiries === "boolean" ? body.enableInquiries : existing.enableInquiries,
          enableProducts: typeof body.enableProducts === "boolean" ? body.enableProducts : existing.enableProducts,
          enableSystemAlerts: typeof body.enableSystemAlerts === "boolean" ? body.enableSystemAlerts : existing.enableSystemAlerts,
          enableAdminActivity: typeof body.enableAdminActivity === "boolean" ? body.enableAdminActivity : existing.enableAdminActivity,
          enableSound: typeof body.enableSound === "boolean" ? body.enableSound : existing.enableSound,
          enableDesktopPopups: typeof body.enableDesktopPopups === "boolean" ? body.enableDesktopPopups : existing.enableDesktopPopups,
          lowStockThreshold: typeof body.lowStockThreshold === "number" ? body.lowStockThreshold : existing.lowStockThreshold
        }
      });
    } else {
      pref = await prisma.notificationPreference.create({
        data: {
          adminEmail: "admin",
          ...body
        }
      });
    }

    return NextResponse.json({ success: true, preferences: pref });
  } catch (error: any) {
    console.error("PUT /api/admin/notifications/preferences error:", error);
    return NextResponse.json({ error: "Failed to update notification settings." }, { status: 500 });
  }
}
