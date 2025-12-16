import React from "react";
import { colors } from "../../../design-system";
import { Tooltip } from "../../base";

interface SidebarNavItemProps {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  onClick?: () => void;
  isActive?: boolean;
  disabled?: boolean;
  badge?: string;
  isCollapsed?: boolean;
}

const SidebarNavItem: React.FC<SidebarNavItemProps> = ({
  icon: Icon,
  label,
  onClick,
  isActive = false,
  disabled = false,
  badge,
  isCollapsed = false,
}) => {
  const textColor = disabled
    ? colors.neutral[500]
    : isActive
      ? colors.neutral[900]
      : colors.neutral[900];

  const iconColor = disabled ? colors.neutral[500] : colors.neutral[900];

  // Collapsed state - icon only, centered
  if (isCollapsed) {
    return (
      <div className="w-full flex flex-col" style={{ padding: "2px 6px" }}>
        <Tooltip content={label} side="right">
          <button
            onClick={onClick}
            disabled={disabled}
            className={`
              w-full flex items-center justify-center h-[36px] rounded-[4px]
              transition-colors duration-150
              ${disabled ? "cursor-not-allowed" : "cursor-pointer hover:bg-[#ECEAE9]"}
              ${isActive ? "bg-[#ECEAE9]" : ""}
            `}
            style={{ overflow: "hidden", padding: "8px" }}
          >
            <div
              className="relative shrink-0"
              style={{ width: "20px", height: "20px" }}
            >
              <Icon size={20} color={iconColor} />
            </div>
          </button>
        </Tooltip>
      </div>
    );
  }

  // Expanded state
  return (
    <div
      className="w-full flex flex-col gap-[10px]"
      style={{ padding: "2px 8px" }}
    >
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          w-full flex items-center gap-[8px] h-[36px] px-2 rounded-[4px]
          transition-colors duration-150
          ${disabled ? "cursor-not-allowed" : "cursor-pointer hover:bg-[#ECEAE9]"}
          ${isActive ? "bg-[#ECEAE9]" : ""}
        `}
        style={{ overflow: "hidden", padding: "8px" }}
      >
        <div
          className="relative shrink-0"
          style={{ width: "20px", height: "20px" }}
        >
          <Icon size={20} color={iconColor} />
        </div>
        <span
          className="flex flex-col justify-center shrink-0 whitespace-nowrap"
          style={{
            fontFamily: "Switzer, sans-serif",
            fontSize: "14px",
            fontWeight: 400,
            lineHeight: "20px",
            color: textColor,
          }}
        >
          {label}
        </span>
        {badge && (
          <span
            className="flex items-center justify-center px-2 py-0.5 rounded-full shrink-0"
            style={{
              backgroundColor: colors.neutral[300],
              fontFamily: "Switzer, sans-serif",
              fontSize: "12px",
              fontWeight: 500,
              lineHeight: "16px",
              color: colors.static.white,
              padding: "2px 8px",
            }}
          >
            {badge}
          </span>
        )}
      </button>
    </div>
  );
};

export default SidebarNavItem;
