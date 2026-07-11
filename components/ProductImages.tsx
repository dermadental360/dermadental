"use client";

import { useState } from "react";

interface ProductImagesProps {
  images: string[];
  name: string;
}

export function ProductImages({ images, name }: ProductImagesProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="product-image card" style={{ aspectRatio: "1/1", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-secondary)" }}>
        <span style={{ color: "var(--muted)" }}>No image available</span>
      </div>
    );
  }

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
      {/* Main Image View */}
      <div 
        className="product-image card" 
        style={{ 
          aspectRatio: "1/1", 
          width: "100%", 
          position: "relative", 
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fff"
        }}
      >
        <img 
          src={images[activeIndex]} 
          alt={`${name} - View ${activeIndex + 1}`}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "all 0.3s ease-in-out"
          }}
        />

        {images.length > 1 && (
          <>
            {/* Prev Button */}
            <button
              onClick={handlePrev}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(255, 255, 255, 0.75)",
                backdropFilter: "blur(4px)",
                border: "1px solid var(--line)",
                borderRadius: "50%",
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "var(--shadow-sm)",
                transition: "var(--transition-smooth)",
                color: "var(--ink)",
                zIndex: 2,
              }}
              aria-label="Previous image"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--white)";
                e.currentTarget.style.transform = "translateY(-50%) scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.75)";
                e.currentTarget.style.transform = "translateY(-50%) scale(1)";
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            {/* Next Button */}
            <button
              onClick={handleNext}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(255, 255, 255, 0.75)",
                backdropFilter: "blur(4px)",
                border: "1px solid var(--line)",
                borderRadius: "50%",
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "var(--shadow-sm)",
                transition: "var(--transition-smooth)",
                color: "var(--ink)",
                zIndex: 2,
              }}
              aria-label="Next image"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--white)";
                e.currentTarget.style.transform = "translateY(-50%) scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.75)";
                e.currentTarget.style.transform = "translateY(-50%) scale(1)";
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            {/* Image Indicator Overlay */}
            <div
              style={{
                position: "absolute",
                bottom: 12,
                right: 12,
                background: "rgba(26, 37, 34, 0.65)",
                color: "var(--white)",
                padding: "4px 8px",
                borderRadius: 99,
                fontSize: 12,
                fontWeight: 500,
                backdropFilter: "blur(4px)",
                pointerEvents: "none"
              }}
            >
              {activeIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails list */}
      {images.length > 1 && (
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              style={{
                width: 64,
                height: 64,
                borderRadius: "var(--radius-sm)",
                overflow: "hidden",
                border: idx === activeIndex ? "2px solid var(--sage)" : "1px solid var(--line)",
                cursor: "pointer",
                padding: 0,
                backgroundColor: "#fff",
                transition: "var(--transition-smooth)",
                flexShrink: 0,
                outline: "none"
              }}
              aria-label={`View image ${idx + 1}`}
            >
              <img 
                src={img} 
                alt={`${name} thumbnail ${idx + 1}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
