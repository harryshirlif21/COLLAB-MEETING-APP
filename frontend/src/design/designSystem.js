/**
 * Design System Constants
 * Glassmorphic dark-first theme with Framer Motion ready
 */

export const designSystem = {
  colors: {
    background: {
      primary: "#0f1117",
      secondary: "#16181f",
      tertiary: "#1a1d27",
      glass: "rgba(15, 17, 23, 0.7)",
    },
    text: {
      primary: "#e8eaf0",
      secondary: "#9ca3af",
      accent: "#818cf8",
      muted: "#6b7280",
    },
    ui: {
      border: "#23262f",
      hover: "#2d3044",
      active: "#4f46e5",
      success: "#4ade80",
      warning: "#fbbf24",
      error: "#f87171",
    },
  },

  typography: {
    fontFamily: "'DM Sans', 'Inter', -apple-system, sans-serif",
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  spacing: {
    "2xs": "2px",
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
    "2xl": "32px",
    "3xl": "48px",
  },

  shadow: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
    md: "0 4px 8px rgba(0, 0, 0, 0.1)",
    lg: "0 10px 24px rgba(0, 0, 0, 0.15)",
    glass: "0 8px 32px rgba(0, 0, 0, 0.2)",
  },

  borderRadius: {
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    "2xl": "20px",
    full: "9999px",
  },

  transitions: {
    fast: "0.15s ease-out",
    normal: "0.3s ease-out",
    slow: "0.5s ease-out",
  },
};

/**
 * Animation Presets for Framer Motion
 */
export const animationPresets = {
  fadeInUp: {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -14 },
    transition: { duration: 0.3 },
  },

  fadeInDown: {
    initial: { opacity: 0, y: -14 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 14 },
    transition: { duration: 0.3 },
  },

  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.2 },
  },

  slideIn: {
    initial: { x: -20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -20, opacity: 0 },
    transition: { duration: 0.3 },
  },

  hover: {
    scale: 1.05,
    transition: { duration: 0.2 },
  },

  tap: {
    scale: 0.95,
  },
};

/**
 * Layout Grid System
 */
export const grid = {
  container: {
    maxWidth: "1440px",
    padding: "24px",
  },

  gap: {
    xs: "8px",
    sm: "12px",
    md: "16px",
    lg: "24px",
  },
};

/**
 * Responsive Breakpoints
 */
export const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

export default designSystem;
