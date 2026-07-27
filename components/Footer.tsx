"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clinic } from "@/lib/constants";

export function Footer() {
  const pathname = usePathname();
  const [settings, setSettings] = useState<Record<string, string>>({
    registered_address: clinic.address,
    support_email: clinic.email,
    support_phone: clinic.phone,
    legal_entity_name: clinic.legalEntityName,
    gstin: clinic.gstin,
    clinic_doctor: clinic.doctor,
    clinic_timing: clinic.timing
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data === "object") {
          setSettings((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(() => {});
  }, []);

  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="footer relative overflow-hidden">
      {/* Soft ambient gradient glow */}
      <div className="pointer-events-none absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-teal-400 via-transparent to-transparent" />

      <div className="container grid cols-3 reveal relative z-10">
        <div>
          <h3>{clinic.name}</h3>
          <p>Skin, hair and dental-focused wellness guided by {settings.clinic_doctor || clinic.doctor}.</p>
          <p style={{ marginTop: 8, fontSize: 12, opacity: 0.85 }}>
            Legal Entity: <strong>{settings.legal_entity_name || clinic.legalEntityName}</strong><br />
            GSTIN: {settings.gstin || clinic.gstin}
          </p>
        </div>
        <div>
          <h3>Clinic & Registered Address</h3>
          <p>{settings.registered_address || clinic.address}</p>
          <p>{settings.clinic_timing || clinic.timing}</p>
          <p style={{ marginTop: 8 }}>Email: {settings.support_email || clinic.email}</p>
        </div>
        <div>
          <h3>Quick Links</h3>
          <p><Link href="/faq">FAQ</Link> - <Link href="/track-order">Track Order</Link> - <Link href="/contact">Contact</Link></p>
          <p><a href={`https://wa.me/${(settings.support_phone || clinic.phone).replace(/\D/g, "")}`}>WhatsApp {settings.support_phone || clinic.phone}</a></p>
          <p style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8, fontSize: 13 }}>
            <Link href="/privacy-policy">Privacy Policy</Link>
            <span>•</span>
            <Link href="/terms-and-conditions">Terms &amp; Conditions</Link>
            <span>•</span>
            <Link href="/cancellation-and-refund">Refund Policy</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
