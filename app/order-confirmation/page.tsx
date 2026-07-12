import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function OrderConfirmation({ searchParams }: { searchParams: Promise<{ order?: string; whatsapp?: string }> }) {
  const params = await searchParams;
  const whatsapp = params.whatsapp ? decodeURIComponent(params.whatsapp) : "";
  return (
    <main className="section page-enter" style={{ display: "grid", placeItems: "center", minHeight: "65vh" }}>
      <div className="container card pad reveal" style={{ maxWidth: 640, textAlign: "center", padding: "48px 32px" }}>
        <div style={{ display: "inline-grid", placeItems: "center", width: 64, height: 64, borderRadius: "50%", backgroundColor: "var(--sage-light)", color: "var(--sage-dark)", fontSize: 32, marginBottom: 24, fontWeight: "bold" }}>
          ✓
        </div>
        <p className="eyebrow" style={{ margin: 0 }}>Order Registered Successfully</p>
        <h1 style={{ fontSize: "clamp(24px, 4vw, 36px)", margin: "10px 0 16px 0" }}>Send order via WhatsApp</h1>
        <p style={{ fontSize: 16, color: "var(--muted)", lineHeight: 1.6, marginBottom: 12 }}>
          Your order request is saved on our system. To finalize, click the green button below to automatically send the order details to the clinic via WhatsApp.
        </p>
        <p style={{ fontSize: 14, fontWeight: 700, backgroundColor: "var(--bg-secondary)", padding: "8px 16px", borderRadius: 999, display: "inline-block", margin: "0 auto 28px auto", border: "1px solid var(--line)" }}>
          Order Reference: {params.order}
        </p>
        <div className="actions" style={{ justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
          {whatsapp && (
            <a
              className="btn"
              href={whatsapp}
              target="_blank"
              style={{ backgroundColor: "#25D366", borderColor: "#25D366", color: "white", padding: "14px 28px" }}
            >
              Send WhatsApp Message
            </a>
          )}
          <Link className="btn secondary" href="/shop" style={{ padding: "14px 28px" }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  );
}
