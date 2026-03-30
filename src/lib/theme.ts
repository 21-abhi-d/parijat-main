/**
 * Central brand token file for Parijat Boutique.
 *
 * This is the single source of truth for all brand decisions.
 * When final brand assets arrive, update values here and in globals.css.
 * No component code needs to change when swapping tokens.
 *
 * Inspired by the Parijat flower — white petals with a deep orange stalk.
 */
export const theme = {
  colors: {
    primary: "#F97316",           // Parijat orange (orange-500)
    primaryForeground: "#FFFFFF",
    primaryHover: "#EA580C",      // Deeper orange for hover states (orange-600)
    secondary: "#FFF7ED",         // Soft cream (orange-50)
    secondaryForeground: "#9A3412",
    accent: "#EA580C",            // orange-600
    background: "#FFFFFF",
    foreground: "#1C1917",        // Warm near-black (stone-900)
    muted: "#F5F5F4",             // stone-100
    mutedForeground: "#78716C",   // stone-500
    border: "#E7E5E4",            // stone-200
    ring: "#F97316",              // Focus ring matches primary
    destructive: "#EF4444",       // red-500
    destructiveForeground: "#FFFFFF",
    card: "#FFFFFF",
    cardForeground: "#1C1917",
  },

  fonts: {
    // Placeholders — replace with actual font names when brand assets arrive.
    // 1. Add font files to /public/fonts/
    // 2. Use next/font/local in layout.tsx
    // 3. Assign to CSS variables below in globals.css
    heading: "var(--font-heading)",   // e.g. Playfair Display — elegant serif
    body: "var(--font-body)",         // e.g. Inter — clean sans-serif
    accent: "var(--font-accent)",     // e.g. Dancing Script — decorative flourish
  },

  borderRadius: {
    sm: "0.25rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
    full: "9999px",
  },

  spacing: {
    // Responsive section padding tokens used directly as Tailwind classes
    sectionY: "py-16 md:py-24",
    containerX: "px-4 md:px-8 lg:px-16",
    containerMaxW: "max-w-7xl mx-auto",
  },
} as const;

export type ThemeColors = keyof typeof theme.colors;
