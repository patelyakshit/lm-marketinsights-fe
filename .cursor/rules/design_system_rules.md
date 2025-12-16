# Design System Rules for LM Map Viewer - ui-new Folder

## Overview
This document provides comprehensive rules and guidelines for implementing the new UI redesign in the `ui-new` folder. The design system is based on Figma specifications and uses **Switzer** as the default font family throughout.

---

## 1. Token Definitions

### Location
Design tokens are defined in: `src/ui-new/design-system/tokens/`

### Structure
```
src/ui-new/design-system/
├── index.ts                 # Central export for all tokens
├── global.css              # Global font loading and base styles
└── tokens/
    ├── colors.ts           # Color tokens from Figma
    ├── typography.ts       # Typography tokens (Switzer font)
    ├── spacing.ts          # Spacing scale (4px base unit)
    ├── radius.ts           # Border radius tokens
    └── shadows.ts          # Shadow/elevation tokens
```

### Token Format
Tokens are exported as TypeScript constants with type safety:

```typescript
// Example: colors.ts
export const colors = {
  brand: {
    primary: "#ff7700",
    orange: { 500: "#fa7319" }
  },
  text: {
    strong: { 950: "#171717" },
    sub: { 600: "#5c5c5c" },
    soft: { 400: "#a6a3a0" }
  },
  // ... more color tokens
} as const;

// Usage in components
import { colors, typography, spacing, radius } from "../design-system";
```

### Token Transformation
- **No transformation system** - tokens are used directly as values
- Tokens can be accessed via dot notation: `colors.brand.primary`
- Semantic tokens available: `spacingSemantic`, `radiusSemantic`, `shadowsSemantic`

---

## 2. Typography System

### Default Font: Switzer
**All text in ui-new folder MUST use Switzer font family.**

### Font Loading
Switzer is loaded globally via:
- **CDN**: Google Fonts (configured in `src/ui-new/design-system/global.css`)
- **Alternative**: Local font files can be added to `src/ui-new/assets/fonts/`

### Typography Tokens
```typescript
import { typography } from "../design-system";

// Font Families
typography.fontFamily.primary    // "Switzer"
typography.fontFamily.secondary   // "Switzer"
typography.fontFamily.fallback    // "sans-serif"

// Paragraph Styles
typography.paragraph.xSmall       // 12px, 400 weight, 16px line-height
typography.paragraph.small        // 14px, 400 weight, 20px line-height
typography.paragraph.medium       // 16px, 400 weight, 24px line-height

// Label Styles
typography.label.small            // 14px, 500 weight, 20px line-height
typography.label.medium           // 16px, 500 weight, 24px line-height

// Font Sizes
typography.fontSize.xs            // 11px
typography.fontSize.sm            // 12px
typography.fontSize.base          // 14px
typography.fontSize.md            // 16px
typography.fontSize.lg            // 18px
typography.fontSize.xl            // 24px
typography.fontSize["2xl"]        // 42px
typography.fontSize["3xl"]        // 56px

// Font Weights
typography.fontWeight.regular     // 400
typography.fontWeight.medium      // 500
typography.fontWeight.semibold    // 600

// Line Heights
typography.lineHeight.tight       // 12px
typography.lineHeight.normal      // 16px
typography.lineHeight.relaxed     // 20px
typography.lineHeight.loose       // 24px
```

### Usage Pattern
```typescript
// Inline styles (preferred for exact Figma matching)
<div style={{
  fontFamily: typography.fontFamily.primary,
  fontSize: typography.paragraph.medium.fontSize,
  fontWeight: typography.paragraph.medium.fontWeight,
  lineHeight: typography.paragraph.medium.lineHeight,
}}>
  Text content
</div>

// Tailwind classes (for utility-based styling)
<div className="font-switzer text-base font-normal leading-6">
  Text content
</div>
```

---

## 3. Color System

### Color Tokens Structure
Colors are organized by semantic purpose:

```typescript
colors.brand          // Brand colors (primary, orange)
colors.text           // Text colors (strong, sub, soft)
colors.icon           // Icon colors (strong, sub, soft)
colors.bg             // Background colors (white, weaker, weak, soft, strong, surface)
colors.stroke         // Border/stroke colors (soft, sub)
colors.neutral         // Neutral grays
colors.static          // Static black/white
colors.gray            // Gray scale
```

