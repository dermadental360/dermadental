"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useMotion } from "./MotionProvider";

const Canvas3D = dynamic(() => import("./Canvas3D"), {
  ssr: false,
});

export function AmbientBackground() {
  const { isAdmin, isReducedMotion } = useMotion();

  if (isAdmin) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden select-none">
      {/* Soft animated ambient gradient mesh */}
      {!isReducedMotion && (
        <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-400 via-cyan-600 to-transparent animate-pulse duration-[10000ms]" />
      )}

      {/* SVG Noise Texture for ultra-soft premium finish */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.03] mix-blend-overlay">
        <filter id="ambient-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#ambient-noise)" />
      </svg>

      {/* Lightweight 3D WebGL Background Layer */}
      <Canvas3D />
    </div>
  );
}
