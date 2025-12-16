import React, { useState, useCallback } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "../lib/utils";
import { useTabContext } from "../hooks/useTabContext";
import TabContent from "./TabContent";
import ChatIcon from "./svg/ChatIcon";
import LayerIcon from "./svg/LayerIcon";
import MapKeyIcons from "./svg/MapKeyIcons";
import AnalyzeIcon from "./svg/AnalyzeIcon";

export interface TabManagerProps {
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onNewTab: () => void;
}

export const TabManager: React.FC<TabManagerProps> = ({
  onTabSelect,
  onTabClose,
  onNewTab,
}) => {
  const { tabs, activeTabId, selectTab, closeTab, createTab } = useTabContext();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSidebarItemClick = useCallback(
    (item: any) => {
      const existingTab = tabs.find((tab) => tab.id === item.id);

      if (existingTab) {
        selectTab(item.id);
        onTabSelect(item.id);
      } else {
        createTab(item);
        onTabSelect(item.id);
      }

      setIsDropdownOpen(false);
    },
    [tabs, selectTab, onTabSelect, createTab],
  );

  const handleTabClick = useCallback(
    (tabId: string) => {
      selectTab(tabId);
      onTabSelect(tabId);
    },
    [selectTab, onTabSelect],
  );

  const handleTabClose = useCallback(
    (tabId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      closeTab(tabId);
      onTabClose(tabId);
    },
    [closeTab, onTabClose],
  );

  const handleNewTab = useCallback(() => {
    onNewTab();
    setIsDropdownOpen(true);
  }, [onNewTab]);

  // Define the 4 main tabs that should be shown in the popover
  const mainTabs = [
    {
      id: "chat",
      icon: ChatIcon,
      label: "Chatbot",
    },
    {
      id: "layers",
      icon: LayerIcon,
      label: "Manage Layers",
    },
    {
      id: "map_keys",
      icon: MapKeyIcons,
      label: "Map Keys",
    },
    {
      id: "grid",
      icon: AnalyzeIcon,
      label: "Analyze",
    },
  ];

  return (
    <div className="w-full h-full min-h-0 flex flex-col overflow-hidden">
      {/* Tab Bar */}
      <div className="flex flex-row items-center bg-gray-50 border-b border-gray-200 rounded-t-[9px] gap-1">
        {/* Tabs */}
        <div className="flex items-center overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {tabs.map((tab, index) => {
            const IconComponent = tab.icon;
            return (
              <div
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 cursor-pointer transition-all duration-200",
                  "min-w-0 flex-shrink-0",
                  // Add border radius to top-left corner of first tab only
                  index === 0 ? "rounded-tl-[9px]" : "",
                  tab.isActive ? "bg-white" : "hover:bg-gray-100",
                )}
              >
                <IconComponent
                  color={tab.isActive ? "#71330A" : "#666"}
                  strokeWidth={1.8}
                  size={15}
                />
                <span
                  className={cn(
                    "text-sm font-medium truncate",
                    tab.isActive ? "text-[#71330A]" : "text-gray-600",
                  )}
                >
                  {tab.title}
                </span>
                {/* Hide close button for chat tab */}
                {tab.id !== "chat" && (
                  <button
                    onClick={(e) => handleTabClose(tab.id, e)}
                    className={cn(
                      "ml-1 p-0.5 rounded-full hover:bg-gray-200 transition-colors",
                      "opacity-60 hover:opacity-100",
                    )}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* New Tab Button */}
        <button
          onClick={handleNewTab}
          className="p-1.5 mr-1 rounded-md hover:bg-gray-200 transition-colors"
          title="New Tab"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Tab Selection Popover */}
      {isDropdownOpen && (
        <div className="absolute top-12 left-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[200px]">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 px-2 py-1 mb-2">
              Select Tab
            </div>
            {mainTabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleSidebarItemClick(tab)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100",
                    "transition-colors text-left",
                  )}
                >
                  <IconComponent />
                  <span className="text-sm text-gray-700">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab Content Area */}
      <div className="flex-1 min-h-0 bg-white rounded-b-[9px] overflow-hidden w-full tab-content-container">
        <div className="w-full h-full overflow-hidden tab-content-container">
          <TabContent activeTabId={activeTabId} tabs={tabs} />
        </div>
      </div>

      {/* Overlay to close dropdown when clicking outside */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default TabManager;
