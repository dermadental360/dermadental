import { Metadata } from "next";
import Link from "next/link";
import { clinic } from "@/lib/constants";
import { PrintButton } from "@/components/PrintButton";

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy — DermaDental360",
  description:
    "Read the DermaDental360 (Moeen International) Refund and Cancellation Policy for details on order cancellations, returns, refunds, and shipping timelines.",
  keywords: "cancellation policy, refund policy, return policy, DermaDental360, Moeen International",
  openGraph: {
    title: "Cancellation & Refund Policy — DermaDental360",
    description:
      "Read the DermaDental360 (Moeen International) Refund and Cancellation Policy for details on order cancellations, returns, refunds, and shipping timelines.",
    url: "https://www.dd360health.com/cancellation-and-refund",
    type: "website",
  },
  alternates: {
    canonical: "https://www.dd360health.com/cancellation-and-refund",
  },
};

export default function CancellationAndRefundPage() {
  const lastUpdated = "26 July 2026";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.dd360health.com" },
      {
        "@type": "ListItem",
        position: 2,
        name: "Cancellation & Refund Policy",
        item: "https://www.dd360health.com/cancellation-and-refund",
      },
    ],
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
              <span>Cancellation & Refund Policy</span>
            </nav>
            <div className="legal-header-meta">
              <h1 className="legal-page-title">Cancellation & Refund Policy</h1>
              <div className="legal-meta-row">
                <span className="legal-meta-item">📅 Last updated: {lastUpdated}</span>
                <span className="legal-meta-sep">·</span>
                <span className="legal-meta-item">⏱ 3 min read</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container">
          <div className="legal-content-wrapper">
            <article className="legal-content">
              <p>
                This Cancellation and Refund Policy applies to all purchases made on the{" "}
                <strong>{clinic.name}</strong> website, operated by legal entity{" "}
                <strong>{clinic.legalEntityName}</strong> (GSTIN: {clinic.gstin}).
              </p>

              <hr />

              <h2>1. Order Cancellation Policy</h2>
              <p>
                Customers can cancel an order <strong>at any time prior to order dispatch</strong>.
              </p>
              <ul>
                <li>
                  To cancel an order before dispatch, please contact our support team immediately at{" "}
                  <a href={`mailto:${clinic.email}`}>{clinic.email}</a> or call/WhatsApp us at{" "}
                  <a href={`https://wa.me/${clinic.whatsapp}`}>+91 {clinic.phone}</a> with your Order ID.
                </li>
                <li>
                  Once an order has been dispatched from our warehouse/clinic, it cannot be canceled directly.
                  However, you may request a return upon delivery in accordance with Section 2 below.
                </li>
              </ul>

              <h2>2. Return & Exchange Policy</h2>
              <p>
                We strive to ensure complete satisfaction with every product delivered.
              </p>
              <ul>
                <li>
                  <strong>Unopened / Sealed Products:</strong> Returns or exchanges are accepted within{" "}
                  <strong>7 days of delivery</strong> provided the product packaging remains strictly{" "}
                  <strong>unopened, unused, sealed, and intact</strong> in its original condition.
                </li>
                <li>
                  <strong>Damaged, Defective, or Wrong Items:</strong> If you receive a damaged, defective, or incorrect product, please notify us within <strong>48 hours of delivery</strong> with photos/videos of the package and item. We will arrange a free replacement or full refund.
                </li>
                <li>
                  <strong>Hygiene & Safety Exclusion:</strong> For safety, hygiene, and medical reasons, any product whose outer seal or box has been opened, unsealed, or tampered with cannot be returned or refunded unless proved defective upon delivery.
                </li>
              </ul>

              <h2>3. Refund Process & Timelines</h2>
              <ul>
                <li>
                  Upon receipt and inspection of the returned unopened item at our facility, we will notify you of the approval or rejection of your refund.
                </li>
                <li>
                  Approved refunds will be processed back to your original payment method (Credit/Debit Card, Netbanking, UPI, or Wallet) within <strong>5 to 7 business days</strong>.
                </li>
                <li>
                  For Cash-on-Delivery (COD) orders or manual transfers, refunds will be issued via UPI or direct bank account transfer after collecting bank details from the customer.
                </li>
              </ul>

              <h2>4. Shipping & Delivery Timelines</h2>
              <ul>
                <li>
                  <strong>Order Processing Time:</strong> All orders are processed and dispatched within{" "}
                  <strong>1 to 2 business days</strong>.
                </li>
                <li>
                  <strong>Estimated Delivery Time:</strong> Delivery across India typically takes{" "}
                  <strong>3 to 7 working days</strong>, depending on the destination pincode and courier service availability.
                </li>
              </ul>

              <h2>5. Merchant Details & Contact Information</h2>
              <p>
                For any questions regarding cancellations, returns, refunds, or order status, please reach out to us:
              </p>
              <div className="card pad" style={{ marginTop: 16, background: "var(--blush-light)" }}>
                <p style={{ margin: 0, lineHeight: 1.8 }}>
                  <strong>Legal Entity Name:</strong> {clinic.legalEntityName}<br />
                  <strong>Brand / Clinic Name:</strong> {clinic.name}<br />
                  <strong>GSTIN:</strong> {clinic.gstin}<br />
                  <strong>Registered Business Address:</strong> {clinic.address}<br />
                  <strong>Support Email:</strong>{" "}
                  <a href={`mailto:${clinic.email}`}>{clinic.email}</a><br />
                  <strong>Phone / WhatsApp:</strong> +91 {clinic.phone}
                </p>
              </div>
            </article>

            <div className="legal-print-note">
              <PrintButton id="legal-print-btn-refund" />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
