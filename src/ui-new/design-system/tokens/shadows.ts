/**
 * Shadow/Elevation tokens for depth and layering
 * Based on common design patterns and Figma specifications
 */

export const shadows = {
  // Subtle shadows
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  base: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
  "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)",
  none: "none",
} as const;

// Semantic shadow names
export const shadowsSemantic = {
  card: shadows.md,
  dropdown: shadows.lg,
  modal: shadows["2xl"],
  button: shadows.sm,
  input: shadows.inner,
} as const;

// Type exports
export type ShadowToken = typeof shadows;
export type ShadowSemanticToken = typeof shadowsSemantic;
