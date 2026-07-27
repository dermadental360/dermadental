import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const unreadOnly = searchParams.get("unreadOnly") === "true";
  const type = searchParams.get("type");
  const q = searchParams.get("q");

  const skip = (page - 1) * limit;

  try {
    const where: any = {};
    if (unreadOnly) where.isRead = false;
    if (type && type !== "ALL") where.type = type;
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { message: { contains: q } },
        { orderId: { contains: q } }
      ];
    }

    const [notifications, totalCount, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: skip
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { isRead: false } })
    ]);

    return NextResponse.json({
      notifications,
      totalCount,
      unreadCount,
      page,
      totalPages: Math.ceil(totalCount / limit) || 1
    });
  } catch (error: any) {
    console.error("GET /api/admin/notifications error:", error?.message || error);
    return NextResponse.json({ notifications: [], totalCount: 0, unreadCount: 0, page: 1, totalPages: 1 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ids, markAllRead } = body;

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: { isRead: false },
        data: { isRead: true }
      });
      return NextResponse.json({ success: true, message: "All notifications marked as read." });
    }

    if (Array.isArray(ids) && ids.length > 0) {
      await prisma.notification.updateMany({
        where: { id: { in: ids } },
        data: { isRead: true }
      });
      return NextResponse.json({ success: true, message: "Notifications marked as read." });
    }

    if (id) {
      await prisma.notification.update({
        where: { id },
        data: { isRead: true }
      });
      return NextResponse.json({ success: true, message: "Notification marked as read." });
    }

    return NextResponse.json({ error: "Invalid notification update payload." }, { status: 400 });
  } catch (error: any) {
    console.error("PUT /api/admin/notifications error:", error?.message || error);
    return NextResponse.json({ error: "Failed to update notification status." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    let body: any = {};
    try {
      body = await request.json();
    } catch {}

    const idsToDelete = body.ids || (id ? [id] : []);

    if (idsToDelete.length === 0) {
      return NextResponse.json({ error: "No notification ID provided for deletion." }, { status: 400 });
    }

    await prisma.notification.deleteMany({
      where: { id: { in: idsToDelete } }
    });

    return NextResponse.json({ success: true, message: "Notification(s) deleted successfully." });
  } catch (error: any) {
    console.error("DELETE /api/admin/notifications error:", error?.message || error);
    return NextResponse.json({ error: "Failed to delete notification(s)." }, { status: 500 });
  }
}
