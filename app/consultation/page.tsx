import { clinic } from "@/lib/constants";
import { getAllSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function ConsultationPage() {
  const settings = await getAllSettings();
  const text = encodeURIComponent(`Hello ${clinic.name}, I want to book a consultation with ${clinic.doctor}.`);
  return (
    <main className="section page-enter">
      <div className="container hero-grid reveal">
        <div>
          <p className="eyebrow">{settings.consultation_eyebrow}</p>
          <h1>{settings.consultation_title}</h1>
          <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, marginBottom: 28 }}>
            {settings.consultation_subtitle}
          </p>
          <a className="btn" href={`https://wa.me/${clinic.whatsapp}?text=${text}`} style={{ padding: "14px 28px" }}>
            Book Appointment on WhatsApp
          </a>
        </div>
        <div className="hero-card">
          <img src={settings.consultation_image} alt={settings.consultation_title} />
        </div>
      </div>
    </main>
  );
}
