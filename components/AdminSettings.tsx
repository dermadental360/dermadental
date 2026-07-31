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

  // Business & Compliance fields
  const [legalEntityName, setLegalEntityName] = useState("");
  const [gstin, setGstin] = useState("");
  const [registeredAddress, setRegisteredAddress] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [supportPhone, setSupportPhone] = useState("");

  // Cash on Delivery (COD) Business Rules fields
  const [codEnabled, setCodEnabled] = useState(true);
  const [codMinAmount, setCodMinAmount] = useState("500");
  const [codMaxAmount, setCodMaxAmount] = useState("5000");
  const [codFeeEnabled, setCodFeeEnabled] = useState(false);
  const [codFeeAmount, setCodFeeAmount] = useState("0");

  // Marketing & Analytics (Meta Pixel) fields
  const [metaPixelEnabled, setMetaPixelEnabled] = useState(false);
  const [metaPixelId, setMetaPixelId] = useState("1040837018670941");
  const [metaPixelAdvancedMatching, setMetaPixelAdvancedMatching] = useState(true);
  const [metaPixelAutoPageView, setMetaPixelAutoPageView] = useState(true);
  const [metaPixelTestMode, setMetaPixelTestMode] = useState(false);

  const [shippingHighlights, setShippingHighlights] = useState<Array<{icon: string, title: string, text: string}>>([]);

  const handleHighlightChange = (index: number, field: 'icon' | 'title' | 'text', value: string) => {
    setShippingHighlights(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddHighlight = () => {
    setShippingHighlights(prev => [...prev, { icon: "🚚", title: "New Highlight", text: "Highlight description text." }]);
  };

  const handleDeleteHighlight = (index: number) => {
    setShippingHighlights(prev => prev.filter((_, i) => i !== index));
  };

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
        shipping_highlights: data.shipping_highlights || JSON.stringify([
          { icon: "🚚", title: "Free Express Shipping", text: "On orders above ₹999. Same day dispatch." },
          { icon: "📦", title: "Secure Delivery", text: "Standard delivery in 3 to 5 business days." },
          { icon: "🛡️", title: "Authentic Clinic Sourced", text: "Directly selected and recommended by our medical experts." }
        ]),
        legal_entity_name: data.legal_entity_name || "Moeen International",
        gstin: data.gstin || "27AHTPG5622L2ZU",
        registered_address: data.registered_address || "Flat No 10, New Ambe Bhavan, Rd Number 24, Khar W, Mumbai, Maharashtra 400052",
        support_email: data.support_email || "dd360health@gmail.com",
        support_phone: data.support_phone || "9833699887",
        cod_enabled: data.cod_enabled || "true",
        cod_min_amount: data.cod_min_amount || "500",
        cod_max_amount: data.cod_max_amount || "5000",
        cod_fee_enabled: data.cod_fee_enabled || "false",
        cod_fee_amount: data.cod_fee_amount || "0",
        meta_pixel_enabled: data.meta_pixel_enabled || "false",
        meta_pixel_id: data.meta_pixel_id || "1040837018670941",
        meta_pixel_advanced_matching: data.meta_pixel_advanced_matching || "true",
        meta_pixel_auto_pageview: data.meta_pixel_auto_pageview || "true",
        meta_pixel_test_mode: data.meta_pixel_test_mode || "false",
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

      setLegalEntityName(normalizedData.legal_entity_name);
      setGstin(normalizedData.gstin);
      setRegisteredAddress(normalizedData.registered_address);
      setSupportEmail(normalizedData.support_email);
      setSupportPhone(normalizedData.support_phone);

      setCodEnabled(normalizedData.cod_enabled === "true");
      setCodMinAmount(normalizedData.cod_min_amount);
      setCodMaxAmount(normalizedData.cod_max_amount);
      setCodFeeEnabled(normalizedData.cod_fee_enabled === "true");
      setCodFeeAmount(normalizedData.cod_fee_amount);

      setMetaPixelEnabled(normalizedData.meta_pixel_enabled === "true");
      setMetaPixelId(normalizedData.meta_pixel_id);
      setMetaPixelAdvancedMatching(normalizedData.meta_pixel_advanced_matching !== "false");
      setMetaPixelAutoPageView(normalizedData.meta_pixel_auto_pageview !== "false");
      setMetaPixelTestMode(normalizedData.meta_pixel_test_mode === "true");

      try {
        setShippingHighlights(JSON.parse(normalizedData.shipping_highlights));
      } catch (e) {
        setShippingHighlights([]);
      }
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

      // Validate Pixel ID: must only accept numbers
      const trimmedPixelId = metaPixelId.trim();
      if (metaPixelEnabled) {
        if (!trimmedPixelId) {
          throw new Error("Meta Pixel ID cannot be empty when Meta Pixel is enabled.");
        }
        if (!/^\d+$/.test(trimmedPixelId)) {
          throw new Error("Meta Pixel ID is invalid. Pixel ID must contain numbers only.");
        }
      } else if (trimmedPixelId && !/^\d+$/.test(trimmedPixelId)) {
        throw new Error("Meta Pixel ID is invalid. Pixel ID must contain numbers only.");
      }

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
        shipping_highlights: JSON.stringify(shippingHighlights),
        legal_entity_name: legalEntityName,
        gstin: gstin,
        registered_address: registeredAddress,
        support_email: supportEmail,
        support_phone: supportPhone,
        cod_enabled: codEnabled ? "true" : "false",
        cod_min_amount: codMinAmount,
        cod_max_amount: codMaxAmount,
        cod_fee_enabled: codFeeEnabled ? "true" : "false",
        cod_fee_amount: codFeeAmount,
        meta_pixel_enabled: metaPixelEnabled ? "true" : "false",
        meta_pixel_id: trimmedPixelId,
        meta_pixel_advanced_matching: metaPixelAdvancedMatching ? "true" : "false",
        meta_pixel_auto_pageview: metaPixelAutoPageView ? "true" : "false",
        meta_pixel_test_mode: metaPixelTestMode ? "true" : "false",
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

        <hr style={{ border: 0, borderTop: "1px solid var(--line)" }} />
        
        <h3 style={{ fontSize: 18, color: "var(--sage-dark)" }}>🏛️ Business & Merchant Compliance Details</h3>
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: -15, marginBottom: 10 }}>
          Manage official legal entity name, GSTIN, registered address, and support contact details required by payment gateways.
        </p>

        {/* Legal Entity Name */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>Legal Entity Name</label>
          <input
            type="text"
            value={legalEntityName}
            onChange={(e) => setLegalEntityName(e.target.value)}
            placeholder="e.g. Moeen International"
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

        {/* GSTIN */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>GSTIN Registration Number</label>
          <input
            type="text"
            value={gstin}
            onChange={(e) => setGstin(e.target.value)}
            placeholder="e.g. 27AHTPG5622L2ZU"
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

        {/* Registered Address */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>Registered Business Address</label>
          <textarea
            value={registeredAddress}
            onChange={(e) => setRegisteredAddress(e.target.value)}
            rows={2}
            placeholder="e.g. 502, Villa Rosa, 24 & 30 Road, Bandra West, Mumbai 400050"
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

        {/* Support Email */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>Official Support Email</label>
          <input
            type="email"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
            placeholder="e.g. moeenint@gmail.com"
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

        {/* Support Phone */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>Official Support Phone / WhatsApp</label>
          <input
            type="text"
            value={supportPhone}
            onChange={(e) => setSupportPhone(e.target.value)}
            placeholder="e.g. 9833699887"
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

        <hr style={{ border: 0, borderTop: "1px solid var(--line)" }} />
        
        <h3 style={{ fontSize: 18, color: "var(--sage-dark)" }}>💵 Cash on Delivery (COD) Configuration</h3>
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: -15, marginBottom: 10 }}>
          Manage Cash on Delivery availability, minimum/maximum order limits, and optional handling fees.
        </p>

        {/* Enable / Disable COD */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 16px", background: "var(--bg-secondary)", borderRadius: 8 }}>
          <div>
            <label style={{ fontSize: 14, fontWeight: 700, display: "block" }}>Enable Cash on Delivery</label>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>Allow customers to select COD on checkout page.</span>
          </div>
          <input
            type="checkbox"
            checked={codEnabled}
            onChange={(e) => setCodEnabled(e.target.checked)}
            style={{ width: 20, height: 20, accentColor: "var(--sage-dark)" }}
          />
        </div>

        {/* Min and Max Order Limits */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 14, fontWeight: 600 }}>Minimum COD Order Amount (₹)</label>
            <input
              type="number"
              value={codMinAmount}
              onChange={(e) => setCodMinAmount(e.target.value)}
              placeholder="500"
              style={{
                padding: "10px 14px",
                border: "1px solid var(--line)",
                borderRadius: 6,
                background: "var(--white)",
                fontSize: 14,
              }}
              required
            />
            <span style={{ fontSize: 11, color: "var(--muted)" }}>Default: ₹500. Orders below this amount will hide/disable COD.</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 14, fontWeight: 600 }}>Maximum COD Order Amount (₹)</label>
            <input
              type="number"
              value={codMaxAmount}
              onChange={(e) => setCodMaxAmount(e.target.value)}
              placeholder="5000"
              style={{
                padding: "10px 14px",
                border: "1px solid var(--line)",
                borderRadius: 6,
                background: "var(--white)",
                fontSize: 14,
              }}
              required
            />
            <span style={{ fontSize: 11, color: "var(--muted)" }}>Default: ₹5000. Orders above this amount will hide/disable COD.</span>
          </div>
        </div>

        {/* COD Handling Fee Config */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "14px 16px", background: "var(--bg-secondary)", borderRadius: 8, border: "1px solid var(--line)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <label style={{ fontSize: 14, fontWeight: 700, display: "block" }}>Enable COD Handling Fee</label>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>Charge an additional fee (e.g. ₹49 or ₹99) for COD orders.</span>
            </div>
            <input
              type="checkbox"
              checked={codFeeEnabled}
              onChange={(e) => setCodFeeEnabled(e.target.checked)}
              style={{ width: 20, height: 20, accentColor: "var(--sage-dark)" }}
            />
          </div>

          {codFeeEnabled && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>COD Fee Amount (₹)</label>
              <input
                type="number"
                value={codFeeAmount}
                onChange={(e) => setCodFeeAmount(e.target.value)}
                placeholder="49"
                style={{
                  padding: "8px 12px",
                  border: "1px solid var(--line)",
                  borderRadius: 6,
                  background: "var(--white)",
                  fontSize: 14,
                  maxWidth: 200
                }}
                required
              />
            </div>
          )}
        </div>

        <hr style={{ border: 0, borderTop: "1px solid var(--line)" }} />

        {/* Marketing & Analytics - Meta Pixel Section */}
        <h3 id="marketing-analytics" style={{ fontSize: 18, color: "var(--sage-dark)", display: "flex", alignItems: "center", gap: 8 }}>
          <span>📈</span> Marketing &amp; Analytics (Meta / Facebook Pixel)
        </h3>
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: -15, marginBottom: 10 }}>
          Configure Meta (Facebook) Pixel tracking for e-commerce performance analytics, ads retargeting, and Conversion API readiness.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 18, background: "var(--bg-secondary)", padding: 18, borderRadius: 10, border: "1px solid var(--line)" }}>
          {/* 1. Enable Meta Pixel (Toggle) */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, paddingBottom: 12, borderBottom: "1px solid var(--line)" }}>
            <div>
              <label style={{ fontSize: 14, fontWeight: 700, display: "block" }}>Enable Meta Pixel</label>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>Dynamically loads Meta Pixel across all pages. Disabled by default.</span>
            </div>
            <input
              type="checkbox"
              checked={metaPixelEnabled}
              onChange={(e) => setMetaPixelEnabled(e.target.checked)}
              style={{ width: 22, height: 22, accentColor: "var(--sage-dark)", cursor: "pointer" }}
            />
          </div>

          {/* 2. Meta Pixel ID (Text Input) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 14, fontWeight: 600 }}>Meta Pixel ID *</label>
            <input
              type="text"
              value={metaPixelId}
              onChange={(e) => setMetaPixelId(e.target.value)}
              placeholder="e.g. 1040837018670941"
              style={{
                padding: "10px 14px",
                border: "1px solid var(--line)",
                borderRadius: 6,
                background: "var(--white)",
                fontSize: 14,
                fontFamily: "monospace",
                fontWeight: 600,
              }}
            />
            <span style={{ fontSize: 12, color: "var(--muted)" }}>Must contain numbers only (e.g. 1040837018670941). Default: 1040837018670941.</span>
          </div>

          {/* 3. Enable Advanced Matching (Toggle) */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, paddingTop: 6 }}>
            <div>
              <label style={{ fontSize: 14, fontWeight: 600, display: "block" }}>Enable Advanced Matching</label>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>Passes customer attributes (email, phone) securely to improve ad attribution.</span>
            </div>
            <input
              type="checkbox"
              checked={metaPixelAdvancedMatching}
              onChange={(e) => setMetaPixelAdvancedMatching(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: "var(--sage-dark)", cursor: "pointer" }}
            />
          </div>

          {/* 4. Enable Automatic Page Tracking (Toggle) */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, paddingTop: 6 }}>
            <div>
              <label style={{ fontSize: 14, fontWeight: 600, display: "block" }}>Enable Automatic Page Tracking</label>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>Triggers PageView automatically on client-side route changes without duplicates.</span>
            </div>
            <input
              type="checkbox"
              checked={metaPixelAutoPageView}
              onChange={(e) => setMetaPixelAutoPageView(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: "var(--sage-dark)", cursor: "pointer" }}
            />
          </div>

          {/* 5. Test Mode (Toggle) */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, paddingTop: 6, borderTop: "1px solid var(--line)", marginTop: 6 }}>
            <div>
              <label style={{ fontSize: 14, fontWeight: 600, display: "block", color: metaPixelTestMode ? "var(--sage-dark)" : "inherit" }}>Test Mode (Console Logging)</label>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>Logs all Pixel events (PageView, ViewContent, AddToCart, Purchase, etc.) into developer console.</span>
            </div>
            <input
              type="checkbox"
              checked={metaPixelTestMode}
              onChange={(e) => setMetaPixelTestMode(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: "var(--sage-dark)", cursor: "pointer" }}
            />
          </div>
        </div>

        <hr style={{ border: 0, borderTop: "1px solid var(--line)" }} />
        
        <h3 style={{ fontSize: 18, color: "var(--sage-dark)" }}>Product Details Highlights (Shipping, Trust & Badges)</h3>
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: -15, marginBottom: 10 }}>
          Manage the delivery & authentication highlights listed below the "Buy Now" button on the product details page.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {shippingHighlights.map((highlight, index) => (
            <div 
              key={index} 
              className="card" 
              style={{ 
                padding: 16, 
                border: "1px solid var(--line)", 
                borderRadius: 8, 
                background: "var(--bg-secondary, #faf9f6)", 
                display: "flex", 
                flexDirection: "column", 
                gap: 12,
                position: "relative"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--sage-dark)" }}>Highlight #{index + 1}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteHighlight(index)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--error, #dc2626)",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    padding: "4px 8px",
                  }}
                >
                  ✕ Delete Highlight
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Icon/Emoji</label>
                  <input
                    type="text"
                    value={highlight.icon}
                    onChange={(e) => handleHighlightChange(index, "icon", e.target.value)}
                    style={{
                      padding: "8px 10px",
                      border: "1px solid var(--line)",
                      borderRadius: 6,
                      background: "var(--white)",
                      fontSize: 14,
                      textAlign: "center"
                    }}
                    required
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Title</label>
                  <input
                    type="text"
                    value={highlight.title}
                    onChange={(e) => handleHighlightChange(index, "title", e.target.value)}
                    style={{
                      padding: "8px 10px",
                      border: "1px solid var(--line)",
                      borderRadius: 6,
                      background: "var(--white)",
                      fontSize: 14,
                    }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Description Text</label>
                <input
                  type="text"
                  value={highlight.text}
                  onChange={(e) => handleHighlightChange(index, "text", e.target.value)}
                  style={{
                    padding: "8px 10px",
                    border: "1px solid var(--line)",
                    borderRadius: 6,
                    background: "var(--white)",
                    fontSize: 14,
                  }}
                  required
                />
              </div>
            </div>
          ))}

          {shippingHighlights.length === 0 && (
            <div style={{ padding: "20px", textAlign: "center", border: "1px dashed var(--line)", borderRadius: 8, color: "var(--muted)" }}>
              No highlights added yet. Click below to add one.
            </div>
          )}

          <button
            type="button"
            className="btn secondary"
            onClick={handleAddHighlight}
            style={{ alignSelf: "flex-start", borderRadius: 6, fontSize: 13, padding: "8px 16px" }}
          >
            ➕ Add Highlight Card
          </button>
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
