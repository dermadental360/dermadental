"use client";

import React, { useRef, useState } from "react";
import { useMotion } from "./MotionProvider";

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  [key: string]: any;
}

export function MagneticButton({
  children,
  className = "",
  onClick,
  ...props
}: MagneticButtonProps) {
  const { isDesktop, isReducedMotion } = useMotion();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDesktop || isReducedMotion || !buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const distanceX = (e.clientX - centerX) * 0.25;
    const distanceY = (e.clientY - centerY) * 0.25;

    setPosition({ x: distanceX, y: distanceY });
  };

  const handleMouseLeave = () => {
    if (!isDesktop || isReducedMotion) return;
    setPosition({ x: 0, y: 0 });
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const newRipple = { id: Date.now(), x, y };
      setRipples((prev) => [...prev.slice(-3), newRipple]);
    }
    if (onClick) onClick(e);
  };

  return (
    <div
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className={`relative inline-block overflow-hidden transition-transform duration-200 ease-out cursor-pointer ${className}`}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0px)`,
        willChange: "transform",
      }}
      {...props}
    >
      {children}

      {/* Ripple Click Effect */}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="pointer-events-none absolute rounded-full bg-white/30 animate-ping duration-700 -translate-x-1/2 -translate-y-1/2"
          style={{
            left: r.x,
            top: r.y,
            width: "120px",
            height: "120px",
          }}
        />
      ))}
    </div>
  );
}
