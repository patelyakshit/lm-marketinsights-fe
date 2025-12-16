import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";

export interface TooltipProps {
  toolTipText: string;
  children: React.ReactNode;
  width?: string;
  side?: "top" | "right" | "bottom" | "left";
  tooltipStyle?: string;
  variant?: "dark" | "light";
}

export default function TooltipText({
  toolTipText,
  children,
  width = "full",
  side = "top",
  tooltipStyle,
  variant = "dark",
}: TooltipProps) {
  const variantClasses =
    variant === "light"
      ? "bg-[#FFFFFF] text-[#171717] border-0"
      : "bg-[#18181B] text-white border-0";
  const arrowClassName =
    variant === "light" ? "fill-[#FFFFFF] stroke-[#EBEBEB]" : "fill-[#18181B]";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild={true}>{children}</TooltipTrigger>
        <TooltipContent
          side={side}
          arrowClassName={arrowClassName}
          className={`pl-4 py-1 text-xs w-${width} z-999 ${variantClasses} ${tooltipStyle ?? ""}`}
        >
          <div dangerouslySetInnerHTML={{ __html: toolTipText }} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
