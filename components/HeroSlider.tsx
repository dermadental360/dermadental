"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { HeroSlide } from "@/lib/slides";

interface HeroSliderProps {
  slides?: HeroSlide[];
}

export function HeroSlider({ slides: initialSlides }: HeroSliderProps) {
  const [slides, setSlides] = useState<HeroSlide[]>(initialSlides || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
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
  const nextSlide = activeSlides[(currentIndex + 1) % activeSlides.length];

  const currentMediaSrc = isMobile
    ? currentSlide.mobileImage || currentSlide.desktopImage
    : currentSlide.desktopImage;

  const currentVideoSrc = isMobile
    ? currentSlide.mobileVideoUrl || currentSlide.videoUrl
    : currentSlide.videoUrl;

  const nextMediaSrc = isMobile
    ? nextSlide?.mobileImage || nextSlide?.desktopImage
    : nextSlide?.desktopImage;

  return (
    <section
      className="luxury-hero-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="Derma Dental Luxury Hero Banner"
    >
      {/* Background Hidden Preloader for Next Slide */}
      {nextMediaSrc && (
        <link rel="preload" as="image" href={nextMediaSrc} />
      )}

      {/* Main Slide Carousel Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide.id}
          className="luxury-hero-slide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Background Image / Video Container with Ken Burns Zoom Effect */}
          <div className="luxury-hero-bg-wrapper">
            <motion.div
              className="luxury-hero-bg-inner"
              initial={{ scale: 1 }}
              animate={{ scale: 1.07 }}
              transition={{ duration: 6, ease: "linear" }}
            >
              {currentVideoSrc ? (
                <video
                  src={currentVideoSrc}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="luxury-hero-media"
                  poster={currentMediaSrc}
                />
              ) : (
                <Image
                  src={currentMediaSrc}
                  alt={currentSlide.altText || currentSlide.title}
                  fill
                  priority={currentIndex === 0}
                  className="luxury-hero-media"
                  sizes="100vw"
                  quality={90}
                />
              )}
            </motion.div>

            {/* Natural Sunlight & Soft Leaf Shadow Decorative Layers */}
            <div className="luxury-hero-sunlight-beam"></div>
            <div className="luxury-hero-leaf-shadow"></div>

            {/* Customizable Readability Overlay Gradient */}
            <div
              className="luxury-hero-overlay"
              style={{
                background: `linear-gradient(90deg, rgba(26, 37, 34, ${currentSlide.overlayOpacity + 0.35}) 0%, rgba(26, 37, 34, ${currentSlide.overlayOpacity}) 50%, rgba(26, 37, 34, 0.05) 100%)`,
              }}
            ></div>
          </div>

          {/* Luxury Text & Content Grid */}
          <div className="container luxury-hero-content-wrapper">
            <div className="luxury-hero-content">
              {/* Eyebrow */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="luxury-hero-eyebrow-chip"
              >
                <span className="luxury-hero-dot"></span>
                <span>{currentSlide.eyebrow}</span>
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.35 }}
                className="luxury-hero-title"
              >
                {currentSlide.title}
              </motion.h1>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.5 }}
                className="luxury-hero-description"
              >
                {currentSlide.subtitle}
              </motion.p>

              {/* CTA Button & Highlights */}
              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.65 }}
                className="luxury-hero-actions"
              >
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
              </motion.div>
            </div>
          </div>
        </motion.div>
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

      {/* Clickable Navigation Dots with Animated Active Indicator */}
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
                  <motion.span
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
  );
}
