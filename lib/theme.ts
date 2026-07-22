export interface ThemeColors {
  primary: string;
  primaryHover: string;
  secondary: string;
  accent: string;
  heroOverlay: string;
  buttonColor: string;
  buttonHoverColor: string;
  linkColor: string;
  navActiveColor: string;
  navHoverColor: string;
  cardBackground: string;
  pageBackground: string;
  sectionBackground: string;
  footerBackground: string;
  borderColor: string;
  inputBorder: string;
  inputFocusColor: string;
  iconColor: string;
  successColor: string;
  warningColor: string;
  errorColor: string;
  textPrimary: string;
  textSecondary: string;
  headingColor: string;
}

export const THEME_PRESETS: Record<string, { name: string; colors: ThemeColors }> = {
  turquoise: {
    name: "Turquoise Blue (Default)",
    colors: {
      primary: "#14B8C4",
      primaryHover: "#0EA5B5",
      secondary: "#0F7F8F",
      accent: "#38D9E6",
      heroOverlay: "rgba(11, 47, 53, 0.35)",
      buttonColor: "#14B8C4",
      buttonHoverColor: "#0EA5B5",
      linkColor: "#14B8C4",
      navActiveColor: "#14B8C4",
      navHoverColor: "#0EA5B5",
      cardBackground: "#FFFFFF",
      pageBackground: "#FFFFFF",
      sectionBackground: "#F8FCFD",
      footerBackground: "#0b2f35",
      borderColor: "#D7EEF2",
      inputBorder: "#D7EEF2",
      inputFocusColor: "#14B8C4",
      iconColor: "#14B8C4",
      successColor: "#22C55E",
      warningColor: "#F59E0B",
      errorColor: "#EF4444",
      textPrimary: "#1F2937",
      textSecondary: "#6B7280",
      headingColor: "#111827",
    },
  },
  emerald: {
    name: "Emerald Green",
    colors: {
      primary: "#10B981",
      primaryHover: "#059669",
      secondary: "#047857",
      accent: "#34D399",
      heroOverlay: "rgba(6, 78, 59, 0.35)",
      buttonColor: "#10B981",
      buttonHoverColor: "#059669",
      linkColor: "#10B981",
      navActiveColor: "#10B981",
      navHoverColor: "#059669",
      cardBackground: "#FFFFFF",
      pageBackground: "#FFFFFF",
      sectionBackground: "#ECFDF5",
      footerBackground: "#064E3B",
      borderColor: "#D1FAE5",
      inputBorder: "#D1FAE5",
      inputFocusColor: "#10B981",
      iconColor: "#10B981",
      successColor: "#10B981",
      warningColor: "#F59E0B",
      errorColor: "#EF4444",
      textPrimary: "#111827",
      textSecondary: "#4B5563",
      headingColor: "#064E3B",
    },
  },
  royal: {
    name: "Royal Blue",
    colors: {
      primary: "#2563EB",
      primaryHover: "#1D4ED8",
      secondary: "#1E40AF",
      accent: "#60A5FA",
      heroOverlay: "rgba(30, 58, 138, 0.35)",
      buttonColor: "#2563EB",
      buttonHoverColor: "#1D4ED8",
      linkColor: "#2563EB",
      navActiveColor: "#2563EB",
      navHoverColor: "#1D4ED8",
      cardBackground: "#FFFFFF",
      pageBackground: "#FFFFFF",
      sectionBackground: "#EFF6FF",
      footerBackground: "#1E3A8A",
      borderColor: "#DBEAFE",
      inputBorder: "#DBEAFE",
      inputFocusColor: "#2563EB",
      iconColor: "#2563EB",
      successColor: "#22C55E",
      warningColor: "#F59E0B",
      errorColor: "#EF4444",
      textPrimary: "#1E293B",
      textSecondary: "#64748B",
      headingColor: "#0F172A",
    },
  },
  dark: {
    name: "Luxurious Dark",
    colors: {
      primary: "#38D9E6",
      primaryHover: "#14B8C4",
      secondary: "#0F7F8F",
      accent: "#38D9E6",
      heroOverlay: "rgba(0, 0, 0, 0.6)",
      buttonColor: "#38D9E6",
      buttonHoverColor: "#14B8C4",
      linkColor: "#38D9E6",
      navActiveColor: "#38D9E6",
      navHoverColor: "#14B8C4",
      cardBackground: "#1F2937",
      pageBackground: "#111827",
      sectionBackground: "#1F2937",
      footerBackground: "#030712",
      borderColor: "#374151",
      inputBorder: "#374151",
      inputFocusColor: "#38D9E6",
      iconColor: "#38D9E6",
      successColor: "#22C55E",
      warningColor: "#F59E0B",
      errorColor: "#EF4444",
      textPrimary: "#F9FAFB",
      textSecondary: "#9CA3AF",
      headingColor: "#FFFFFF",
    },
  },
  luxuryWhite: {
    name: "Luxury White Minimalist",
    colors: {
      primary: "#18181B",
      primaryHover: "#27272A",
      secondary: "#3F3F46",
      accent: "#71717A",
      heroOverlay: "rgba(24, 24, 27, 0.4)",
      buttonColor: "#18181B",
      buttonHoverColor: "#27272A",
      linkColor: "#18181B",
      navActiveColor: "#18181B",
      navHoverColor: "#27272A",
      cardBackground: "#FFFFFF",
      pageBackground: "#FAFAFA",
      sectionBackground: "#F4F4F5",
      footerBackground: "#18181B",
      borderColor: "#E4E4E7",
      inputBorder: "#E4E4E7",
      inputFocusColor: "#18181B",
      iconColor: "#18181B",
      successColor: "#22C55E",
      warningColor: "#F59E0B",
      errorColor: "#EF4444",
      textPrimary: "#18181B",
      textSecondary: "#71717A",
      headingColor: "#09090B",
    },
  },
};

export const DEFAULT_THEME_COLORS: ThemeColors = THEME_PRESETS.turquoise.colors;
