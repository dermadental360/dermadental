"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface MotionContextType {
  isMounted: boolean;
  isAdmin: boolean;
  isMobile: boolean;
  isTouch: boolean;
  isReducedMotion: boolean;
  isDesktop: boolean;
}

const MotionContext = createContext<MotionContextType>({
  isMounted: false,
  isAdmin: false,
  isMobile: false,
  isTouch: false,
  isReducedMotion: false,
  isDesktop: false,
});

export const useMotion = () => useContext(MotionContext);

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  const isAdmin = Boolean(pathname?.startsWith("/admin"));

  useEffect(() => {
    setMounted(true);

    const checkDevice = () => {
      const mobileQuery = window.innerWidth < 768;
      const touchCapable =
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0;
      const reducedMotionQuery = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      setIsMobile(mobileQuery);
      setIsTouch(touchCapable);
      setIsReducedMotion(reducedMotionQuery);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleMotionChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleMotionChange);
    }

    return () => {
      window.removeEventListener("resize", checkDevice);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleMotionChange);
      }
    };
  }, []);

  const isDesktop = mounted && !isMobile && !isTouch && !isReducedMotion && !isAdmin;

  return (
    <MotionContext.Provider
      value={{
        isMounted: mounted,
        isAdmin,
        isMobile,
        isTouch,
        isReducedMotion,
        isDesktop,
      }}
    >
      {children}
    </MotionContext.Provider>
  );
}
