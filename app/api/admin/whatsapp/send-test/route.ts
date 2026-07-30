import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { testPhone, testMessage } = body;

    if (!testPhone) {
      return NextResponse.json({ error: "Test phone number is required" }, { status: 400 });
    }

    const message = testMessage || "Hello! This is a test message from your DermaDental 360 WhatsApp Integration. Everything is operating normally.";

    const result = await sendWhatsAppMessage({
      recipientPhone: testPhone,
      recipientName: "Test Recipient",
      message,
      templateName: "admin_test",
    });

    if (result.success) {
      return NextResponse.json({ success: true, message: "Test WhatsApp message sent successfully!" });
    } else {
      return NextResponse.json({ success: false, error: result.error || "Failed to send WhatsApp test message" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status: 401 });
  }
}
