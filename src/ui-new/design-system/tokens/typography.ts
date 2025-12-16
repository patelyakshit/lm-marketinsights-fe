/**
 * Typography tokens extracted from Figma design system
 * Font families, sizes, weights, and line heights
 */

export const typography = {
  // Font Families
  fontFamily: {
    primary: "Switzer", // Default font for ui-new folder
    secondary: "Switzer", // Switzer used throughout
    fallback: "sans-serif", // Fallback font stack
  },

  // Paragraph Styles
  paragraph: {
    xSmall: {
      fontFamily: "Switzer, sans-serif",
      fontSize: "12px",
      fontWeight: 400,
      lineHeight: "16px",
    },
    small: {
      fontFamily: "Switzer, sans-serif",
      fontSize: "14px",
      fontWeight: 400,
      lineHeight: "20px",
    },
    medium: {
      fontFamily: "Switzer, sans-serif",
      fontSize: "16px",
      fontWeight: 400,
      lineHeight: "24px",
    },
  },

  // Label Styles
  label: {
    small: {
      fontFamily: "Switzer, sans-serif",
      fontSize: "14px",
      fontWeight: 500,
      lineHeight: "20px",
    },
    medium: {
      fontFamily: "Switzer, sans-serif",
      fontSize: "16px",
      fontWeight: 500,
      lineHeight: "24px",
    },
  },

  // Subheading Styles
  subheading: {
    "2xSmall": {
      fontFamily: "Switzer, sans-serif",
      fontSize: "11px",
      fontWeight: 500,
      lineHeight: "12px",
    },
  },

  // Font Sizes (for utility classes)
  fontSize: {
    xs: "11px",
    sm: "12px",
    base: "14px",
    md: "16px",
    lg: "18px",
    xl: "24px",
    "2xl": "42px",
    "3xl": "56px",
  },

  // Font Weights
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
  },

  // Line Heights
  lineHeight: {
    tight: "12px",
    normal: "16px",
    relaxed: "20px",
    loose: "24px",
  },
} as const;

// Type exports
export type TypographyToken = typeof typography;
