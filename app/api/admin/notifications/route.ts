import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const unreadOnly = searchParams.get("unreadOnly") === "true";
  const category = searchParams.get("category");
  const priority = searchParams.get("priority");
  const type = searchParams.get("type");
  const q = searchParams.get("q");
  const format = searchParams.get("format");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const skip = (page - 1) * limit;

  try {
    const where: any = {};
    if (unreadOnly) where.isRead = false;
    
    if (category && category !== "ALL" && category !== "all") {
      where.category = category.toUpperCase();
    } else if (type && type !== "ALL" && type !== "all") {
      where.type = type.toUpperCase();
    }

    if (priority && priority !== "ALL" && priority !== "all") {
      where.priority = priority.toUpperCase();
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (q) {
      where.OR = [
        { title: { contains: q } },
        { message: { contains: q } },
        { orderId: { contains: q } }
      ];
    }

    // CSV Export Handler
    if (format === "csv") {
      const allNotifs = await prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" }
      });

      const csvRows = [
        ["ID", "Title", "Message", "Category", "Priority", "Status", "Link", "Created At"],
        ...allNotifs.map(n => [
          n.id,
          `"${n.title.replace(/"/g, '""')}"`,
          `"${n.message.replace(/"/g, '""')}"`,
          n.category || n.type,
          n.priority || "MEDIUM",
          n.isRead ? "READ" : "UNREAD",
          n.link || "",
          n.createdAt.toISOString()
        ])
      ];

      const csvContent = csvRows.map(r => r.join(",")).join("\n");
      return new Response(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename=notifications-export-${Date.now()}.csv`
        }
      });
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
      return NextResponse.json({ success: true, message: "Selected notifications marked as read." });
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
    const deleteAll = searchParams.get("deleteAll") === "true";

    if (deleteAll) {
      await prisma.notification.deleteMany({});
      return NextResponse.json({ success: true, message: "All notifications deleted." });
    }

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
