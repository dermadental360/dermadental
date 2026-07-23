import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getLegalPage, calcReadingTime, sanitizeHtml } from "@/lib/legal";
import { PrintButton } from "@/components/PrintButton";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getLegalPage("terms-and-conditions");
  const title = page?.seoTitle || "Terms & Conditions — DermaDental360";
  const description = page?.seoDescription || "Review the DermaDental360 Terms and Conditions for information about ordering, shipping, returns, and your rights as a customer.";
  return {
    title,
    description,
    keywords: page?.keywords || "terms and conditions, terms of service, DermaDental360",
    openGraph: {
      title: page?.ogTitle || title,
      description: page?.ogDescription || description,
      url: "https://www.dd360health.com/terms-and-conditions",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: page?.ogTitle || title,
      description: page?.ogDescription || description,
    },
    alternates: {
      canonical: page?.canonical || "https://www.dd360health.com/terms-and-conditions",
    },
  };
}

export default async function TermsPage() {
  const page = await getLegalPage("terms-and-conditions");
  if (!page) return notFound();

  const readingTime = calcReadingTime(page.content);
  const lastUpdated = new Date(page.lastUpdated).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric"
  });

  const safeHtml = sanitizeHtml(page.content);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.dd360health.com" },
      { "@type": "ListItem", "position": 2, "name": "Terms & Conditions", "item": "https://www.dd360health.com/terms-and-conditions" }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="page-enter" style={{ paddingBottom: 80 }}>
        {/* Sticky Header */}
        <div className="legal-sticky-header">
          <div className="container">
            <nav className="legal-breadcrumb" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span className="legal-breadcrumb-sep">›</span>
              <span>{page.title}</span>
            </nav>
            <div className="legal-header-meta">
              <h1 className="legal-page-title">{page.title}</h1>
              <div className="legal-meta-row">
                <span className="legal-meta-item">📅 Last updated: {lastUpdated}</span>
                <span className="legal-meta-sep">·</span>
                <span className="legal-meta-item">⏱ {readingTime} min read</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container">
          <div className="legal-content-wrapper">
            <article
              className="legal-content"
              dangerouslySetInnerHTML={{ __html: safeHtml }}
            />
            <div className="legal-print-note">
              <PrintButton id="legal-print-btn-terms" />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
