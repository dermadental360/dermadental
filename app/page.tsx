import Link from "next/link";
import { categories, clinic, concerns, slugify } from "@/lib/constants";
import { getProducts } from "@/lib/products";
import { ShopGrid } from "@/components/ShopGrid";
import { HeroSlider } from "@/components/HeroSlider";
import { getSlides } from "@/lib/slides";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featured = (await getProducts()).filter((product) => product.featured).slice(0, 4);
  const slides = await getSlides();

  return (
    <main>
      {/* Luxury Skincare Hero Slider */}
      <HeroSlider slides={slides} />

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
            {categories.map((category, index) => (
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
