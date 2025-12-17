import React from "react";
import { colors } from "../../../design-system";
import { ChatIcon, SplitIcon, CanvasIcon } from "../../../assets/icons";
import { Tooltip } from "../../base";

export type ViewMode = "chat" | "split" | "canvas" | "studio";

// Display modes for the segment (studio maps to split visually)
type DisplayMode = "chat" | "split" | "canvas";

interface SidebarSegmentProps {
  activeMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  isCollapsed?: boolean;
}

// When in studio mode, highlight split since that's the related view
const getDisplayMode = (mode: ViewMode): DisplayMode => {
  return mode === "studio" ? "split" : mode;
};

interface SegmentOption {
  id: DisplayMode;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
}

const SidebarSegment: React.FC<SidebarSegmentProps> = ({
  activeMode,
  onModeChange,
  isCollapsed = false,
}) => {
  const displayMode = getDisplayMode(activeMode);
  const options: SegmentOption[] = [
    { id: "chat", icon: ChatIcon, label: "Chat" },
    { id: "split", icon: SplitIcon, label: "Split" },
    { id: "canvas", icon: CanvasIcon, label: "Canvas" },
  ];

  if (isCollapsed) {
    return (
      <div className="w-full shrink-0 flex flex-col" style={{ padding: "6px" }}>
        <div
          className="w-full flex flex-col gap-[4px] items-center"
          style={{
            backgroundColor: colors.neutral[200],
            borderRadius: "6px",
            padding: "4px",
          }}
        >
          {options.map((option) => {
            const isActive = displayMode === option.id;
            const Icon = option.icon;

            return (
              <Tooltip key={option.id} content={option.label} side="right">
                <button
                  onClick={() => onModeChange(option.id)}
                  className={`
                    w-full flex items-center justify-center rounded-[4px]
                    transition-all duration-150 cursor-pointer
                    ${isActive ? "bg-white" : ""}
                  `}
                  style={{
                    padding: "6px",
                    boxShadow: isActive
                      ? "0px 6px 10px 0px rgba(14, 18, 27, 0.06), 0px 2px 4px 0px rgba(14, 18, 27, 0.03)"
                      : "none",
                  }}
                >
                  <div
                    className="relative shrink-0"
                    style={{ width: "16px", height: "16px" }}
                  >
                    <Icon
                      size={16}
                      color={
                        isActive ? colors.neutral[900] : colors.neutral[500]
                      }
                    />
                  </div>
                </button>
              </Tooltip>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full shrink-0 flex flex-col gap-[2px]"
      style={{ padding: "8px" }}
    >
      <div
        className="w-full flex gap-[4px] items-start"
        style={{
          backgroundColor: colors.neutral[200],
          borderRadius: "6px",
          padding: "4px",
        }}
      >
        {options.map((option) => {
          const isActive = displayMode === option.id;
          const Icon = option.icon;

          return (
            <button
              key={option.id}
              onClick={() => onModeChange(option.id)}
              className={`
                flex-1 flex items-center justify-center rounded-[4px]
                transition-all duration-150 cursor-pointer
                ${isActive ? "bg-white" : ""}
              `}
              style={{
                padding: "6px",
                gap: "6px",
                boxShadow: isActive
                  ? "0px 6px 10px 0px rgba(14, 18, 27, 0.06), 0px 2px 4px 0px rgba(14, 18, 27, 0.03)"
                  : "none",
              }}
            >
              <div
                className="relative shrink-0"
                style={{ width: "16px", height: "16px" }}
              >
                <Icon
                  size={16}
                  color={isActive ? colors.neutral[900] : colors.neutral[500]}
                />
              </div>
              <span
                className="flex flex-col justify-center shrink-0 whitespace-nowrap"
                style={{
                  fontFamily: "Switzer, sans-serif",
                  fontSize: "14px",
                  fontWeight: isActive ? 500 : 400,
                  lineHeight: "20px",
                  color: isActive ? colors.neutral[900] : colors.neutral[500],
                }}
              >
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SidebarSegment;
