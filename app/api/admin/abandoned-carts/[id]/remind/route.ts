import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendAbandonedCartWhatsApp } from "@/lib/whatsapp";
import { sendAbandonedCartEmail } from "@/lib/email";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { type } = body; // "whatsapp" | "email" | "both"

    const cart = await prisma.abandonedCart.findUnique({
      where: { id },
    });

    if (!cart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    let whatsappSent = false;
    let emailSent = false;
    let errorMsg = "";

    if ((type === "whatsapp" || type === "both") && cart.phone) {
      const res = await sendAbandonedCartWhatsApp({
        customerName: cart.customerName,
        phone: cart.phone,
        cartValue: cart.cartValue,
        items: cart.items,
      });

      if (res?.success) {
        whatsappSent = true;
        await prisma.abandonedCart.update({
          where: { id },
          data: { whatsappSent: true, whatsappSentAt: new Date() },
        });
      } else {
        errorMsg += `WhatsApp error: ${res?.error || "Failed"}. `;
      }
    }

    if ((type === "email" || type === "both") && cart.email) {
      const res = await sendAbandonedCartEmail({
        customerName: cart.customerName || "Valued Customer",
        email: cart.email,
        cartValue: cart.cartValue,
        items: cart.items as any[],
      });

      if (res) {
        emailSent = true;
        await prisma.abandonedCart.update({
          where: { id },
          data: { emailSent: true, emailSentAt: new Date() },
        });
      } else {
        errorMsg += "Email dispatch failed. ";
      }
    }

    return NextResponse.json({
      success: whatsappSent || emailSent,
      whatsappSent,
      emailSent,
      error: errorMsg || undefined,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status: 401 });
  }
}
