"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { LazyMotion, domMax, m, AnimatePresence } from "framer-motion";
import { HeroSlide } from "@/lib/slides";

interface HeroSliderProps {
  slides?: HeroSlide[];
}

export function HeroSlider({ slides: initialSlides }: HeroSliderProps) {
  const [slides, setSlides] = useState<HeroSlide[]>(initialSlides || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Filter only enabled slides
  const activeSlides = slides.filter((s) => s.enabled);

  useEffect(() => {
    if (!initialSlides || initialSlides.length === 0) {
      fetch("/api/slides")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setSlides(data);
        })
        .catch((err) => console.error("Error fetching slides:", err));
    }
  }, [initialSlides]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Preload NEXT slide image in background after initial page paint is complete
  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const timer = setTimeout(() => {
      const nextIndex = (currentIndex + 1) % activeSlides.length;
      const nextSlide = activeSlides[nextIndex];
      if (nextSlide) {
        const desktopSrc = nextSlide.desktopImage;
        const mobileSrc = nextSlide.mobileImage || desktopSrc;
        [desktopSrc, mobileSrc].forEach((src) => {
          if (src && !loadedImages[src]) {
            const img = new window.Image();
            img.src = src;
            img.onload = () => {
              setLoadedImages((prev) => ({ ...prev, [src]: true }));
            };
          }
        });
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [activeSlides, currentIndex, loadedImages]);

  const handleNext = useCallback(() => {
    if (activeSlides.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % activeSlides.length);
  }, [activeSlides.length]);

  const handlePrev = useCallback(() => {
    if (activeSlides.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex - 1 + activeSlides.length) % activeSlides.length);
  }, [activeSlides.length]);

  // Autoplay timer (5 seconds)
  useEffect(() => {
    if (isPaused || activeSlides.length <= 1) return;
    const timer = setInterval(() => {
      handleNext();
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused, activeSlides.length, handleNext]);

  // Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (activeSlides.length === 0) return null;

  const currentSlide = activeSlides[currentIndex] || activeSlides[0];

  const currentMediaSrc = isMobile
    ? currentSlide.mobileImage || currentSlide.desktopImage
    : currentSlide.desktopImage;

  const currentVideoSrc = isMobile
    ? currentSlide.mobileVideoUrl || currentSlide.videoUrl
    : currentSlide.videoUrl;

  // First slide preloading link
  const firstSlideSrc = activeSlides[0]
    ? isMobile ? activeSlides[0].mobileImage || activeSlides[0].desktopImage : activeSlides[0].desktopImage
    : "";

  return (
    <LazyMotion features={domMax}>
      <section
        className="luxury-hero-container"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        aria-label="Derma Dental Luxury Hero Banner"
      >
        {/* Persistent Pre-Rendered Slide Images Stack */}
        <div className="luxury-hero-media-stack" style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          {activeSlides.map((slide, index) => {
            const isCurrent = index === currentIndex;
            const isFirst = index === 0;
            const mediaSrc = isMobile ? slide.mobileImage || slide.desktopImage : slide.desktopImage;
            const videoSrc = isMobile ? slide.mobileVideoUrl || slide.videoUrl : slide.videoUrl;
            const shouldRenderMedia = isCurrent || isFirst || loadedImages[mediaSrc];

            return (
              <div
                key={slide.id}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: isCurrent ? 1 : 0,
                  transition: "opacity 1.1s cubic-bezier(0.16, 1, 0.3, 1)",
                  zIndex: isCurrent ? 2 : 1,
                  pointerEvents: isCurrent ? "auto" : "none",
                  willChange: "opacity, transform",
                }}
              >
                <m.div
                  className="luxury-hero-bg-inner"
                  initial={{ scale: 1 }}
                  animate={{ scale: isCurrent ? 1.07 : 1 }}
                  transition={{ duration: isCurrent ? 6 : 0, ease: "linear" }}
                  style={{ width: "100%", height: "100%", position: "relative" }}
                >
                  {shouldRenderMedia && (
                    videoSrc ? (
                      <video
                        src={videoSrc}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="luxury-hero-media"
                        poster={mediaSrc}
                      />
                    ) : (
                      <Image
                        src={mediaSrc}
                        alt={slide.altText || slide.title}
                        fill
                        priority={isFirst}
                        loading={isFirst ? "eager" : "lazy"}
                        fetchPriority={isFirst ? "high" : "auto"}
                        className="luxury-hero-media"
                        sizes="(max-width: 768px) 100vw, 1200px"
                        quality={65}
                      />
                    )
                  )}
                </m.div>

                {/* Decorative Sunlight & Leaf Shadow Overlays */}
                <div className="luxury-hero-sunlight-beam"></div>
                <div className="luxury-hero-leaf-shadow"></div>

                {/* Readability Overlay Gradient */}
                <div
                  className="luxury-hero-overlay"
                  style={{
                    background: `linear-gradient(90deg, var(--hero-overlay-bg, rgba(11, 47, 53, 0.55)) 0%, rgba(11, 47, 53, ${slide.overlayOpacity || 0.35}) 50%, rgba(11, 47, 53, 0.05) 100%)`,
                  }}
                ></div>
              </div>
            );
          })}
        </div>

        {/* Luxury Animated Text & Content Grid (Staggered Crossfade) */}
        <AnimatePresence mode="wait">
          <m.div
            key={currentSlide.id}
            className="luxury-hero-slide"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ zIndex: 10 }}
          >
            <div className="container luxury-hero-content-wrapper">
              <div className="luxury-hero-content">
                {/* Eyebrow */}
                <div className="luxury-hero-eyebrow-chip">
                  <span className="luxury-hero-dot"></span>
                  <span>{currentSlide.eyebrow}</span>
                </div>

                {/* Title */}
                <h1 className="luxury-hero-title">
                  {currentSlide.title}
                </h1>

                {/* Description */}
                <p className="luxury-hero-description">
                  {currentSlide.subtitle}
                </p>

                {/* CTA Button & Highlights */}
                <div className="luxury-hero-actions">
                  <Link href={currentSlide.ctaUrl || "/shop"} className="luxury-hero-btn">
                    <span>{currentSlide.ctaText || "Discover Collection"}</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </Link>

                  <div className="luxury-hero-badge">
                    <span className="badge-icon">🌿</span>
                    <span>Dermatologist Formulated</span>
                  </div>
                </div>
              </div>
            </div>
          </m.div>
        </AnimatePresence>

        {/* Slide Navigation Arrows */}
        {activeSlides.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="luxury-hero-arrow prev"
              aria-label="Previous Slide"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>

            <button
              onClick={handleNext}
              className="luxury-hero-arrow next"
              aria-label="Next Slide"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </>
        )}

        {/* Clickable Navigation Dots with Active Progress Indicator */}
        {activeSlides.length > 1 && (
          <div className="luxury-hero-dots">
            {activeSlides.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => setCurrentIndex(index)}
                className={`luxury-hero-dot-btn ${index === currentIndex ? "active" : ""}`}
                aria-label={`Go to slide ${index + 1}`}
              >
                <span className="dot-track">
                  {index === currentIndex && (
                    <m.span
                      className="dot-progress"
                      initial={{ width: "0%" }}
                      animate={{ width: isPaused ? "100%" : "100%" }}
                      transition={{ duration: isPaused ? 0 : 5, ease: "linear" }}
                    />
                  )}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
    </LazyMotion>
  );
}
