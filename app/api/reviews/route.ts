import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });
    }

    const reviews = await prisma.review.findMany({
      where: {
        productId,
        approved: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(reviews);
  } catch (error: any) {
    console.error("GET /api/reviews failed:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { productId, userName, userEmail, rating, comment, userAvatar } = body;

    if (!productId || !userName || !rating || !comment) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const parsedRating = parseInt(rating, 10);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        productId,
        userName,
        userEmail: userEmail || null,
        userAvatar: userAvatar || null,
        rating: parsedRating,
        comment,
        approved: false, // Defaults to pending approval
      },
    });


    // Create DB Notification & Broadcast real-time event
    try {
      const notification = await prisma.notification.create({
        data: {
          title: "⭐ New Product Review",
          message: `New ${parsedRating}-star review submitted by ${userName} for product #${productId}.`,
          type: "SYSTEM",
          isRead: false
        }
      });

      const { broadcastAdminEvent } = await import("@/lib/eventBus");
      broadcastAdminEvent("REVIEW_NEW", review);
      broadcastAdminEvent("NOTIFICATION_NEW", notification);
    } catch (err) {
      console.warn("Failed to create notification/event for review:", err);
      try {
        const { broadcastAdminEvent } = await import("@/lib/eventBus");
        broadcastAdminEvent("REVIEW_NEW", review);
      } catch {}
    }

    return NextResponse.json({
      success: true,
      message: "Review submitted successfully and is pending approval.",
      review,
    });
  } catch (error: any) {
    console.error("POST /api/reviews failed:", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
