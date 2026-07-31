"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initMetaPixel, trackPageView, MetaPixelConfig } from "@/lib/metaPixel";
import { getCookieConsentStatus } from "@/lib/cookieConsent";

function MetaPixelTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pixelConfig, setPixelConfig] = useState<MetaPixelConfig | null>(null);
  const [consentStatus, setConsentStatus] = useState(getCookieConsentStatus());
  const initialRenderRef = useRef(true);
  const lastPathRef = useRef<string>("");

  // Fetch live settings from database
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          const config: MetaPixelConfig = {
            enabled: data.meta_pixel_enabled === "true",
            pixelId: data.meta_pixel_id || "1040837018670941",
            advancedMatching: data.meta_pixel_advanced_matching !== "false",
            autoPageView: data.meta_pixel_auto_pageview !== "false",
            testMode: data.meta_pixel_test_mode === "true"
          };
          setPixelConfig(config);
        }
      })
      .catch((err) => console.warn("[Meta Pixel] Failed to fetch settings:", err));
  }, []);

  // Listen for cookie consent changes
  useEffect(() => {
    const handleConsentChange = (e: any) => {
      if (e.detail?.status) {
        setConsentStatus(e.detail.status);
      }
    };
    window.addEventListener("dd360_cookie_consent_change", handleConsentChange);
    return () => window.removeEventListener("dd360_cookie_consent_change", handleConsentChange);
  }, []);

  // Initialize Meta Pixel after hydration when enabled and consented
  useEffect(() => {
    if (!pixelConfig) return;

    // Check cookie consent
    const currentConsent = consentStatus || getCookieConsentStatus();
    if (currentConsent === "rejected") {
      if (pixelConfig.testMode) {
        console.log("[Meta Pixel Debug] Marketing cookies rejected. Meta Pixel disabled.");
      }
      return;
    }

    if (pixelConfig.enabled) {
      const initialized = initMetaPixel(pixelConfig);
      if (initialized && pixelConfig.autoPageView && initialRenderRef.current) {
        trackPageView();
        initialRenderRef.current = false;
        lastPathRef.current = `${pathname}?${searchParams.toString()}`;
      }
    }
  }, [pixelConfig, consentStatus]);

  // Handle Client-Side Navigation, Soft Navigation, Back/Forward Buttons
  useEffect(() => {
    if (!pixelConfig || !pixelConfig.enabled || !pixelConfig.autoPageView) return;
    if (consentStatus === "rejected") return;

    const currentPath = `${pathname}?${searchParams.toString()}`;

    // Avoid duplicate PageView on initial render
    if (initialRenderRef.current) {
      return;
    }

    // Fire PageView on route change if path changed
    if (lastPathRef.current !== currentPath) {
      lastPathRef.current = currentPath;
      trackPageView();
    }
  }, [pathname, searchParams, pixelConfig, consentStatus]);

  return null;
}

export function MetaPixelProvider() {
  return (
    <Suspense fallback={null}>
      <MetaPixelTracker />
    </Suspense>
  );
}
