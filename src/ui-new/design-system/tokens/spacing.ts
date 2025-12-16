/**
 * Spacing tokens based on 4px base unit system
 * Used for padding, margins, and gaps
 */

export const spacing = {
  // Base spacing scale (4px increments)
  0: "0px",
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
  20: "80px",
  24: "96px",
} as const;

// Semantic spacing names
export const spacingSemantic = {
  xs: spacing[1], // 4px
  sm: spacing[2], // 8px
  md: spacing[3], // 12px
  base: spacing[4], // 16px
  lg: spacing[5], // 20px
  xl: spacing[6], // 24px
  "2xl": spacing[8], // 32px
  "3xl": spacing[10], // 40px
  "4xl": spacing[12], // 48px
  "5xl": spacing[16], // 64px
} as const;

// Type exports
export type SpacingToken = typeof spacing;
export type SpacingSemanticToken = typeof spacingSemantic;
