/**
 * Border radius tokens from Figma design system
 */

export const radius = {
  4: "4px", // Radius/radius-4
  6: "6px", // Radius/radius-6
  8: "8px", // Radius/radius-8
  10: "10px", // Radius/radius-10
  12: "12px", // Radius/radius-12
  full: "999px", // Radius/radius-full (or 9999px)
} as const;

// Semantic radius names
export const radiusSemantic = {
  none: "0px",
  sm: radius[4], // 4px
  md: radius[6], // 6px
  base: radius[8], // 8px
  lg: radius[10], // 10px
  xl: radius[12], // 12px
  full: radius.full, // 999px
} as const;

// Type exports
export type RadiusToken = typeof radius;
export type RadiusSemanticToken = typeof radiusSemantic;
