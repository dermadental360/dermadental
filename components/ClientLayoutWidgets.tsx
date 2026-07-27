"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ScrollReveal } from "./ScrollReveal";

const LenisProvider = dynamic(
  () => import("./motion/LenisProvider").then((m) => m.LenisProvider)
);
const CustomCursor = dynamic(
  () => import("./motion/CustomCursor").then((m) => m.CustomCursor),
  { ssr: false }
);
const AmbientBackground = dynamic(
  () => import("./motion/AmbientBackground").then((m) => m.AmbientBackground),
  { ssr: false }
);
const ScrollProgress = dynamic(
  () => import("./motion/ScrollProgress").then((m) => m.ScrollProgress),
  { ssr: false }
);
const VisitorTracker = dynamic(
  () => import("./VisitorTracker").then((m) => m.VisitorTracker),
  { ssr: false }
);
const FloatingCallWidget = dynamic(
  () => import("./FloatingCallWidget").then((m) => m.FloatingCallWidget),
  { ssr: false }
);

export function ClientLayoutWidgets({ children }: { children: React.ReactNode }) {
  return (
    <LenisProvider>
      <ScrollProgress />
      <CustomCursor />
      <AmbientBackground />
      <ScrollReveal />
      <VisitorTracker />
      {children}
      <FloatingCallWidget />
    </LenisProvider>
  );
}
