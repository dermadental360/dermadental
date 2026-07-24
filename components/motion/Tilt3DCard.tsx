"use client";

import React, { useRef, useState } from "react";
import { useMotion } from "./MotionProvider";

interface Tilt3DCardProps {
  children: React.ReactNode;
  className?: string;
}

export function Tilt3DCard({ children, className = "" }: Tilt3DCardProps) {
  const { isDesktop, isReducedMotion } = useMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const [transformStyle, setTransformStyle] = useState("");
  const [glareStyle, setGlareStyle] = useState({ opacity: 0, x: "50%", y: "50%" });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDesktop || isReducedMotion || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate rotation (-8 to +8 degrees)
    const rotateY = ((mouseX / width) - 0.5) * 16;
    const rotateX = ((0.5 - (mouseY / height))) * 16;

    setTransformStyle(
      `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`
    );

    // Specular light position
    const glareX = ((mouseX / width) * 100).toFixed(1);
    const glareY = ((mouseY / height) * 100).toFixed(1);
    setGlareStyle({ opacity: 0.15, x: `${glareX}%`, y: `${glareY}%` });
  };

  const handleMouseLeave = () => {
    if (!isDesktop || isReducedMotion) return;
    setTransformStyle("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
    setGlareStyle((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`tilt-card relative transition-transform duration-300 ease-out ${className}`}
      style={{
        transform: transformStyle,
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
    >
      {children}
      {/* Specular Glare Reflection Overlay */}
      {isDesktop && !isReducedMotion && (
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 z-10"
          style={{
            opacity: glareStyle.opacity,
            background: `radial-gradient(circle at ${glareStyle.x} ${glareStyle.y}, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 60%)`,
          }}
        />
      )}
    </div>
  );
}
