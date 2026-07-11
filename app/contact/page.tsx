"use client";

import { useState } from "react";
import { clinic } from "@/lib/constants";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const defaultWhatsappUrl = `https://wa.me/${clinic.whatsapp}?text=${encodeURIComponent(
    `Hello ${clinic.name}, I want to make an inquiry regarding my skin/hair routine.`
  )}`;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const data = new FormData(event.currentTarget);
    const payload = {
      name: data.get("name"),
      phone: data.get("phone"),
      email: data.get("email"),
      message: data.get("message")
    };

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to submit inquiry");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="section page-enter">
      <div className="container split" style={{ gridTemplateColumns: "1fr 1.2fr", gap: 56 }}>
        <section className="reveal" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <p className="eyebrow">Contact Details</p>
            <h1>Connect with our clinic</h1>
            <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6 }}>
              Our dermatology clinic is led by {clinic.doctor}, located in Khar West. Feel free to contact us or send an online inquiry.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card pad" style={{ background: "var(--blush-light)" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>CLINIC LOCATION</span>
              <h3 style={{ fontSize: 18, marginTop: 4 }}>{clinic.name}</h3>
              <p style={{ fontSize: 15, color: "var(--muted)", margin: "4px 0 0 0" }}>{clinic.address}</p>
            </div>

            <div className="card pad">
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>TIMINGS & CONTACT</span>
              <h3 style={{ fontSize: 18, marginTop: 4 }}>{clinic.timing}</h3>
              <p style={{ fontSize: 15, color: "var(--muted)", margin: "4px 0 14px 0" }}>
                Call or message: {clinic.phone}<br />
                Email: {clinic.email}
              </p>
              <a
                className="btn secondary"
                href={`https://wa.me/${clinic.whatsapp}`}
                target="_blank"
                style={{ padding: "8px 18px", fontSize: 13 }}
              >
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </section>

        <section className="reveal reveal-delay-1">
          {success ? (
            <div className="card pad" style={{ textAlign: "center", padding: "48px 24px" }}>
              <div style={{ display: "inline-grid", placeItems: "center", width: 56, height: 56, borderRadius: "50%", backgroundColor: "var(--sage-light)", color: "var(--sage-dark)", fontSize: 28, marginBottom: 18 }}>
                ✓
              </div>
              <h2>Message received</h2>
              <p style={{ color: "var(--muted)", marginTop: 8, marginBottom: 24 }}>
                Thank you! Your inquiry has been saved. Our clinic assistant will review your query and contact you soon.
              </p>
              <a
                className="btn"
                href={defaultWhatsappUrl}
                target="_blank"
                style={{ backgroundColor: "#25D366", borderColor: "#25D366", color: "white" }}
              >
                Send via WhatsApp Instead
              </a>
            </div>
          ) : (
            <form className="card pad form" onSubmit={handleSubmit}>
              <h2 style={{ fontSize: 22, borderBottom: "1px solid var(--line)", paddingBottom: 10, marginBottom: 8 }}>
                ✉️ Send online query
              </h2>
              {error && (
                <p style={{ color: "var(--error)", fontSize: 14, background: "rgba(201, 74, 74, 0.08)", padding: "10px 14px", borderRadius: "6px" }}>
                  {error}
                </p>
              )}

              <div className="field">
                <label>Name</label>
                <input className="input" name="name" placeholder="Enter your name" required />
              </div>

              <div className="field">
                <label>Phone Number</label>
                <input className="input" name="phone" type="tel" placeholder="Enter your phone number" required />
              </div>


              <div className="field">
                <label>Email Address</label>
                <input className="input" name="email" type="email" placeholder="you@example.com" required />
              </div>

              <div className="field">
                <label>Message / Skincare concern</label>
                <textarea className="input" name="message" rows={4} placeholder="Type your query here..." required />
              </div>

              <button className="btn" type="submit" style={{ width: "100%" }} disabled={loading}>
                {loading ? "Submitting query..." : "Submit Inquiry"}
              </button>
            </form>
          )}
        </section>
      </div>
      <div className="container reveal reveal-delay-2" style={{ marginTop: 56 }}>
        <h2 style={{ fontSize: 22, marginBottom: 20 }}>Find Us on Google Maps</h2>
        <div style={{ overflow: "hidden", borderRadius: "var(--radius-lg)", border: "1px solid var(--line)" }}>
          <iframe
            src="https://maps.google.com/maps?q=19.067345686278408,72.83334955165576&t=&z=17&ie=UTF8&iwloc=&output=embed"
            width="100%"
            height="400"
            style={{ border: 0, display: "block" }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />

        </div>
      </div>
    </main>
  );
}

