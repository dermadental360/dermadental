"use client";

import React, { useState, useEffect, useRef } from "react";
import { HeroSlide } from "@/lib/slides";
import { HeroSlider } from "@/components/HeroSlider";
import { compressImage } from "@/lib/imageCompressor";

export function AdminHeroSlides() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/slides");
      if (!res.ok) throw new Error("Failed to load hero slides");
      const data = await res.json();
      if (Array.isArray(data)) {
        setSlides(data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load slides");
    } finally {
      setLoading(false);
    }
  };

  const handleSlideChange = (index: number, field: keyof HeroSlide, value: any) => {
    setSlides((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddSlide = () => {
    const newSlide: HeroSlide = {
      id: "slide-" + Date.now(),
      eyebrow: "New Luxury Eyebrow",
      title: "New Headline Title",
      subtitle: "New slide description text highlighting dermatologist care.",
      ctaText: "Discover Now",
      ctaUrl: "/shop",
      desktopImage: "/hero/slide-1.jpg",
      mobileImage: "/hero/slide-1.jpg",
      altText: "New skincare slide image",
      overlayOpacity: 0.25,
      enabled: true,
      order: slides.length + 1,
    };
    setSlides((prev) => [...prev, newSlide]);
  };

  const handleDeleteSlide = (index: number) => {
    if (slides.length <= 1) {
      alert("At least one slide is required.");
      return;
    }
    if (confirm("Are you sure you want to delete this slide?")) {
      setSlides((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleMoveSlide = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === slides.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    setSlides((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      // Reassign order properties
      return copy.map((slide, i) => ({ ...slide, order: i + 1 }));
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, slideIndex: number, field: "desktopImage" | "mobileImage") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fieldKey = `${slideIndex}-${field}`;
    try {
      setUploadingField(fieldKey);
      setError("");

      const compressedFile = await compressImage(file, 1920, 1080, 0.85);
      const formData = new FormData();
      formData.append("file", compressedFile);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      let data: any = {};
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || `Upload failed with status ${res.status}`);
      }

      if (!res.ok) throw new Error(data.error || "Failed to upload image");

      handleSlideChange(slideIndex, field, data.url);
    } catch (err: any) {
      setError(`Image upload failed: ${err.message}`);
    } finally {
      setUploadingField(null);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess(false);

      const res = await fetch("/api/admin/slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slides),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save slides");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save slides");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading Hero Slider Management...</p>;

  return (
    <div style={{ marginTop: 20, maxWidth: 960 }}>
      {/* Action Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, color: "var(--sage-dark)", fontWeight: 700 }}>Hero Slider Management</h2>
          <p style={{ fontSize: 14, color: "var(--muted)" }}>
            Customize homepage banner images, videos, text, CTA buttons, and ordering.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="button"
            className="btn secondary"
            onClick={() => setShowPreview(!showPreview)}
            style={{ borderRadius: 8 }}
          >
            {showPreview ? "Close Preview" : "👁️ Live Preview"}
          </button>
          <button
            type="button"
            className="btn"
            onClick={handleSave}
            disabled={saving}
            style={{ borderRadius: 8 }}
          >
            {saving ? "Publishing..." : "💾 Save & Publish Slides"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: 14, borderRadius: 8, background: "#fee2e2", color: "var(--error)", fontSize: 14, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ padding: 14, borderRadius: 8, background: "var(--sage-light)", color: "var(--success)", fontSize: 14, fontWeight: 500, marginBottom: 20 }}>
          ✓ Hero slides saved successfully! The homepage slider has updated dynamic content.
        </div>
      )}

      {/* Interactive Live Slider Preview Modal */}
      {showPreview && (
        <div className="card pad" style={{ marginBottom: 30, background: "#111816", color: "#fff", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: 1, color: "var(--gold)" }}>Live Hero Slider Preview</span>
            <button onClick={() => setShowPreview(false)} style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: 16 }}>✕ Close</button>
          </div>
          <HeroSlider slides={slides} />
        </div>
      )}

      {/* Slide Edit Cards List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {slides.map((slide, index) => {
          const fieldKeyDesktop = `${index}-desktopImage`;
          const fieldKeyMobile = `${index}-mobileImage`;

          return (
            <div
              key={slide.id || index}
              className="card pad"
              style={{
                borderRadius: 12,
                border: "1px solid var(--line)",
                background: slide.enabled ? "var(--white)" : "#f8faf9",
                opacity: slide.enabled ? 1 : 0.75,
                position: "relative",
              }}
            >
              {/* Card Header & Reorder Tools */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid var(--line)", paddingBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "var(--sage-dark)" }}>Slide #{index + 1}</span>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={slide.enabled}
                      onChange={(e) => handleSlideChange(index, "enabled", e.target.checked)}
                    />
                    <span>{slide.enabled ? "Enabled" : "Disabled"}</span>
                  </label>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => handleMoveSlide(index, "up")}
                    disabled={index === 0}
                    style={{ padding: "4px 10px", borderRadius: 4, border: "1px solid var(--line)", background: "none", cursor: index === 0 ? "default" : "pointer" }}
                    title="Move Up"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveSlide(index, "down")}
                    disabled={index === slides.length - 1}
                    style={{ padding: "4px 10px", borderRadius: 4, border: "1px solid var(--line)", background: "none", cursor: index === slides.length - 1 ? "default" : "pointer" }}
                    title="Move Down"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSlide(index)}
                    style={{ padding: "4px 12px", borderRadius: 4, border: "none", background: "#fee2e2", color: "var(--error)", fontSize: 13, cursor: "pointer", fontWeight: 600 }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>

              {/* Form Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {/* Left Column: Text & CTA */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 13, fontWeight: 600 }}>Eyebrow Text</label>
                    <input
                      type="text"
                      value={slide.eyebrow}
                      onChange={(e) => handleSlideChange(index, "eyebrow", e.target.value)}
                      placeholder="e.g. Clinical Skincare Collection"
                      style={{ padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 6, fontSize: 14 }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 13, fontWeight: 600 }}>Main Headline</label>
                    <input
                      type="text"
                      value={slide.title}
                      onChange={(e) => handleSlideChange(index, "title", e.target.value)}
                      placeholder="e.g. Dermatologist-Formulated Radiance"
                      style={{ padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 6, fontSize: 14, fontWeight: 600 }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 13, fontWeight: 600 }}>Description Subtitle</label>
                    <textarea
                      value={slide.subtitle}
                      onChange={(e) => handleSlideChange(index, "subtitle", e.target.value)}
                      rows={3}
                      placeholder="Slide description text..."
                      style={{ padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 6, fontSize: 14, resize: "vertical" }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <label style={{ fontSize: 13, fontWeight: 600 }}>CTA Button Text</label>
                      <input
                        type="text"
                        value={slide.ctaText}
                        onChange={(e) => handleSlideChange(index, "ctaText", e.target.value)}
                        placeholder="e.g. Explore Essentials"
                        style={{ padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 6, fontSize: 14 }}
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <label style={{ fontSize: 13, fontWeight: 600 }}>CTA Destination URL</label>
                      <input
                        type="text"
                        value={slide.ctaUrl}
                        onChange={(e) => handleSlideChange(index, "ctaUrl", e.target.value)}
                        placeholder="e.g. /shop"
                        style={{ padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 6, fontSize: 14 }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 13, fontWeight: 600 }}>Image Alt Text (SEO)</label>
                    <input
                      type="text"
                      value={slide.altText || ""}
                      onChange={(e) => handleSlideChange(index, "altText", e.target.value)}
                      placeholder="e.g. Glass serum bottle resting on beige marble"
                      style={{ padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 6, fontSize: 14 }}
                    />
                  </div>
                </div>

                {/* Right Column: Media Uploads & Readability */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* Desktop Image */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 13, fontWeight: 600 }}>Desktop Banner Image (1920x1080)</label>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <input
                        type="text"
                        value={slide.desktopImage}
                        onChange={(e) => handleSlideChange(index, "desktopImage", e.target.value)}
                        placeholder="Image URL or Path"
                        style={{ padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 6, fontSize: 13, flexGrow: 1 }}
                      />
                      <input
                        type="file"
                        accept="image/*"
                        ref={(el) => { fileInputRefs.current[fieldKeyDesktop] = el; }}
                        onChange={(e) => handleFileUpload(e, index, "desktopImage")}
                        style={{ display: "none" }}
                      />
                      <button
                        type="button"
                        className="btn secondary"
                        onClick={() => fileInputRefs.current[fieldKeyDesktop]?.click()}
                        disabled={uploadingField === fieldKeyDesktop}
                        style={{ padding: "8px 12px", fontSize: 12, borderRadius: 6 }}
                      >
                        {uploadingField === fieldKeyDesktop ? "Uploading..." : "📤 Upload"}
                      </button>
                    </div>
                  </div>

                  {/* Mobile Image */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 13, fontWeight: 600 }}>Mobile Banner Image (Portrait/1080x1350)</label>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <input
                        type="text"
                        value={slide.mobileImage || slide.desktopImage}
                        onChange={(e) => handleSlideChange(index, "mobileImage", e.target.value)}
                        placeholder="Mobile Image URL or Path"
                        style={{ padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 6, fontSize: 13, flexGrow: 1 }}
                      />
                      <input
                        type="file"
                        accept="image/*"
                        ref={(el) => { fileInputRefs.current[fieldKeyMobile] = el; }}
                        onChange={(e) => handleFileUpload(e, index, "mobileImage")}
                        style={{ display: "none" }}
                      />
                      <button
                        type="button"
                        className="btn secondary"
                        onClick={() => fileInputRefs.current[fieldKeyMobile]?.click()}
                        disabled={uploadingField === fieldKeyMobile}
                        style={{ padding: "8px 12px", fontSize: 12, borderRadius: 6 }}
                      >
                        {uploadingField === fieldKeyMobile ? "Uploading..." : "📤 Upload"}
                      </button>
                    </div>
                  </div>

                  {/* Optional Video Banner */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 13, fontWeight: 600 }}>Optional Video URL (MP4/WebM)</label>
                    <input
                      type="text"
                      value={slide.videoUrl || ""}
                      onChange={(e) => handleSlideChange(index, "videoUrl", e.target.value)}
                      placeholder="e.g. https://domain.com/banner-video.mp4"
                      style={{ padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 6, fontSize: 13 }}
                    />
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>If specified, plays muted autoplay loop video with image fallback.</span>
                  </div>

                  {/* Overlay Opacity Slider */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <label style={{ fontSize: 13, fontWeight: 600 }}>Dark Text Overlay Strength</label>
                      <span style={{ fontSize: 12, color: "var(--sage-dark)", fontWeight: 600 }}>{Math.round((slide.overlayOpacity || 0.25) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="0.6"
                      step="0.05"
                      value={slide.overlayOpacity ?? 0.25}
                      onChange={(e) => handleSlideChange(index, "overlayOpacity", parseFloat(e.target.value))}
                      style={{ width: "100%", accentColor: "var(--sage-dark)" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Slide Button */}
      <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          type="button"
          className="btn secondary"
          onClick={handleAddSlide}
          style={{ padding: "12px 24px", borderRadius: 8 }}
        >
          ➕ Add New Slide
        </button>

        <button
          type="button"
          className="btn"
          onClick={handleSave}
          disabled={saving}
          style={{ padding: "12px 32px", borderRadius: 8 }}
        >
          {saving ? "Publishing..." : "💾 Save & Publish All Slides"}
        </button>
      </div>
    </div>
  );
}
