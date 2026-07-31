"use client";

import React, { useState, useEffect } from "react";
import { getCookieConsentStatus, setCookieConsentStatus, CookieConsentStatus } from "@/lib/cookieConsent";

export function CookieConsentBanner() {
  const [consentStatus, setConsentStatus] = useState<CookieConsentStatus>("accepted"); // Default accepted to prevent layout shift during SSR
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setConsentStatus(getCookieConsentStatus());
  }, []);

  if (!mounted || consentStatus !== "undecided") {
    return null;
  }

  const handleAccept = () => {
    setCookieConsentStatus("accepted");
    setConsentStatus("accepted");
  };

  const handleReject = () => {
    setCookieConsentStatus("rejected");
    setConsentStatus("rejected");
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie Privacy Preferences"
      style={{
        position: "fixed",
        bottom: 20,
        left: 20,
        right: 20,
        maxWidth: 580,
        margin: "0 auto",
        backgroundColor: "#161e1b",
        color: "#ffffff",
        padding: "18px 22px",
        borderRadius: "14px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.35)",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        border: "1px solid rgba(255,255,255,0.1)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)"
      }}
    >
      <div style={{ display: "flex", alignItems: "start", gap: 12 }}>
        <span style={{ fontSize: 22 }}>🍪</span>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: "0 0 4px 0", fontSize: 15, fontWeight: 700, color: "#ffffff", fontFamily: "'Outfit', sans-serif" }}>
            Privacy & Cookie Preferences
          </h4>
          <p style={{ margin: 0, fontSize: 13, color: "#cbd5e1", lineHeight: 1.45 }}>
            We use cookies and analytical tracking (including Meta Pixel) to personalize recommendations and optimize your clinical store experience.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap", paddingTop: 4 }}>
        <button
          type="button"
          onClick={handleReject}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            fontSize: 13,
            fontWeight: 600,
            backgroundColor: "transparent",
            color: "#94a3b8",
            border: "1px solid rgba(255,255,255,0.2)",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
        >
          Reject Marketing
        </button>

        <button
          type="button"
          onClick={handleAccept}
          style={{
            padding: "8px 20px",
            borderRadius: "8px",
            fontSize: 13,
            fontWeight: 700,
            backgroundColor: "var(--sage, #14B8C4)",
            color: "#ffffff",
            border: "none",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
        >
          Accept All Cookies
        </button>
      </div>
    </div>
  );
}
