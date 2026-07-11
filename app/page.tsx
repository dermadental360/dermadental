import Link from "next/link";
import { categories, clinic, concerns, slugify } from "@/lib/constants";
import { getProducts } from "@/lib/products";
import { ShopGrid } from "@/components/ShopGrid";
import { getAllSettings } from "@/lib/settings";

export default async function HomePage() {
  const featured = (await getProducts()).filter((product) => product.featured).slice(0, 4);
  const settings = await getAllSettings();

  return (
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div className="reveal">
            <p className="eyebrow">{settings.hero_eyebrow}</p>
            <h1>{settings.hero_title}</h1>
            <p style={{ fontSize: 18, marginBottom: 28 }}>
              {settings.hero_subtitle}
            </p>
            <div className="actions" style={{ flexWrap: "wrap", gap: 14 }}>
              <Link className="btn" href="/shop">Shop Products</Link>
              <Link className="btn secondary" href="/consultation">Book Consultation</Link>
            </div>
          </div>
          <div className="hero-card premium-hero-card reveal reveal-delay-1">
            <img src={settings.hero_image} alt="DermaDental360 premium skincare display" />
          </div>
        </div>
      </section>




      <section className="section reveal">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">Shop by category</p>
              <h2>Curated daily care</h2>
            </div>
            <Link className="btn secondary" href="/shop">View all</Link>
          </div>
          <div className="grid cols-4">
            {categories.slice(0, 8).map((category, index) => (
              <Link
                className={`card category-tile reveal reveal-delay-${(index % 4) + 1}`}
                href={`/category/${slugify(category)}`}
                key={category}
              >
                <div className="category-image">
                  <img src={`/category/${slugify(category)}.png`} alt={category} />
                </div>
                <div className="category-info pad">
                  <p className="eyebrow">{category}</p>
                  <h3>{category} essentials</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section reveal" style={{ background: "var(--bg-secondary)" }}>
        <div className="container">
          <div className="section-head" style={{ borderBottom: "1px solid var(--line)" }}>
            <div>
              <p className="eyebrow">Doctor selected</p>
              <h2>Featured products</h2>
            </div>
          </div>
          <ShopGrid products={featured} />
        </div>
      </section>

      <section className="section reveal">
        <div className="container grid cols-3">
          <div className="card pad">
            <p className="eyebrow" style={{ color: "var(--gold)", fontWeight: 700 }}>Expert Clinic</p>
            <h3>{clinic.doctor}</h3>
            <p style={{ fontSize: 15, marginTop: 8 }}>Clinic-led guidance for skin, hair and routine selection at Khar West, Mumbai.</p>
          </div>
          <div className="card pad">
            <p className="eyebrow" style={{ color: "var(--gold)", fontWeight: 700 }}>Simple Process</p>
            <h3>WhatsApp Orders</h3>
            <p style={{ fontSize: 15, marginTop: 8 }}>Place your order and send the request directly to {clinic.phone}. Pay at clinic or online via verification.</p>
          </div>
          <div className="card pad">
            <p className="eyebrow" style={{ color: "var(--gold)", fontWeight: 700 }}>Targeted Solutions</p>
            <h3>Common Concerns</h3>
            <p style={{ fontSize: 15, marginTop: 8 }}>{concerns.slice(0, 5).join(", ")} and other dermatologist-treated conditions.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
