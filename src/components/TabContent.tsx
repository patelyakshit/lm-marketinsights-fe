import React from "react";
import { Tab } from "../contexts/TabContextDefinition";
import Layers from "./MapTools/Layers/Layers";
import ChatBox from "./ChatBox";
import { useMapStore } from "../store/useMapStore";

interface TabContentProps {
  activeTabId: string;
  tabs: Tab[];
}

export const TabContent: React.FC<TabContentProps> = ({
  activeTabId,
  tabs,
}) => {
  // Since chat tab is always present, we don't need the no tabs case

  const activeTab = tabs.find((tab) => tab.id === activeTabId);
  const { mapKeyWidget } = useMapStore();

  if (!activeTab) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">Tab not found</p>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab.id) {
      case "chat":
        return (
          <div className="h-full min-h-0 flex flex-col overflow-hidden w-full">
            <ChatBox />
          </div>
        );

      case "map_keys":
        return (
          <div className="h-full w-full">
            <div
              className="space-y-1 overflow-y-auto w-full"
              style={{ maxHeight: "100%", overflowX: "hidden" }}
            >
              {mapKeyWidget && (
                <div
                  ref={(el) => {
                    if (el && mapKeyWidget) {
                      el.innerHTML = "";
                      const legendContainer = document.createElement("div");
                      legendContainer.className = "legend-container";
                      el.appendChild(legendContainer);

                      let legendContent: HTMLElement | null = null;
                      if (
                        mapKeyWidget.container &&
                        mapKeyWidget.container instanceof HTMLElement
                      ) {
                        legendContent = mapKeyWidget.container;
                      } else if (mapKeyWidget.domNode) {
                        legendContent = mapKeyWidget.domNode;
                      } else {
                        try {
                          mapKeyWidget.render();
                          if (mapKeyWidget.domNode) {
                            legendContent = mapKeyWidget.domNode;
                          }
                        } catch (error) {
                          console.error(
                            "Error rendering legend widget:",
                            error,
                          );
                        }
                      }

                      if (legendContent) {
                        legendContainer.appendChild(legendContent);
                      } else {
                        legendContainer.innerHTML =
                          '<div class="text-gray-500 text-center p-4">Legend content not available</div>';
                      }
                    }
                  }}
                />
              )}
            </div>
          </div>
        );

      case "layers":
        return (
          <div className="h-full w-full">
            <Layers />
          </div>
        );

      case "grid":
        return (
          <div className="h-full w-full">
            <div className="text-center text-gray-500 mt-8">
              <div className="text-lg font-medium mb-2">Grid View</div>
              <p>Grid view interface will be displayed here</p>
            </div>
          </div>
        );

      case "list":
        return (
          <div className="h-full w-full">
            <div className="text-center text-gray-500 mt-8">
              <div className="text-lg font-medium mb-2">List View</div>
              <p>List view interface will be displayed here</p>
            </div>
          </div>
        );

      default:
        return (
          <div className="h-full w-full">
            <div className="text-center text-gray-500 mt-8">
              <div className="text-lg font-medium mb-2">{activeTab.title}</div>
              <p>Content for this tab will be displayed here</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-full min-h-0 overflow-hidden w-full tab-content-container">
      {renderTabContent()}
    </div>
  );
};

export default TabContent;
