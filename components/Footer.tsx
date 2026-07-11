"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clinic } from "@/lib/constants";

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return (
    <footer className="footer">
      <div className="container grid cols-3">
        <div>
          <h3>{clinic.name}</h3>
          <p>Skin, hair and dental-focused wellness guided by {clinic.doctor}.</p>
        </div>
        <div>
          <h3>Clinic</h3>
          <p>{clinic.address}</p>
          <p>{clinic.timing}</p>
          <p style={{ marginTop: 8 }}>Email: {clinic.email}</p>
        </div>
        <div>
          <h3>Quick Links</h3>
          <p><Link href="/faq">FAQ</Link> - <Link href="/track-order">Track Order</Link> - <Link href="/contact">Contact</Link></p>
          <p><a href={`https://wa.me/${clinic.whatsapp}`}>WhatsApp {clinic.phone}</a></p>
        </div>
      </div>
    </footer>
  );
}

