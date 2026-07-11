"use client";

import { usePathname } from "next/navigation";
import { clinic } from "@/lib/constants";

export function FloatingCallWidget() {
  const pathname = usePathname();

  // Hide the call buttons on admin layout pages
  if (pathname.startsWith("/admin")) return null;

  return (
    <div className="floating-widget reveal revealed">
      <a href={`tel:${clinic.phone}`} className="widget-btn phone" title="Call Clinic Directly">
        <span style={{ fontSize: 18 }}>📞</span>
      </a>
      <a href={`https://wa.me/${clinic.whatsapp}`} className="widget-btn whatsapp" target="_blank" title="Chat on WhatsApp">
        <span style={{ fontSize: 18 }}>💬</span>
      </a>
    </div>
  );
}
