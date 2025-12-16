import React, { useState } from "react";
import MapViewComponent from "../../../pages/MapView";
import { ArtifactRoot } from "../../../artifacts/ArtifactRoot";
import { useArtifactStore } from "../../../store/useArtifactStore";
import ToolsInsightsPanel from "./ToolsInsightsPanel";
import { IconAccordionCollapse, IconAccordionExpand } from "../../assets/icons";

interface CanvasPanelProps {
  className?: string;
}

const CanvasPanel: React.FC<CanvasPanelProps> = ({ className = "" }) => {
  const { activeArtifact } = useArtifactStore();
  const isArtifactActive = !!activeArtifact;
  const [isToolsCollapsed, setIsToolsCollapsed] = useState(true);
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
          className="shrink-0 flex items-center justify-between px-1 py-1 accordion-header cursor-pointer"
          onClick={handleMapToggle}
        >
          <div className="flex items-center gap-2.5 px-2.5 py-1.5">
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
          <div className="flex items-center gap-0.5">
            {isMapCollapsed ? (
              <div className="accordion-icon-wrapper">
                <IconAccordionExpand
                  size={16}
                  color="var(--neutral-800, #1d1916)"
                />
              </div>
            ) : (
              <div className="accordion-icon-wrapper">
                <IconAccordionCollapse
                  size={16}
                  color="var(--neutral-800, #1d1916)"
                />
              </div>
            )}
          </div>
        </div>

        {/* Map Content */}
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
                <IconAccordionExpand
                  size={16}
                  color="var(--neutral-800, #1d1916)"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CanvasPanel;
