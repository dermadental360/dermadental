"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_THEME_COLORS, ThemeColors } from "@/lib/theme";

interface ThemeContextType {
  colors: ThemeColors;
  setColors: React.Dispatch<React.SetStateAction<ThemeColors>>;
  applyTheme: (newColors: ThemeColors) => void;
  resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: DEFAULT_THEME_COLORS,
  setColors: () => {},
  applyTheme: () => {},
  resetTheme: () => {},
});

export function ThemeProvider({ children, initialColors }: { children: React.ReactNode; initialColors?: ThemeColors }) {
  const [colors, setColors] = useState<ThemeColors>(initialColors || DEFAULT_THEME_COLORS);

  const injectCSSVariables = (theme: ThemeColors) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    root.style.setProperty("--primary", theme.primary);
    root.style.setProperty("--primary-hover", theme.primaryHover);
    root.style.setProperty("--primary-dark", theme.secondary);
    root.style.setProperty("--primary-light", theme.secondary ? theme.primary + "15" : "#E6FAFC");
    root.style.setProperty("--accent", theme.accent);

    root.style.setProperty("--bg-primary", theme.pageBackground);
    root.style.setProperty("--bg-secondary", theme.sectionBackground);
    root.style.setProperty("--surface", theme.cardBackground);
    root.style.setProperty("--line", theme.borderColor);
    root.style.setProperty("--input-border", theme.inputBorder);
    root.style.setProperty("--input-focus", theme.inputFocusColor);

    root.style.setProperty("--ink", theme.textPrimary);
    root.style.setProperty("--heading", theme.headingColor);
    root.style.setProperty("--muted", theme.textSecondary);

    root.style.setProperty("--button-bg", theme.buttonColor);
    root.style.setProperty("--button-hover", theme.buttonHoverColor);
    root.style.setProperty("--link-color", theme.linkColor);
    root.style.setProperty("--nav-active", theme.navActiveColor);
    root.style.setProperty("--nav-hover", theme.navHoverColor);

    root.style.setProperty("--hero-overlay-bg", theme.heroOverlay);
    root.style.setProperty("--footer-bg", theme.footerBackground);

    root.style.setProperty("--sage", theme.primary);
    root.style.setProperty("--sage-dark", theme.secondary);
    root.style.setProperty("--sage-light", theme.primary + "15");
    root.style.setProperty("--gold", theme.primary);

    root.style.setProperty("--success", theme.successColor);
    root.style.setProperty("--warning", theme.warningColor);
    root.style.setProperty("--error", theme.errorColor);
  };

  useEffect(() => {
    injectCSSVariables(colors);
  }, [colors]);

  useEffect(() => {
    if (!initialColors) {
      fetch("/api/theme")
        .then((res) => res.json())
        .then((data) => {
          if (data && data.primary) {
            setColors(data);
          }
        })
        .catch(() => {});
    }
  }, [initialColors]);

  const applyTheme = (newColors: ThemeColors) => {
    setColors(newColors);
    injectCSSVariables(newColors);
  };

  const resetTheme = () => {
    applyTheme(DEFAULT_THEME_COLORS);
  };

  return (
    <ThemeContext.Provider value={{ colors, setColors, applyTheme, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
