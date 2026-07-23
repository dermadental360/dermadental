import Link from "next/link";
import Image from "next/image";
import { categories, clinic, concerns, slugify } from "@/lib/constants";
import { getFeaturedProducts } from "@/lib/products";
import { ShopGrid } from "@/components/ShopGrid";
import { HeroSlider } from "@/components/HeroSlider";
import { getSlides } from "@/lib/slides";

export const revalidate = 60;

export default async function HomePage() {
  const [featured, slides] = await Promise.all([
    getFeaturedProducts(4),
    getSlides()
  ]);

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
                <div className="category-image" style={{ position: "relative", width: "100%", aspectRatio: "1 / 1", overflow: "hidden" }}>
                  <Image
                    src={`/category/${slugify(category)}.webp`}
                    alt={category}
                    width={400}
                    height={400}
                    sizes="(max-width: 768px) 50vw, 25vw"
                    loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
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
