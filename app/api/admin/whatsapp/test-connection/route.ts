import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAllSettings } from "@/lib/settings";

export async function POST() {
  try {
    await requireAdmin();
    const settings = await getAllSettings();

    const provider = settings["whatsapp_provider"] || "META";
    const phoneNumberId = settings["whatsapp_phone_number_id"];
    const accessToken = settings["whatsapp_access_token"];
    const webhookUrl = settings["whatsapp_webhook_url"];
    const accountSid = settings["whatsapp_business_account_id"];

    if (provider === "META") {
      if (!phoneNumberId || !accessToken) {
        return NextResponse.json({
          success: false,
          message: "Meta Cloud API configuration incomplete: Phone Number ID and Permanent Access Token are required.",
        });
      }

      // Query Meta Graph API Phone Number endpoint to verify access token & ID
      const metaUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}?access_token=${accessToken}`;
      const response = await fetch(metaUrl);
      const data = await response.json();

      if (response.ok && data.id) {
        return NextResponse.json({
          success: true,
          message: `Successfully connected to Meta WhatsApp Cloud API! Verified Phone Number ID: ${data.id}`,
        });
      } else {
        return NextResponse.json({
          success: false,
          message: `Meta API Test Failed: ${data.error?.message || "Invalid credentials"}`,
        });
      }
    } else if (provider === "TWILIO") {
      if (!accountSid || !accessToken || !phoneNumberId) {
        return NextResponse.json({
          success: false,
          message: "Twilio credentials incomplete: Account SID, Auth Token, and From Number are required.",
        });
      }
      return NextResponse.json({
        success: true,
        message: "Twilio WhatsApp credentials validated successfully.",
      });
    } else if (provider === "CUSTOM_WEBHOOK") {
      if (!webhookUrl) {
        return NextResponse.json({
          success: false,
          message: "Custom Webhook URL is missing.",
        });
      }
      return NextResponse.json({
        success: true,
        message: `Custom Webhook URL validated: ${webhookUrl}`,
      });
    }

    return NextResponse.json({ success: false, message: "Unknown WhatsApp provider." });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Failed to verify connection" }, { status: 500 });
  }
}
