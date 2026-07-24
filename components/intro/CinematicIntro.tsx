"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useIntro } from "./IntroProvider";

const IntroCanvas = dynamic(() => import("./IntroCanvas"), {
  ssr: false,
});

export function CinematicIntro() {
  const { showIntro, completeIntro } = useIntro();
  const [showSkipButton, setShowSkipButton] = useState(false);
  const [isTriggered, setIsTriggered] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Preload Homepage Critical Assets while Intro is running
  useEffect(() => {
    if (!showIntro) return;

    // Preload logo & critical images
    const assets = ["/logo.webp", "/icon.png"];
    assets.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [showIntro]);

  // Skip Button Fade-In (after 2.5s) & 9s Automatic Fallback Safety Timer
  useEffect(() => {
    if (!showIntro) return;

    const skipTimer = setTimeout(() => {
      setShowSkipButton(true);
    }, 2500);

    const fallbackTimer = setTimeout(() => {
      handleTriggerTransition();
    }, 9000);

    return () => {
      clearTimeout(skipTimer);
      clearTimeout(fallbackTimer);
    };
  }, [showIntro]);

  if (!showIntro) return null;

  const handleTriggerTransition = () => {
    if (isTriggered) return;
    setIsTriggered(true);
    setIsFadingOut(true);

    setTimeout(() => {
      completeIntro();
    }, 2200);
  };

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-between bg-[#0B0F12] text-white overflow-hidden transition-opacity duration-[1800ms] ease-out select-none ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      onClick={handleTriggerTransition}
    >
      {/* Ambient background soft volumetric lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-teal-500/10 via-transparent to-transparent pointer-events-none" />

      {/* Top Typography: Dr. Sadaf's */}
      <div className="relative z-10 pt-12 text-center pointer-events-none">
        <p className="font-playfair text-xl md:text-2xl tracking-widest text-teal-300/90 uppercase animate-fadeIn duration-1000">
          Dr. Sadaf's
        </p>
      </div>

      {/* Center 3D WebGL Holographic Globe Canvas */}
      <div className="relative w-full h-[60vh] max-h-[600px] my-auto">
        <IntroCanvas onComplete={completeIntro} isTriggered={isTriggered} />
      </div>

      {/* Bottom Typography: DermaDental 360 */}
      <div className="relative z-10 pb-16 text-center pointer-events-none">
        <h1 className="font-playfair text-3xl md:text-5xl font-bold tracking-tight text-white mb-2">
          DermaDental 360
        </h1>
        <p className="text-xs tracking-[0.3em] uppercase text-teal-400/80 animate-pulse">
          Click or tap to enter
        </p>
      </div>

      {/* 2.5s Glassmorphism Skip Intro Button */}
      {showSkipButton && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleTriggerTransition();
          }}
          className="absolute bottom-6 right-6 z-20 px-5 py-2.5 rounded-full text-xs font-semibold tracking-wider text-white/90 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-teal-500/20 hover:border-teal-400 hover:text-white transition-all duration-300 shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-400"
          aria-label="Skip 3D Intro"
        >
          Skip Intro &rarr;
        </button>
      )}
    </div>
  );
}