### Usage Pattern
```typescript
import { colors } from "../design-system";

// Direct usage
<div style={{ color: colors.text.strong[950] }}>
  Strong text
</div>

// Background
<div style={{ backgroundColor: colors.bg.white }}>
  White background
</div>

// Border
<div style={{ borderColor: colors.stroke.soft[200] }}>
  Bordered element
</div>
```

### Figma Color Variables
When extracting colors from Figma:
1. Use the exact hex values from Figma variables
2. Map to semantic token names (e.g., `text/strong-950` → `colors.text.strong[950]`)
3. Document any color variable mappings in `colors.ts`

---

## 4. Spacing System

### Base Unit: 4px
All spacing uses a 4px base unit system.

### Spacing Tokens
```typescript
import { spacing, spacingSemantic } from "../design-system";

// Numeric scale
spacing[0]    // 0px
spacing[1]   // 4px
spacing[2]   // 8px
spacing[3]   // 12px
spacing[4]   // 16px
spacing[5]   // 20px
spacing[6]   // 24px
spacing[8]   // 32px
spacing[10]  // 40px
spacing[12]  // 48px
spacing[16]  // 64px
spacing[20]  // 80px
spacing[24]  // 96px

// Semantic names
spacingSemantic.xs     // 4px
spacingSemantic.sm     // 8px
spacingSemantic.md     // 12px
spacingSemantic.base   // 16px
spacingSemantic.lg     // 20px
spacingSemantic.xl     // 24px
spacingSemantic["2xl"] // 32px
spacingSemantic["3xl"] // 40px
spacingSemantic["4xl"] // 48px
spacingSemantic["5xl"] // 64px
```

### Usage Pattern
```typescript
// Padding
<div style={{ padding: spacing[4] }}>  // 16px

// Margin
<div style={{ margin: spacingSemantic.base }}>  // 16px

// Gap
<div style={{ gap: spacing[2] }}>  // 8px
```

---

## 5. Border Radius

### Radius Tokens
```typescript
import { radius, radiusSemantic } from "../design-system";

radius[4]      // 4px
radius[6]      // 6px
radius[8]      // 8px
radius[10]     // 10px
radius[12]     // 12px
radius.full    // 999px

radiusSemantic.sm     // 4px
radiusSemantic.md     // 6px
radiusSemantic.base   // 8px
radiusSemantic.lg     // 10px
radiusSemantic.xl    // 12px
radiusSemantic.full  // 999px
```

---

## 6. Shadows/Elevation

### Shadow Tokens
```typescript
import { shadows, shadowsSemantic } from "../design-system";

shadows.sm      // Subtle shadow
shadows.base    // Base shadow
shadows.md      // Medium shadow
shadows.lg      // Large shadow
shadows.xl      // Extra large shadow
shadows["2xl"]  // 2x extra large shadow
shadows.inner   // Inner shadow
shadows.none    // No shadow

shadowsSemantic.card     // Card shadow
shadowsSemantic.dropdown // Dropdown shadow
shadowsSemantic.modal    // Modal shadow
shadowsSemantic.button   // Button shadow
shadowsSemantic.input    // Input shadow
```

---

## 7. Component Library

### Component Architecture
Components follow a hierarchical structure:

```
src/ui-new/components/
├── base/              # Base/primitives (Button, Input, Card)
├── composite/         # Composite components (ChatInput, ActionButton)
└── layout/            # Layout components (Header)
```

### Component Pattern
All components use:
- **Class Variance Authority (CVA)** for variant management
- **Radix UI** primitives for accessibility
- **Tailwind CSS** + inline styles for styling
- **TypeScript** for type safety

### Example Component Structure
```typescript
import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import { colors, typography, radius } from "../design-system";

const componentVariants = cva(
  "base-classes",
  {
    variants: {
      variant: {
        default: "variant-classes",
      },
      size: {
        default: "size-classes",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof componentVariants> {}

export const Component = React.forwardRef<HTMLDivElement, ComponentProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(componentVariants({ variant, size }), className)}
        style={{
          fontFamily: typography.fontFamily.primary,
          // ... other inline styles for exact Figma matching
        }}
        {...props}
      />
    );
  }
);
Component.displayName = "Component";
```

