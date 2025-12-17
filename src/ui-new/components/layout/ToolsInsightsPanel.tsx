import React, { useState } from "react";
import Layers from "../../../components/MapTools/Layers/Layers";
import MapKeyContent from "../../../components/accordion/MapKeyContent";
import AnalyzeContent from "../../../components/accordion/AnalyzeContent";
import {
  IconAccordionCollapse,
  IconAccordionExpand,
  LayersIcon,
  ListIcon,
  AnalyzeIcon,
  MapKeyIcon,
  ChevronRightIcon,
  SearchIcon,
  CollapseLeftIcon,
  CloseIcon,
} from "../../assets/icons";
import { Tooltip } from "../base";
import AddDataSidePanel from "./AddDataSidePanel";
import MapKeySidePanel from "./MapKeySidePanel";
import ListContent from "./ListContent";
import { useToolsPanelStore, ToolsPanelTab } from "../../../store/useToolsPanelStore";

type TabType = ToolsPanelTab;

interface ToolsInsightsPanelProps {
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const ToolsInsightsPanel: React.FC<ToolsInsightsPanelProps> = ({
  className = "",
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { activeTab, setActiveTab } = useToolsPanelStore();
  const [isAddDataOpen, setIsAddDataOpen] = useState(false);
  const [isMapKeyOpen, setIsMapKeyOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [showLayerSearch, setShowLayerSearch] = useState(false);
  const [layerSearchQuery, setLayerSearchQuery] = useState("");

  const tabs = [
    { id: "layers" as TabType, icon: LayersIcon, label: "Layers" },
    { id: "analyze" as TabType, icon: AnalyzeIcon, label: "Analyze" },
    { id: "list" as TabType, icon: ListIcon, label: "List" },
    // { id: "map-key" as TabType, icon: MapKeyIcon, label: "Map Key" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "layers":
        return (
          <Layers hideAddDataButton={true} searchQuery={layerSearchQuery} />
        );
      case "list":
        return <ListContent />;
      case "analyze":
        return <AnalyzeContent />;
      case "map-key":
        return <MapKeyContent />;
      default:
        return (
          <Layers hideAddDataButton={true} searchQuery={layerSearchQuery} />
        );
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case "layers":
        return "Layers";
      case "list":
        return "List";
      case "map-key":
        return "Map Key";
      case "analyze":
        return "Analyze";
      default:
        return "Layers";
    }
  };

  if (isCollapsed) {
    return null;
  }

  return (
    <div
      className={`flex flex-col overflow-hidden ${className}`}
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        border: "1px solid #d5d3d2",
      }}
    >
      {/* Header - Tools & Insights */}
      <div
        className="shrink-0 accordion-header cursor-pointer"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center justify-between gap-3 p-1">
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
            {isCollapsed ? (
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
      </div>

      {/* Content Area */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div
          className="shrink-0 flex flex-col h-full transition-all duration-200"
          style={{
            width: isSidebarExpanded ? "140px" : "44px",
            borderRight: "1px solid #eceae9",
            backgroundColor: "#ffffff",
          }}
        >
          <div className="flex-1 flex flex-col py-1">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <div
                  key={tab.id}
                  className="flex flex-col items-center justify-center px-1 py-0.5"
                >
                  {isSidebarExpanded ? (
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full h-9 flex items-center gap-2 rounded transition-colors cursor-pointer ${
                        isActive ? "bg-[#f3f2f2]" : "hover:bg-[#f8f7f7]"
                      } justify-start px-2`}
                    >
                      <IconComponent isActive={isActive} />
                      <span
                        className="text-[14px] whitespace-nowrap"
                        style={{
                          fontFamily: "Switzer, sans-serif",
                          color: isActive ? "#1d1916" : "#545251",
                          lineHeight: "20px",
                        }}
                      >
                        {tab.label}
                      </span>
                    </button>
                  ) : (
                    <Tooltip content={tab.label} side="right">
                      <button
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full h-9 flex items-center gap-2 rounded transition-colors cursor-pointer ${
                          isActive ? "bg-[#f3f2f2]" : "hover:bg-[#f8f7f7]"
                        } justify-center`}
                      >
                        <IconComponent isActive={isActive} />
                      </button>
                    </Tooltip>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex flex-col items-center justify-center p-1">
            {isSidebarExpanded ? (
              <button
                onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                className="w-full h-9 flex items-center gap-2 rounded hover:bg-[#f8f7f7] cursor-pointer justify-start px-2"
              >
                <div className="flex items-center justify-center transition-transform duration-200">
                  <CollapseLeftIcon size={20} color="#545251" />
                </div>
                <span
                  className="text-[14px] whitespace-nowrap"
                  style={{
                    fontFamily: "Switzer, sans-serif",
                    color: "#545251",
                    lineHeight: "20px",
                  }}
                >
                  Collapse
                </span>
              </button>
            ) : (
              <Tooltip content="Expand" side="right">
                <button
                  onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                  className="w-full h-9 flex items-center gap-2 rounded hover:bg-[#f8f7f7] cursor-pointer justify-center"
                >
                  <div
                    className="flex items-center justify-center transition-transform duration-200"
                    style={{ transform: "rotate(180deg)" }}
                  >
                    <CollapseLeftIcon size={20} color="#545251" />
                  </div>
                </button>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Panels Container - Layers + Add Data split 50-50 */}
        <div className="flex-1 flex min-w-0 h-full overflow-hidden">
          {/* Layers Panel - 50% width when Add Data or Map Key is open, full width otherwise */}
          <div
            className={`flex flex-col h-full overflow-hidden ${isAddDataOpen || isMapKeyOpen ? "w-1/2 shrink-0" : "flex-1"}`}
            style={{
              borderRight:
                isAddDataOpen || isMapKeyOpen ? "1px solid #eceae9" : "none",
            }}
          >
            {/* Tab Header - Layers with actions */}
            <div
              className="shrink-0"
              style={{ borderBottom: "1px solid #eceae9" }}
            >
              <div className="flex items-center justify-between gap-3 p-1.5">
                <div className="flex items-center gap-2.5 p-1">
                  <span
                    className="text-[14px] font-normal whitespace-nowrap"
                    style={{
                      fontFamily: "Switzer, sans-serif",
                      color: "#1d1916",
                      letterSpacing: "-0.084px",
                      lineHeight: "20px",
                    }}
                  >
                    {getTabTitle()}
                  </span>
                </div>
                {activeTab === "layers" && (
                  <div className="flex items-center gap-1">
                    <Tooltip content="Search Layers" side="bottom">
                      <button
                        onClick={() => {
                          setShowLayerSearch(!showLayerSearch);
                          if (showLayerSearch) {
                            setLayerSearchQuery("");
                          }
                        }}
                        className="w-7 h-7 flex items-center justify-center cursor-pointer hover:bg-[#ECEAE9]"
                        style={{
                          borderRadius: "4px",
                          backgroundColor: showLayerSearch
                            ? "#fff2eb"
                            : "transparent",
                        }}
                      >
                        <SearchIcon
                          size={16}
                          color={showLayerSearch ? "#ff7700" : "#545251"}
                        />
                      </button>
                    </Tooltip>
                    <Tooltip content="Map Key" side="bottom">
                      <button
                        onClick={() => {
                          setIsMapKeyOpen(!isMapKeyOpen);
                          // Close Add Data panel when opening Map Key
                          if (!isMapKeyOpen && isAddDataOpen) {
                            setIsAddDataOpen(false);
                          }
                        }}
                        className="w-7 h-7 flex items-center justify-center cursor-pointer"
                        style={{
                          borderRadius: "4px",
                          backgroundColor: isMapKeyOpen
                            ? "#fff2eb"
                            : "transparent",
                        }}
                      >
                        <MapKeyIcon
                          size={16}
                          color={isMapKeyOpen ? "#ff7700" : "#545251"}
                        />
                      </button>
                    </Tooltip>
                    <button
                      onClick={() => {
                        setIsAddDataOpen(!isAddDataOpen);
                        // Close Map Key panel when opening Add Data
                        if (!isAddDataOpen && isMapKeyOpen) {
                          setIsMapKeyOpen(false);
                        }
                      }}
                      className="flex items-center gap-1 px-2 py-1.5 rounded transition-colors cursor-pointer hover:bg-[#ECEAE9]"
                      style={{
                        borderRadius: "4px",
                        background: "var(--neutral-100, #F3F2F2)",
                      }}
                    >
                      <span
                        className="text-[14px] whitespace-nowrap"
                        style={{
                          fontFamily: "Switzer, sans-serif",
                          color: "#545251",
                          letterSpacing: "-0.084px",
                          lineHeight: "16px",
                        }}
                      >
                        {isAddDataOpen ? "Close data" : "Add data"}
                      </span>
                      <div
                        className="flex items-center justify-center"
                        style={{
                          transform: isAddDataOpen ? "rotate(180deg)" : "none",
                        }}
                      >
                        <ChevronRightIcon size={16} />
                      </div>
                    </button>
                  </div>
                )}
                {activeTab === "list" && (
                  <div className="flex items-center gap-1">
                    <Tooltip content="Search" side="bottom">
                      <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#f3f2f2] cursor-pointer">
                        <SearchIcon size={16} color="#545251" />
                      </button>
                    </Tooltip>
                  </div>
                )}
              </div>
            </div>

            {/* Search Input - appears below header when active */}
            {showLayerSearch && activeTab === "layers" && (
              <div
                className="shrink-0 px-2 py-2"
                style={{ borderBottom: "1px solid #eceae9" }}
              >
                <div className="bg-white border border-[#eceae9] rounded-[4px] px-2 h-8 flex items-center gap-2">
                  <SearchIcon size={16} color="#545251" />
                  <input
                    type="text"
                    placeholder="Search layers..."
                    value={layerSearchQuery}
                    onChange={(e) => setLayerSearchQuery(e.target.value)}
                    className="flex-1 text-sm border-none outline-none bg-transparent"
                    style={{
                      fontFamily: "Switzer, sans-serif",
                      fontSize: "14px",
                      color: "#545251",
                    }}
                    autoFocus
                  />
                  {layerSearchQuery && (
                    <button
                      onClick={() => setLayerSearchQuery("")}
                      className="flex items-center justify-center hover:bg-[#f3f2f2] rounded"
                    >
                      <CloseIcon size={16} color="#545251" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Layers Content */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {renderContent()}
            </div>

            {/* Basemap Footer - Only show on Layers tab */}
            {activeTab === "layers" && (
              <div
                className="shrink-0"
                style={{
                  height: "58px",
                  borderTop: "1px solid #eceae9",
                  backgroundColor: "#f8f7f7",
                }}
              >
                <div className="flex items-center gap-3 h-full px-2.5 py-2.5">
                  <div
                    className="shrink-0 w-9 h-full rounded overflow-hidden"
                    style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.08)" }}
                  >
                    <div
                      className="w-full h-full"
                      style={{
                        backgroundColor: "#c4c4c4",
                        backgroundImage:
                          "linear-gradient(45deg, #a0a0a0 25%, transparent 25%), linear-gradient(-45deg, #a0a0a0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #a0a0a0 75%), linear-gradient(-45deg, transparent 75%, #a0a0a0 75%)",
                        backgroundSize: "8px 8px",
                        backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
                      }}
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <span
                      className="text-[10px] uppercase"
                      style={{
                        fontFamily: "Switzer, sans-serif",
                        color: "#a6a3a0",
                        letterSpacing: "0.6px",
                        lineHeight: "12px",
                      }}
                    >
                      Current Basemap
                    </span>
                    <span
                      className="text-[14px] truncate"
                      style={{
                        fontFamily: "Switzer, sans-serif",
                        color: "#1d1916",
                        letterSpacing: "-0.084px",
                        lineHeight: "20px",
                      }}
                    >
                      Light Gray Canvas
                    </span>
                  </div>
                  <button className="shrink-0 w-5 h-5 flex items-center justify-center cursor-pointer">
                    <ChevronRightIcon size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Add Data Panel - 50% width */}
          {isAddDataOpen && activeTab === "layers" && (
            <div className="w-1/2 shrink-0 h-full">
              <AddDataSidePanel
                className="h-full"
                onClose={() => setIsAddDataOpen(false)}
              />
            </div>
          )}

          {/* Map Key Panel - 50% width */}
          {isMapKeyOpen && activeTab === "layers" && (
            <div className="w-1/2 shrink-0 h-full">
              <MapKeySidePanel
                className="h-full"
                onClose={() => setIsMapKeyOpen(false)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ToolsInsightsPanel;
