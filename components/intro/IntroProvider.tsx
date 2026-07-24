"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface IntroContextType {
  showIntro: boolean;
  completeIntro: () => void;
}

const IntroContext = createContext<IntroContextType>({
  showIntro: false,
  completeIntro: () => {},
});

export const useIntro = () => useContext(IntroContext);

export function IntroProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    // Isolated check for Admin panel
    if (pathname?.startsWith("/admin")) {
      setShowIntro(false);
      return;
    }

    // Check prefers-reduced-motion
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setShowIntro(false);
      return;
    }

    // Session isolation: check if already seen in current browser session
    try {
      const hasSeen = sessionStorage.getItem("hasSeen3DIntro_v1");
      if (!hasSeen) {
        setShowIntro(true);
      } else {
        setShowIntro(false);
      }
    } catch (e) {
      setShowIntro(false);
    }
  }, [pathname]);

  const completeIntro = () => {
    try {
      sessionStorage.setItem("hasSeen3DIntro_v1", "true");
    } catch (e) {}
    setShowIntro(false);
  };

  return (
    <IntroContext.Provider value={{ showIntro, completeIntro }}>
      {children}
    </IntroContext.Provider>
  );
}
