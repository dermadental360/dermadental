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
        </div>
        <div className="hero-card">
          <img src={settings.about_image} alt={settings.about_title} />
        </div>
      </div>
    </main>
  );
}
