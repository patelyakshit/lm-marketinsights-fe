import React from "react";
import { cn } from "../../../lib/utils";
import { motion } from "framer-motion";
import { colors, radius, typography } from "../../design-system";

export interface ActionButtonProps {
  icon?: React.ComponentType<{
    size?: number;
    color?: string;
    className?: string;
  }>;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  badge?: string; // For "Soon" badge on disabled buttons
  className?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  badge,
  className,
}) => {
  return (
    <motion.button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        "flex items-center justify-center transition-colors",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        !disabled && "border",
        className,
      )}
      style={{
        fontFamily: "Switzer, sans-serif",
        backgroundColor: disabled ? colors.neutral[100] : colors.neutral[25],
        borderColor: disabled ? "transparent" : colors.neutral[200],
        borderRadius: radius.full,
        paddingLeft: Icon ? "4px" : "12px",
        paddingRight: "12px", // Always 12px, badge is inside
        paddingTop: "4px",
        paddingBottom: "4px",
      }}
      whileHover={
        !disabled
          ? {
              backgroundColor: colors.neutral[200], // #ECEAE9 - matches border color on hover
              borderColor: colors.neutral[200], // #ECEAE9 - same as background on hover
            }
          : {}
      }
      whileTap={!disabled ? { scale: 0.98 } : {}}
    >
      {Icon && (
        <div
          className="flex items-center"
          style={{
            borderRadius: radius.full,
            padding: "6px",
          }}
        >
          <Icon
            size={16}
            color={disabled ? colors.neutral[400] : colors.brand.orange[500]}
          />
        </div>
      )}
      <div
        className="flex flex-col items-start"
        style={{
          paddingLeft: "4px",
          paddingRight: badge && disabled ? "8px" : "4px", // pr-[8px] when disabled with badge
          paddingTop: "4px",
          paddingBottom: "4px",
        }}
      >
        <span
          style={{
            fontFamily: typography.fontFamily.primary,
            fontSize: "14px",
            fontWeight: typography.fontWeight.regular,
            lineHeight: "20px",
            color: disabled ? colors.neutral[400] : colors.neutral[900],
            letterSpacing: "-0.084px", // -0.6% of 14px
          }}
        >
          {label}
        </span>
      </div>
      {badge && disabled && (
        <div
          className="flex items-center justify-center"
          style={{
            backgroundColor: colors.neutral[300],
            borderRadius: radius.full,
            padding: "2px 8px",
            marginLeft: "auto",
          }}
        >
          <span
            style={{
              fontFamily: typography.fontFamily.primary,
              fontSize: "12px",
              fontWeight: typography.fontWeight.medium,
              lineHeight: "16px",
              color: colors.static.white,
            }}
          >
            {badge}
          </span>
        </div>
      )}
    </motion.button>
  );
};
