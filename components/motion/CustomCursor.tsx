"use client";

import React, { useEffect, useRef, useState } from "react";
import { useMotion } from "./MotionProvider";

export function CustomCursor() {
  const { isDesktop } = useMotion();
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);

  const [isHovered, setIsHovered] = useState(false);
  const [isFormFocused, setIsFormFocused] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isDesktop) return;

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let animId: number;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!isVisible) setIsVisible(true);

      const target = e.target as HTMLElement | null;
      if (!target) return;

      const isInput = Boolean(
        target.closest("input, textarea, select, label, button[type='submit'], .admin-panel, [contenteditable='true']")
      );
      setIsFormFocused(isInput);

      const isInteractive = Boolean(
        target.closest("a, button, [role='button'], .product-card, .tilt-card, [data-cursor-hover]")
      );
      setIsHovered(isInteractive && !isInput);
    };

    const onMouseLeave = () => {
      setIsVisible(false);
    };

    const render = () => {
      // Lerp ring towards mouse
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;

      if (cursorDotRef.current) {
        cursorDotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0px) translate(-50%, -50%)`;
      }
      if (cursorRingRef.current) {
        cursorRingRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0px) translate(-50%, -50%) scale(${
          isHovered ? 1.6 : 1
        })`;
      }

      animId = requestAnimationFrame(render);
    };

    window.addEventListener("mousemove", onMouseMove);
    document.body.addEventListener("mouseleave", onMouseLeave);
    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      document.body.removeEventListener("mouseleave", onMouseLeave);
      cancelAnimationFrame(animId);
    };
  }, [isDesktop, isHovered, isVisible]);

  if (!isDesktop || !isVisible || isFormFocused) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      {/* Outer Spring Ring */}
      <div
        ref={cursorRingRef}
        className={`absolute top-0 left-0 h-8 w-8 rounded-full border border-teal-500/60 transition-colors duration-200 dark:border-teal-400/60 ${
          isHovered ? "bg-teal-500/10 border-teal-400 backdrop-blur-[1px]" : ""
        }`}
        style={{ willChange: "transform" }}
      />
      {/* Inner Precision Dot */}
      <div
        ref={cursorDotRef}
        className={`absolute top-0 left-0 h-2 w-2 rounded-full bg-teal-500 transition-transform duration-150 dark:bg-teal-300 ${
          isHovered ? "scale-150 bg-amber-400" : ""
        }`}
        style={{ willChange: "transform" }}
      />
    </div>
  );
}
