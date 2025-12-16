import React from "react";
import { colors } from "../../../design-system";
import { LmLogo, CollapseIcon } from "../../../assets/icons";
import { Tooltip } from "../../base";

interface SidebarHeaderProps {
  onToggleCollapse?: () => void;
  isCollapsed?: boolean;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  onToggleCollapse,
  isCollapsed = false,
}) => {
  if (isCollapsed) {
    return (
      <div
        className="w-full shrink-0"
        style={{
          borderBottom: `1px solid ${colors.neutral[200]}`,
        }}
      >
        <div
          className="flex items-center overflow-hidden"
          style={{ padding: "6px" }}
        >
          <Tooltip content="Expand sidebar" side="right">
            <button
              onClick={onToggleCollapse}
              className="flex-1 flex flex-col gap-[10px] items-center justify-center overflow-hidden cursor-pointer hover:bg-[#ECEAE9] rounded-[4px] transition-colors"
              style={{ padding: "8px", height: "40px" }}
            >
              <div className="flex items-center gap-[10px]">
                <div
                  className="shrink-0"
                  style={{ width: "30.4px", height: "24px" }}
                >
                  <LmLogo />
                </div>
              </div>
            </button>
          </Tooltip>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full shrink-0"
      style={{
        borderBottom: `1px solid ${colors.neutral[200]}`,
      }}
    >
      <div
        className="flex items-center overflow-hidden"
        style={{ padding: "6px" }}
      >
        <div
          className="flex-1 flex flex-col gap-[10px] overflow-hidden"
          style={{ padding: "8px", borderRadius: "4px" }}
        >
          <div className="flex items-center gap-[10px]">
            <div
              className="shrink-0"
              style={{ width: "30.4px", height: "24px" }}
            >
              <LmLogo />
            </div>
            <div
              className="shrink-0"
              style={{ width: "128px", height: "20px" }}
            >
              <span
                className="whitespace-nowrap"
                style={{
                  fontFamily: "Switzer, sans-serif",
                  fontSize: "14px",
                  fontWeight: 400,
                  lineHeight: "20px",
                  color: colors.neutral[900],
                }}
              >
                Market Insights AI
              </span>
            </div>
          </div>
        </div>

        <Tooltip content="Collapse sidebar" side="bottom">
          <button
            onClick={onToggleCollapse}
            className="shrink-0 flex items-center justify-center rounded-[4px] overflow-hidden cursor-pointer hover:bg-[#ECEAE9] transition-colors"
            style={{ width: "40px", height: "40px" }}
          >
            <div className="relative" style={{ width: "20px", height: "20px" }}>
              <CollapseIcon size={20} color={colors.neutral[900]} />
            </div>
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

export default SidebarHeader;
