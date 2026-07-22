"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { THEME_PRESETS, ThemeColors, DEFAULT_THEME_COLORS } from "@/lib/theme";

export function AdminThemeManager() {
  const { colors, applyTheme, resetTheme } = useTheme();
  const [localColors, setLocalColors] = useState<ThemeColors>(colors);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("turquoise");

  useEffect(() => {
    setLocalColors(colors);
  }, [colors]);

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    const updated = { ...localColors, [key]: value };
    setLocalColors(updated);
    applyTheme(updated); // Live preview!
  };

  const handlePresetSelect = (presetKey: string) => {
    setSelectedPreset(presetKey);
    const preset = THEME_PRESETS[presetKey];
    if (preset) {
      setLocalColors(preset.colors);
      applyTheme(preset.colors); // Live preview!
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess(false);

      const res = await fetch("/api/admin/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localColors),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save theme");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save theme");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm("Reset website colors back to default Turquoise Blue?")) {
      resetTheme();
      setLocalColors(DEFAULT_THEME_COLORS);
      setSelectedPreset("turquoise");
    }
  };

  const colorFields: Array<{ key: keyof ThemeColors; label: string }> = [
    { key: "primary", label: "Primary Color" },
    { key: "primaryHover", label: "Primary Hover Color" },
    { key: "secondary", label: "Secondary Color" },
    { key: "accent", label: "Accent Color" },
    { key: "heroOverlay", label: "Hero Overlay Color" },
    { key: "buttonColor", label: "Button Color" },
    { key: "buttonHoverColor", label: "Button Hover Color" },
    { key: "linkColor", label: "Link Color" },
    { key: "navActiveColor", label: "Navigation Active Color" },
    { key: "navHoverColor", label: "Navigation Hover Color" },
    { key: "cardBackground", label: "Card Background" },
    { key: "pageBackground", label: "Page Background" },
    { key: "sectionBackground", label: "Section Background" },
    { key: "footerBackground", label: "Footer Background" },
    { key: "borderColor", label: "Border Color" },
    { key: "inputBorder", label: "Input Border" },
    { key: "inputFocusColor", label: "Input Focus Color" },
    { key: "iconColor", label: "Icon Color" },
    { key: "successColor", label: "Success Color" },
    { key: "warningColor", label: "Warning Color" },
    { key: "errorColor", label: "Error Color" },
    { key: "textPrimary", label: "Text Primary" },
    { key: "textSecondary", label: "Text Secondary" },
    { key: "headingColor", label: "Heading Color" },
  ];

  return (
    <div style={{ marginTop: 20, maxWidth: 960 }}>
      {/* Header Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, color: "var(--sage-dark)", fontWeight: 700 }}>Website Theme Manager</h2>
          <p style={{ fontSize: 14, color: "var(--muted)" }}>
            Customize global brand colors dynamically with live preview across all pages.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button type="button" className="btn secondary" onClick={handleReset} style={{ borderRadius: 8 }}>
            🔄 Reset Defaults
          </button>
          <button type="button" className="btn" onClick={handleSave} disabled={saving} style={{ borderRadius: 8 }}>
            {saving ? "Saving Theme..." : "💾 Save Theme Settings"}
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
          ✓ Theme saved successfully! All website pages and components are updated live.
        </div>
      )}

      {/* Theme Presets Selector */}
      <div className="card pad" style={{ marginBottom: 24, borderRadius: 12 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Choose Theme Preset</h3>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {Object.keys(THEME_PRESETS).map((key) => {
            const preset = THEME_PRESETS[key];
            const isSelected = selectedPreset === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handlePresetSelect(key)}
                style={{
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: isSelected ? "2px solid var(--primary)" : "1px solid var(--line)",
                  background: isSelected ? "var(--primary-light)" : "var(--white)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 14,
                  fontWeight: isSelected ? 600 : 400,
                }}
              >
                <span
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    backgroundColor: preset.colors.primary,
                    display: "inline-block",
                  }}
                />
                <span>{preset.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Color Pickers Grid */}
      <div className="card pad" style={{ borderRadius: 12 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Detailed Color Tokens</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {colorFields.map((field) => {
            const val = localColors[field.key] || "#000000";
            return (
              <div
                key={field.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  border: "1px solid var(--line)",
                  borderRadius: 8,
                  background: "var(--white)",
                }}
              >
                <label style={{ fontSize: 13, fontWeight: 500, flexGrow: 1 }}>{field.label}</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="color"
                    value={val.startsWith("#") ? val : "#14b8c4"}
                    onChange={(e) => handleColorChange(field.key, e.target.value)}
                    style={{ width: 34, height: 34, border: "none", background: "none", cursor: "pointer", borderRadius: 4 }}
                  />
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => handleColorChange(field.key, e.target.value)}
                    style={{ width: 90, padding: "4px 8px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 12, fontFamily: "monospace" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
