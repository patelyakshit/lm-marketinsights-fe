/**
 * Design System Index
 * Central export for all design tokens and utilities
 */

export * from "./tokens/colors";
export * from "./tokens/typography";
export * from "./tokens/spacing";
export * from "./tokens/radius";
export * from "./tokens/shadows";

// Re-export all tokens as a single object for convenience
import { colors } from "./tokens/colors";
import { typography } from "./tokens/typography";
import { spacing, spacingSemantic } from "./tokens/spacing";
import { radius, radiusSemantic } from "./tokens/radius";
import { shadows, shadowsSemantic } from "./tokens/shadows";

export const tokens = {
  colors,
  typography,
  spacing,
  spacingSemantic,
  radius,
  radiusSemantic,
  shadows,
  shadowsSemantic,
} as const;