### Component Guidelines
1. **Always use Switzer font** - Apply via inline styles or Tailwind classes
2. **Use design tokens** - Never hardcode colors, spacing, or typography values
3. **Match Figma exactly** - Use inline styles when Tailwind classes don't match precisely
4. **Export from index.ts** - Each component folder should have an `index.ts` for clean imports
5. **TypeScript first** - All props should be typed with interfaces

---

## 8. Frameworks & Libraries

### Core Stack
- **Framework**: React 18.2.0
- **Language**: TypeScript 5.8.3
- **Styling**: Tailwind CSS 4.1.11
- **Build**: Vite 7.0.0
- **Animations**: Framer Motion 12.23.12

### UI Libraries
- **Radix UI**: Accordion, Avatar, Checkbox, Popover, Select, Slider, Tooltip
- **Class Variance Authority**: Component variant management
- **Tailwind Merge**: Utility class merging (`cn` helper)
- **Lucide React**: Icon library (secondary to custom SVG icons)

### Integration Pattern
```typescript
// Keep existing logic, wrap with new UI
import { useExistingHook } from '../../hooks/useExistingHook';
import { NewButton } from '../ui-new/components/base/Button';

const NewComponent = () => {
  const { data, handleAction } = useExistingHook(); // Old logic
  
  return (
    <NewButton onClick={handleAction}> {/* New UI */}
      {data}
    </NewButton>
  );
};
```

---

## 9. Asset Management

### Icon System
- **Custom Icons**: React components in `src/components/svg/`
- **Lucide Icons**: Imported from `lucide-react` (use sparingly)
- **New Icons**: Add to `src/ui-new/assets/icons/` (extracted from Figma)

### Icon Usage Pattern
```typescript
// Custom SVG icons (preferred)
import MicIcon from "../../components/svg/MicIcon";
import VoiceModeIcon from "../../components/svg/VoiceModeIcon";
import ArrowUpIcon from "../../components/svg/ArrowUpIcon";

// Usage
<MicIcon width={36} height={36} />
<VoiceModeIcon size={36} isEnabled={true} />
<ArrowUpIcon isEnabled={true} size={32} />

// Lucide icons (secondary)
import { Plus, X, Check } from "lucide-react";
<Plus size={20} />
```

### Image Assets
- **Location**: `src/ui-new/assets/images/`
- **Optimization**: Use WebP format when possible
- **CDN**: Configure if needed in `vite.config.ts`

---

## 10. Styling Approach

### Methodology
- **Primary**: Tailwind CSS utility classes
- **Secondary**: Inline styles for exact Figma matching
- **Global**: CSS file for font loading (`src/ui-new/design-system/global.css`)

### Global Styles
Import global CSS in your main entry point:
```typescript
// src/main.tsx or App.tsx
import "./ui-new/design-system/global.css";
```

### Responsive Design
Use Tailwind responsive breakpoints:
```typescript
<div className="w-full md:w-1/2 lg:w-1/3">
  Responsive content
</div>
```

### Inline Styles for Figma Matching
When Tailwind classes don't match Figma exactly, use inline styles:
```typescript
<div style={{
  fontFamily: typography.fontFamily.primary,
  fontSize: typography.paragraph.medium.fontSize,
  fontWeight: typography.paragraph.medium.fontWeight,
  lineHeight: typography.paragraph.medium.lineHeight,
  letterSpacing: "-0.08px", // Convert percentage to px
  color: colors.text.strong[950],
}}>
  Exact Figma match
</div>
```

---

## 11. Project Structure

### ui-new Folder Organization
```
src/ui-new/
├── assets/
│   ├── icons/          # New icons from Figma
│   └── images/         # Image assets
├── components/
│   ├── base/           # Base components (Button, Input, Card)
│   ├── composite/      # Composite components (ChatInput, ActionButton)
│   └── layout/         # Layout components (Header)
├── design-system/
│   ├── index.ts        # Token exports
│   ├── global.css      # Global font loading
│   └── tokens/        # Design tokens
├── hooks/              # New hooks (if needed)
└── pages/              # New pages (LandingPage)
```

### Integration with Existing Code
- **Hooks**: Reuse existing hooks from `src/hooks/`
- **Contexts**: Reuse existing contexts from `src/contexts/`
- **Utils**: Reuse existing utilities from `src/lib/` and `src/utils/`
- **Types**: Reuse existing types from `src/types/`

