import React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "../../../lib/utils";
import { typography } from "../../design-system";

export interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  delayDuration?: number;
  className?: string;
  showArrow?: boolean;
}

/**
 * Global Tooltip component for ui-new design system
 * Matches Figma design specifications (node 203-121968)
 *
 * Design specs:
 * - Background: #171717 (dark)
 * - Text: #FFFFFF (white)
 * - Font: 12px, regular, 16px line height
 * - Padding: 6px horizontal, 2px vertical
 * - Border radius: 4px
 * - Shadow: 0px 12px 24px rgba(14,18,27,0.06), 0px 1px 2px rgba(14,18,27,0.03)
 */
export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  side = "top",
  sideOffset = 6,
  delayDuration = 300,
  className,
  showArrow = false,
}) => {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={sideOffset}
            className={cn(
              "z-[9999] w-fit",
              "animate-in fade-in-0 zoom-in-95",
              "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
              "data-[side=bottom]:slide-in-from-top-2",
              "data-[side=left]:slide-in-from-right-2",
              "data-[side=right]:slide-in-from-left-2",
              "data-[side=top]:slide-in-from-bottom-2",
              className,
            )}
            style={{
              backgroundColor: "#171717",
              color: "#FFFFFF",
              borderRadius: "4px",
              fontFamily: typography.fontFamily.primary,
              fontSize: "12px",
              fontWeight: 400,
              lineHeight: "16px",
              padding: "2px 6px",
              boxShadow:
                "0px 12px 24px 0px rgba(14, 18, 27, 0.06), 0px 1px 2px 0px rgba(14, 18, 27, 0.03)",
              whiteSpace: "nowrap",
            }}
          >
            {content}
            {showArrow && (
              <TooltipPrimitive.Arrow
                style={{
                  fill: "#171717",
                }}
              />
            )}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
};
