import Image from "next/image";
import { clinic } from "@/lib/constants";
import { getAllSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const settings = await getAllSettings();
  return (
    <main className="section page-enter">
      <div className="container page-hero-grid reveal">
        <div>
          <p className="eyebrow">{settings.about_eyebrow}</p>
          <h1>{settings.about_title}</h1>
          <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6 }}>
            {settings.about_subtitle}
          </p>
          <div className="card pad" style={{ marginTop: 24, background: "var(--blush-light)", border: "1px solid var(--line)" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Legal Business Information
            </span>
            <h3 style={{ fontSize: 18, marginTop: 6, marginBottom: 8 }}>{clinic.name}</h3>
            <p style={{ fontSize: 14, color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>
              <strong>Legal Entity Name:</strong> {clinic.legalEntityName}<br />
              <strong>GSTIN:</strong> {clinic.gstin}<br />
              <strong>Registered Address:</strong> {clinic.address}<br />
              <strong>Support Contact:</strong> {clinic.email} | +91 {clinic.phone}
            </p>
          </div>
        </div>
        <div className="hero-card" style={{ position: "relative" }}>
          <Image 
            src={settings.about_image} 
            alt={settings.about_title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            style={{ objectFit: "cover" }}
            priority
          />
        </div>
      </div>
    </main>
  );
}
