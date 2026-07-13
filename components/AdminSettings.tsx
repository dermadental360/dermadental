"use client";

import React, { useState, useEffect, useRef } from "react";
import { compressImage } from "@/lib/imageCompressor";

export function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [initialSettings, setInitialSettings] = useState<Record<string, string>>({});

  // Homepage Hero Form fields
  const [topBarText, setTopBarText] = useState("");
  const [heroEyebrow, setHeroEyebrow] = useState("");
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroImage, setHeroImage] = useState("");

  // About Form fields
  const [aboutEyebrow, setAboutEyebrow] = useState("");
  const [aboutTitle, setAboutTitle] = useState("");
  const [aboutSubtitle, setAboutSubtitle] = useState("");
  const [aboutImage, setAboutImage] = useState("");

  // Consultation Form fields
  const [consultationEyebrow, setConsultationEyebrow] = useState("");
  const [consultationTitle, setConsultationTitle] = useState("");
  const [consultationSubtitle, setConsultationSubtitle] = useState("");
  const [consultationImage, setConsultationImage] = useState("");

  const heroFileInputRef = useRef<HTMLInputElement>(null);
  const aboutFileInputRef = useRef<HTMLInputElement>(null);
  const consultationFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to load settings");
      const data = await res.json();
      
      const normalizedData = {
        top_bar_text: data.top_bar_text || "",
        hero_eyebrow: data.hero_eyebrow || "",
        hero_title: data.hero_title || "",
        hero_subtitle: data.hero_subtitle || "",
        hero_image: data.hero_image || "",
        about_eyebrow: data.about_eyebrow || "",
        about_title: data.about_title || "",
        about_subtitle: data.about_subtitle || "",
        about_image: data.about_image || "",
        consultation_eyebrow: data.consultation_eyebrow || "",
        consultation_title: data.consultation_title || "",
        consultation_subtitle: data.consultation_subtitle || "",
        consultation_image: data.consultation_image || "",
      };

      setInitialSettings(normalizedData);
      
      setTopBarText(normalizedData.top_bar_text);
      setHeroEyebrow(normalizedData.hero_eyebrow);
      setHeroTitle(normalizedData.hero_title);
      setHeroSubtitle(normalizedData.hero_subtitle);
      setHeroImage(normalizedData.hero_image);

      setAboutEyebrow(normalizedData.about_eyebrow);
      setAboutTitle(normalizedData.about_title);
      setAboutSubtitle(normalizedData.about_subtitle);
      setAboutImage(normalizedData.about_image);

      setConsultationEyebrow(normalizedData.consultation_eyebrow);
      setConsultationTitle(normalizedData.consultation_title);
      setConsultationSubtitle(normalizedData.consultation_subtitle);
      setConsultationImage(normalizedData.consultation_image);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGenericFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string, setter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingField(field);
      setError("");
      
      const compressedFile = await compressImage(file, 1000, 1000, 0.75);
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

      if (!res.ok) {
        throw new Error(data.error || "Failed to upload image");
      }

      setter(data.url);
    } catch (err: any) {
      setError(`Image upload failed for ${field}: ` + err.message);
    } finally {
      setUploadingField(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      setSuccess(false);

      const currentSettings = {
        top_bar_text: topBarText,
        hero_eyebrow: heroEyebrow,
        hero_title: heroTitle,
        hero_subtitle: heroSubtitle,
        hero_image: heroImage,
        about_eyebrow: aboutEyebrow,
        about_title: aboutTitle,
        about_subtitle: aboutSubtitle,
        about_image: aboutImage,
        consultation_eyebrow: consultationEyebrow,
        consultation_title: consultationTitle,
        consultation_subtitle: consultationSubtitle,
        consultation_image: consultationImage,
      };

      // Dirty checking: Determine changed settings
      const updatedFields: Record<string, string> = {};
      let hasChanges = false;
      for (const key of Object.keys(currentSettings) as Array<keyof typeof currentSettings>) {
        if (currentSettings[key] !== initialSettings[key]) {
          updatedFields[key] = currentSettings[key];
          hasChanges = true;
        }
      }

      if (!hasChanges) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        return;
      }

      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      });

      let data: any = {};
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || `Save failed with status ${res.status}`);
      }

      if (!res.ok) throw new Error(data.error || "Failed to save settings");

      setInitialSettings(currentSettings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading settings...</p>;

  return (
    <div style={{ marginTop: 20, maxWidth: 800 }}>
      <form onSubmit={handleSubmit} className="card pad" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {error && (
          <div style={{ padding: 12, borderRadius: 8, background: "#fee2e2", color: "var(--error)", fontSize: 14 }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ padding: 12, borderRadius: 8, background: "var(--sage-light, #eaf1ec)", color: "var(--success, #3e8e75)", fontSize: 14, fontWeight: 500 }}>
            ✓ Site settings saved successfully! Changes will update the database.
          </div>
        )}

        {/* Header top bar text */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>Header Announcement Text</label>
          <input
            type="text"
            value={topBarText}
            onChange={(e) => setTopBarText(e.target.value)}
            placeholder="e.g. BOOK CLINIC GUIDANCE WITH DR. SADAF YAMIN..."
            style={{
              padding: "10px 14px",
              border: "1px solid var(--line)",
              borderRadius: 6,
              background: "var(--white)",
              fontSize: 14,
            }}
            required
          />
          <span style={{ fontSize: 12, color: "var(--muted)" }}>Displays in the colored banner at the very top of the website.</span>
        </div>

        <hr style={{ border: 0, borderTop: "1px solid var(--line)" }} />
        
        <h3 style={{ fontSize: 18, color: "var(--sage-dark)" }}>Homepage Hero Section</h3>

        {/* Hero Eyebrow */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>Hero Eyebrow Text</label>
          <input
            type="text"
            value={heroEyebrow}
            onChange={(e) => setHeroEyebrow(e.target.value)}
            placeholder="e.g. DERMATOLOGY-LED CARE IN KHAR WEST"
            style={{
              padding: "10px 14px",
              border: "1px solid var(--line)",
              borderRadius: 6,
              background: "var(--white)",
              fontSize: 14,
            }}
            required
          />
        </div>

        {/* Hero Title */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>Hero Title / Heading</label>
          <input
            type="text"
            value={heroTitle}
            onChange={(e) => setHeroTitle(e.target.value)}
            placeholder="e.g. Skin and hair routines chosen with clinical calm."
            style={{
              padding: "10px 14px",
              border: "1px solid var(--line)",
              borderRadius: 6,
              background: "var(--white)",
              fontSize: 14,
            }}
            required
          />
        </div>

        {/* Hero Subtitle */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>Hero Subtitle / Paragraph</label>
          <textarea
            value={heroSubtitle}
            onChange={(e) => setHeroSubtitle(e.target.value)}
            rows={3}
            placeholder="e.g. Shop dermatologist-curated skincare..."
            style={{
              padding: "10px 14px",
              border: "1px solid var(--line)",
              borderRadius: 6,
              background: "var(--white)",
              fontSize: 14,
              resize: "vertical",
            }}
            required
          />
        </div>

        {/* Hero Image */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>Hero Banner Image</label>
          <div style={{ display: "flex", gap: 20, alignItems: "start", flexWrap: "wrap" }}>
            <div style={{ width: 200, height: 120, border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img
                src={heroImage || "/api/placeholder?label=No+Image"}
                alt="Hero banner preview"
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
              />
            </div>
            <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                type="text"
                value={heroImage}
                onChange={(e) => setHeroImage(e.target.value)}
                placeholder="Image path or absolute URL"
                style={{
                  padding: "10px 14px",
                  border: "1px solid var(--line)",
                  borderRadius: 6,
                  background: "var(--white)",
                  fontSize: 14,
                  width: "100%",
                }}
                required
              />
              <div>
                <input
                  type="file"
                  accept="image/*"
                  ref={heroFileInputRef}
                  onChange={(e) => handleGenericFileUpload(e, "hero", setHeroImage)}
                  style={{ display: "none" }}
                />
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => heroFileInputRef.current?.click()}
                  disabled={uploadingField !== null}
                  style={{ borderRadius: 6, fontSize: 13, padding: "10px 16px" }}
                >
                  {uploadingField === "hero" ? "Uploading..." : "📤 Upload Hero Image"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <hr style={{ border: 0, borderTop: "1px solid var(--line)" }} />
        
        <h3 style={{ fontSize: 18, color: "var(--sage-dark)" }}>About Page Settings</h3>

        {/* About Eyebrow */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>About Eyebrow Text</label>
          <input
            type="text"
            value={aboutEyebrow}
            onChange={(e) => setAboutEyebrow(e.target.value)}
            placeholder="e.g. Dermatologist-led Care"
            style={{
              padding: "10px 14px",
              border: "1px solid var(--line)",
              borderRadius: 6,
              background: "var(--white)",
              fontSize: 14,
            }}
            required
          />
        </div>

        {/* About Title */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>About Title</label>
          <input
            type="text"
            value={aboutTitle}
            onChange={(e) => setAboutTitle(e.target.value)}
            placeholder="e.g. About DermaDental360"
            style={{
              padding: "10px 14px",
              border: "1px solid var(--line)",
              borderRadius: 6,
              background: "var(--white)",
              fontSize: 14,
            }}
            required
          />
        </div>

        {/* About Subtitle */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>About Description</label>
          <textarea
            value={aboutSubtitle}
            onChange={(e) => setAboutSubtitle(e.target.value)}
            rows={3}
            placeholder="About description text..."
            style={{
              padding: "10px 14px",
              border: "1px solid var(--line)",
              borderRadius: 6,
              background: "var(--white)",
              fontSize: 14,
              resize: "vertical",
            }}
            required
          />
        </div>

        {/* About Image */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>About Doctor/Clinic Image</label>
          <div style={{ display: "flex", gap: 20, alignItems: "start", flexWrap: "wrap" }}>
            <div style={{ width: 200, height: 120, border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img
                src={aboutImage || "/api/placeholder?label=No+Image"}
                alt="About page preview"
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
              />
            </div>
            <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                type="text"
                value={aboutImage}
                onChange={(e) => setAboutImage(e.target.value)}
                placeholder="Image path or absolute URL"
                style={{
                  padding: "10px 14px",
                  border: "1px solid var(--line)",
                  borderRadius: 6,
                  background: "var(--white)",
                  fontSize: 14,
                  width: "100%",
                }}
                required
              />
              <div>
                <input
                  type="file"
                  accept="image/*"
                  ref={aboutFileInputRef}
                  onChange={(e) => handleGenericFileUpload(e, "about", setAboutImage)}
                  style={{ display: "none" }}
                />
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => aboutFileInputRef.current?.click()}
                  disabled={uploadingField !== null}
                  style={{ borderRadius: 6, fontSize: 13, padding: "10px 16px" }}
                >
                  {uploadingField === "about" ? "Uploading..." : "📤 Upload About Image"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <hr style={{ border: 0, borderTop: "1px solid var(--line)" }} />
        
        <h3 style={{ fontSize: 18, color: "var(--sage-dark)" }}>Consultation Page Settings</h3>

        {/* Consultation Eyebrow */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>Consultation Eyebrow Text</label>
          <input
            type="text"
            value={consultationEyebrow}
            onChange={(e) => setConsultationEyebrow(e.target.value)}
            placeholder="e.g. Medical Consultation"
            style={{
              padding: "10px 14px",
              border: "1px solid var(--line)",
              borderRadius: 6,
              background: "var(--white)",
              fontSize: 14,
            }}
            required
          />
        </div>

        {/* Consultation Title */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>Consultation Title</label>
          <input
            type="text"
            value={consultationTitle}
            onChange={(e) => setConsultationTitle(e.target.value)}
            placeholder="e.g. Book clinic guidance"
            style={{
              padding: "10px 14px",
              border: "1px solid var(--line)",
              borderRadius: 6,
              background: "var(--white)",
              fontSize: 14,
            }}
            required
          />
        </div>

        {/* Consultation Subtitle */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>Consultation Description</label>
          <textarea
            value={consultationSubtitle}
            onChange={(e) => setConsultationSubtitle(e.target.value)}
            rows={3}
            placeholder="Consultation description text..."
            style={{
              padding: "10px 14px",
              border: "1px solid var(--line)",
              borderRadius: 6,
              background: "var(--white)",
              fontSize: 14,
              resize: "vertical",
            }}
            required
          />
        </div>

        {/* Consultation Image */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>Consultation Display Image</label>
          <div style={{ display: "flex", gap: 20, alignItems: "start", flexWrap: "wrap" }}>
            <div style={{ width: 200, height: 120, border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img
                src={consultationImage || "/api/placeholder?label=No+Image"}
                alt="Consultation page preview"
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
              />
            </div>
            <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                type="text"
                value={consultationImage}
                onChange={(e) => setConsultationImage(e.target.value)}
                placeholder="Image path or absolute URL"
                style={{
                  padding: "10px 14px",
                  border: "1px solid var(--line)",
                  borderRadius: 6,
                  background: "var(--white)",
                  fontSize: 14,
                  width: "100%",
                }}
                required
              />
              <div>
                <input
                  type="file"
                  accept="image/*"
                  ref={consultationFileInputRef}
                  onChange={(e) => handleGenericFileUpload(e, "consultation", setConsultationImage)}
                  style={{ display: "none" }}
                />
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => consultationFileInputRef.current?.click()}
                  disabled={uploadingField !== null}
                  style={{ borderRadius: 6, fontSize: 13, padding: "10px 16px" }}
                >
                  {uploadingField === "consultation" ? "Uploading..." : "📤 Upload Consultation Image"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <button type="submit" className="btn" disabled={saving} style={{ borderRadius: 8, padding: "12px 28px" }}>
            {saving ? "Saving Changes..." : "Save Configuration"}
          </button>
        </div>
      </form>
    </div>
  );
}
