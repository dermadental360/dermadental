"use client";

import React, { useEffect, useState } from "react";
import { useMotion } from "./MotionProvider";

export function ScrollProgress() {
  const { isAdmin, isReducedMotion } = useMotion();
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    if (isAdmin || isReducedMotion) return;

    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) {
        setScrollProgress(0);
        return;
      }
      const progress = window.scrollY / totalHeight;
      setScrollProgress(Math.min(1, Math.max(0, progress)));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [isAdmin, isReducedMotion]);

  if (isAdmin || isReducedMotion) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[2px] w-full bg-transparent pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-teal-500 via-cyan-400 to-amber-400 origin-left transition-transform duration-75 ease-out shadow-[0_0_8px_rgba(20,184,166,0.6)]"
        style={{
          transform: `scaleX(${scrollProgress})`,
          willChange: "transform",
        }}
      />
    </div>
  );
}