---

## 12. Figma Integration Workflow

### Extracting Design Tokens from Figma
1. **Colors**: Extract hex values from Figma variables panel
2. **Typography**: Note font family, size, weight, line-height, letter-spacing
3. **Spacing**: Measure gaps, padding, margins (use 4px base unit)
4. **Radius**: Extract border radius values
5. **Shadows**: Copy shadow CSS values

### Using Figma MCP Tools
```typescript
// Get design context from Figma
mcp_Figma_get_design_context({
  nodeId: "3-1826",
  fileKey: "kF1Ppoh2nLuKEuvcr8JPRH"
});

// Get variable definitions
mcp_Figma_get_variable_defs({
  nodeId: "3-1826",
  fileKey: "kF1Ppoh2nLuKEuvcr8JPRH"
});
```

### Mapping Figma to Code
1. **Figma Variable** → **Token Name**: `text/strong-950` → `colors.text.strong[950]`
2. **Figma Typography** → **Typography Token**: Use `typography.paragraph.medium`
3. **Figma Spacing** → **Spacing Token**: Round to nearest 4px → `spacing[4]`
4. **Figma Colors** → **Color Token**: Extract hex → add to `colors.ts`

---

## 13. Best Practices

### DO ✅
- Always use Switzer font for all text in ui-new
- Use design tokens instead of hardcoded values
- Match Figma designs exactly (use inline styles when needed)
- Export components from index.ts files
- Type all component props with TypeScript
- Reuse existing hooks, contexts, and utilities
- Use semantic token names when available
- Document any deviations from Figma

### DON'T ❌
- Don't use hardcoded colors, spacing, or typography values
- Don't mix old UI components with new UI components
- Don't use fonts other than Switzer in ui-new folder
- Don't create duplicate functionality (reuse existing hooks/utils)
- Don't skip TypeScript types
- Don't use inline styles for everything (prefer Tailwind when possible)

---

## 14. Migration Strategy

### Gradual Migration
1. **Phase 1**: Create ui-new folder structure and design tokens
2. **Phase 2**: Build base components (Button, Input, Card)
3. **Phase 3**: Build composite components (ChatInput, ActionButton)
4. **Phase 4**: Build layout components (Header)
5. **Phase 5**: Build pages (LandingPage)
6. **Phase 6**: Migrate remaining pages/components

### Coexistence
- Old UI (`src/components/`, `src/pages/`) continues to work
- New UI (`src/ui-new/`) is built alongside
- Gradual migration page by page
- No breaking changes to existing functionality

---

## 15. Quick Reference

### Import Pattern
```typescript
// Design tokens
import { colors, typography, spacing, radius, shadows } from "../design-system";

// Components
import { Button } from "../components/base/Button";
import { ChatInput } from "../components/composite/ChatInput";
import { Header } from "../components/layout/Header";

// Icons
import MicIcon from "../../components/svg/MicIcon";
import { Plus } from "lucide-react";

// Utils
import { cn } from "../../../lib/utils";
```

### Common Styling Pattern
```typescript
<div
  className={cn("base-classes", className)}
  style={{
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.paragraph.medium.fontSize,
    fontWeight: typography.paragraph.medium.fontWeight,
    lineHeight: typography.paragraph.medium.lineHeight,
    color: colors.text.strong[950],
    padding: spacing[4],
    borderRadius: radius[6],
    boxShadow: shadows.md,
  }}
>
  Content
</div>
```

---

## 16. Resources

### Design System Files
- **Tokens**: `src/ui-new/design-system/tokens/`
- **Global CSS**: `src/ui-new/design-system/global.css`
- **Component Library**: `src/ui-new/components/`

### Figma Links
- Main Design File: [Figma Design](https://www.figma.com/design/kF1Ppoh2nLuKEuvcr8JPRH/PT---Locaition-Matters-GIS-Product-Design--v2-)
- Variables: Use Figma Variables panel to extract color/system tokens

### Documentation
- This file: `.cursor/rules/design_system_rules.md`
- Component README: `src/ui-new/README.md`
- Quick Start: `src/ui-new/QUICK_START.md`

---

**Last Updated**: 2024
**Maintained By**: Design System Team
**Version**: 1.0.0
