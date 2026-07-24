"use client";

import React, { useEffect, useRef, useState } from "react";
import { useMotion } from "./MotionProvider";

interface TextRevealProps {
  children: string;
  type?: "character" | "word" | "fade";
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";
  delay?: number;
}

export function TextReveal({
  children,
  type = "word",
  className = "",
  as: Component = "div",
  delay = 0,
}: TextRevealProps) {
  const { isReducedMotion, isAdmin } = useMotion();
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isReducedMotion || isAdmin) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (elementRef.current) observer.unobserve(elementRef.current);
        }
      },
      { threshold: 0.15 }
    );

    if (elementRef.current) observer.observe(elementRef.current);

    return () => observer.disconnect();
  }, [isReducedMotion, isAdmin]);

  if (isReducedMotion || isAdmin || type === "fade") {
    return (
      <Component
        ref={elementRef as any}
        className={`transition-all duration-700 ease-out ${className} ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
        style={{ transitionDelay: `${delay}ms`, willChange: "transform, opacity" }}
      >
        {children}
      </Component>
    );
  }

  if (type === "character") {
    const characters = children.split("");
    return (
      <Component ref={elementRef as any} className={`inline-block overflow-hidden ${className}`}>
        {characters.map((char, index) => (
          <span
            key={index}
            className={`inline-block transition-all duration-500 ease-out ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full"
            }`}
            style={{
              transitionDelay: `${delay + index * 25}ms`,
              willChange: "transform, opacity",
            }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </Component>
    );
  }

  // Word Reveal
  const words = children.split(" ");
  return (
    <Component ref={elementRef as any} className={`inline-block ${className}`}>
      {words.map((word, index) => (
        <span key={index} className="inline-block overflow-hidden mr-[0.25em] align-top">
          <span
            className={`inline-block transition-all duration-600 ease-out ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full"
            }`}
            style={{
              transitionDelay: `${delay + index * 40}ms`,
              willChange: "transform, opacity",
            }}
          >
            {word}
          </span>
        </span>
      ))}
    </Component>
  );
}
