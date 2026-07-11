import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const FAKE_REVIEWS_POOL = [
  {
    userName: "Dr. Aisha Rao",
    userEmail: "aisha.rao@example.com",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120&h=120",
    rating: 5,
    comment: "Absolutely phenomenal quality. Highly recommended for daily dermatology-grade care routines.",
  },
  {
    userName: "Rohit Sharma",
    userEmail: "rohit.s@example.com",
    userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120&h=120",
    rating: 4,
    comment: "Very lightweight, non-greasy, and absorbs extremely quickly. Perfect for daily wear under makeup or alone.",
  },
  {
    userName: "Meera K.",
    userEmail: "meera.k@example.com",
    userAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=120&h=120",
    rating: 5,
    comment: "This has completely transformed my daily routine. My acne scars and spots cleared up in just three weeks. Highly recommended!",
  },
  {
    userName: "Aditya Sen",
    userEmail: "aditya.sen@example.com",
    userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120&h=120",
    rating: 5,
    comment: "My dermatologist suggested this brand, and it did not disappoint. Safe, clean formulation, and no irritation.",
  },
  {
    userName: "Priyanka N.",
    userEmail: "priyanka@example.com",
    userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120&h=120",
    rating: 5,
    comment: "Nourishes the skin barrier beautifully. Safe for sensitive skin types, and leaves a gorgeous, natural healthy glow.",
  },
  {
    userName: "Vikram Malhotra",
    userEmail: "vikram@example.com",
    userAvatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=120&h=120",
    rating: 4,
    comment: "Consistency is key, but I saw visible improvement within four weeks. Worth every rupee.",
  },
];

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (error: any) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const products = await prisma.product.findMany();

    if (products.length === 0) {
      return NextResponse.json({
        error: "No products found in the database. Please add products first before seeding reviews.",
      }, { status: 400 });
    }

    // Delete existing reviews to clean slate
    await prisma.review.deleteMany();

    const createdReviews = [];

    // Seed 2 reviews for each product
    for (const product of products) {
      // Pick 2 random reviews from the pool
      const shuffled = [...FAKE_REVIEWS_POOL].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 2);

      for (const fakeReview of selected) {
        const review = await prisma.review.create({
          data: {
            productId: product.id,
            userName: fakeReview.userName,
            userEmail: fakeReview.userEmail,
            userAvatar: fakeReview.userAvatar,
            rating: fakeReview.rating,
            comment: fakeReview.comment,
            approved: true, // Auto-approve seeded reviews
          },
        });
        createdReviews.push(review);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${createdReviews.length} reviews for ${products.length} products.`,
    });
  } catch (error: any) {
    console.error("Seeding reviews failed:", error);
    return NextResponse.json({ error: "Failed to seed reviews: " + error.message }, { status: 500 });
  }
}
