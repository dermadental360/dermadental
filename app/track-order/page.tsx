import { clinic } from "@/lib/constants";

export default function TrackOrderPage() {
  return (
    <main className="section page-enter" style={{ display: "grid", placeItems: "center", minHeight: "65vh" }}>
      <div className="container card pad reveal" style={{ maxWidth: 640, textAlign: "center", padding: "48px 32px" }}>
        <p className="eyebrow">Personal Tracking</p>
        <h1 style={{ fontSize: "clamp(24px, 4vw, 36px)", margin: "10px 0 16px 0" }}>Check order status</h1>
        <p style={{ fontSize: 16, color: "var(--muted)", lineHeight: 1.6, marginBottom: 28 }}>
          Order tracking is handled personally by our clinic assistant on WhatsApp. Simply share your order ID or reference details to get real-time delivery status updates.
        </p>
        <a className="btn" href={`https://wa.me/${clinic.whatsapp}?text=Hello%2C%20I%20want%20to%20track%20my%20order.`} style={{ padding: "14px 28px" }}>
          Track on WhatsApp
        </a>
      </div>
    </main>
  );
}
