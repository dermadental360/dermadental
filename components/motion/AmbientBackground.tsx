"use client";

import React from "react";
import { useMotion } from "./MotionProvider";

export function AmbientBackground() {
  const { isAdmin, isReducedMotion } = useMotion();

  if (isAdmin || isReducedMotion) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden select-none">
      {/* Clean, luxury soft ambient lighting glow (no 3D objects, noise, or particles) */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-400 via-transparent to-transparent pointer-events-none" />
    </div>
  );
}
