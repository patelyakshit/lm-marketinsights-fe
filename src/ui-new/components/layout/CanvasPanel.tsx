import React, { useState } from "react";
import MapViewComponent from "../../../pages/MapView";
import { ArtifactRoot } from "../../../artifacts/ArtifactRoot";
import { useArtifactStore } from "../../../store/useArtifactStore";
import { useToolsPanelStore } from "../../../store/useToolsPanelStore";
import ToolsInsightsPanel from "./ToolsInsightsPanel";
import { IconAccordionCollapse, IconAccordionExpand } from "../../assets/icons";

interface CanvasPanelProps {
  className?: string;
}

const CanvasPanel: React.FC<CanvasPanelProps> = ({ className = "" }) => {
  const { activeArtifact } = useArtifactStore();
  const isArtifactActive = !!activeArtifact;
  const { isCollapsed: isToolsCollapsed, setIsCollapsed: setIsToolsCollapsed } = useToolsPanelStore();

  const [isMapCollapsed, setIsMapCollapsed] = useState(false);

  const handleMapToggle = () => {
    if (isToolsCollapsed && !isMapCollapsed) {
      setIsToolsCollapsed(false);
    }
    setIsMapCollapsed(!isMapCollapsed);
  };

  const handleToolsToggle = () => {
    if (isMapCollapsed && !isToolsCollapsed) {
      setIsMapCollapsed(false);
    }
    setIsToolsCollapsed(!isToolsCollapsed);
  };

  return (
    <div
      className={`h-full flex flex-col gap-1 p-2 ${className}`}
      style={{ backgroundColor: "#eceae9" }}
    >
      {/* Map Card Container */}
      <div
        className={`${isMapCollapsed ? "shrink-0" : isToolsCollapsed ? "flex-1" : "flex-1"} min-h-0 flex flex-col overflow-hidden`}
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          border: "1px solid #d5d3d2",
        }}
      >
        {/* Map Header */}
        <div
          className="shrink-0 flex items-center justify-between px-3 py-2"
          style={{ borderBottom: "1px solid #eceae9" }}
        >
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1d1916" strokeWidth="2">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line x1="8" y1="2" x2="8" y2="18" />
              <line x1="16" y1="6" x2="16" y2="22" />
            </svg>
            <span
              className="text-sm font-normal"
              style={{
                fontFamily: "Switzer, sans-serif",
                color: "#1d1916",
                letterSpacing: "-0.084px",
              }}
            >
              Map View
            </span>
          </div>

          {/* Collapse/Expand Button */}
          <button
            onClick={handleMapToggle}
            className="p-1.5 rounded hover:bg-[#f3f2f2] transition-colors"
          >
            {isMapCollapsed ? (
              <IconAccordionExpand size={16} color="#1d1916" />
            ) : (
              <IconAccordionCollapse size={16} color="#1d1916" />
            )}
          </button>
        </div>

        {/* Map Content Area */}
        {!isMapCollapsed && (
          <div className="flex-1 min-h-0 overflow-hidden relative">
            <MapViewComponent />
            {/* Artifact Overlay */}
            {isArtifactActive && activeArtifact && (
              <div className="absolute inset-0 w-full h-full z-20 bg-white">
                <ArtifactRoot artifact={activeArtifact} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tools & Insights Panel */}
      {!isToolsCollapsed && (
        <ToolsInsightsPanel
          className="flex-1 min-h-0"
          isCollapsed={isToolsCollapsed}
          onToggleCollapse={handleToolsToggle}
        />
      )}

      {/* Collapsed Tools Bar */}
      {isToolsCollapsed && (
        <div
          className="shrink-0 cursor-pointer"
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            border: "1px solid #d5d3d2",
          }}
          onClick={handleToolsToggle}
        >
          <div className="flex items-center justify-between gap-3 p-1 accordion-header">
            <div className="flex-1 flex items-center gap-2.5 px-2.5 py-1.5">
              <span
                className="text-sm font-normal whitespace-nowrap"
                style={{
                  fontFamily: "Switzer, sans-serif",
                  color: "#1d1916",
                  letterSpacing: "-0.084px",
                  lineHeight: "20px",
                }}
              >
                Tools & Insights
              </span>
            </div>
            <div className="flex items-center gap-0.5">
              <div className="accordion-icon-wrapper">
                <IconAccordionExpand size={16} color="#1d1916" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CanvasPanel;
