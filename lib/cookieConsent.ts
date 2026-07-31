"use client";

export type CookieConsentStatus = "accepted" | "rejected" | "undecided";

const CONSENT_STORAGE_KEY = "dd360_cookie_consent_status";

export function getCookieConsentStatus(): CookieConsentStatus {
  if (typeof window === "undefined") return "undecided";
  try {
    const val = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (val === "accepted" || val === "rejected") return val;
  } catch (e) {
    console.warn("Failed to read cookie consent status", e);
  }
  return "undecided";
}

export function setCookieConsentStatus(status: "accepted" | "rejected"): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, status);
    // Dispatch custom event to notify MetaPixelProvider dynamically
    window.dispatchEvent(new CustomEvent("dd360_cookie_consent_change", { detail: { status } }));
  } catch (e) {
    console.warn("Failed to set cookie consent status", e);
  }
}
