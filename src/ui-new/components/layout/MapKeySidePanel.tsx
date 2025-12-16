import React from "react";
import { useMapStore } from "../../../store/useMapStore";
import { CloseIcon } from "../../assets/icons";

interface MapKeySidePanelProps {
  className?: string;
  onClose?: () => void;
}

const MapKeySidePanel: React.FC<MapKeySidePanelProps> = ({
  className = "",
  onClose,
}) => {
  const { mapKeyWidget } = useMapStore();

  return (
    <div
      className={`flex flex-col h-full overflow-hidden ${className}`}
      style={{
        backgroundColor: "#ffffff",
      }}
    >
      {/* Header */}
      <div
        className="shrink-0"
        style={{
          backgroundColor: "#f8f7f7",
          borderBottom: "1px solid #eceae9",
        }}
      >
        <div className="flex items-center justify-between gap-1 p-2">
          <div className="flex-1 flex items-center gap-2 p-1">
            <span
              className="text-[14px] font-normal whitespace-nowrap"
              style={{
                fontFamily: "Switzer, sans-serif",
                color: "#1d1916",
                letterSpacing: "-0.084px",
                lineHeight: "16px",
              }}
            >
              Map Key
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center p-1 rounded hover:bg-[#eceae9] transition-colors cursor-pointer"
            title="Close Map Key"
          >
            <CloseIcon size={16} color="#7e7977" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-2">
          {mapKeyWidget ? (
            <div
              className="map-key-content"
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
                      console.error("Error rendering legend widget:", error);
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
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <p
                className="text-[12px]"
                style={{
                  fontFamily: "Switzer, sans-serif",
                  color: "#7e7977",
                  lineHeight: "16px",
                }}
              >
                No layers added yet
              </p>
              <p
                className="text-[12px] mt-1"
                style={{
                  fontFamily: "Switzer, sans-serif",
                  color: "#a6a3a0",
                  lineHeight: "16px",
                }}
              >
                Add layers to see their legend
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Custom styles for legend widget */}
      <style>{`
        .map-key-content .legend-container {
          font-family: 'Switzer', sans-serif;
        }

        .map-key-content .esri-legend {
          background: transparent;
          padding: 0;
        }

        .map-key-content .esri-legend__service {
          padding: 0;
          margin-bottom: 16px;
        }

        .map-key-content .esri-legend__service-label {
          background-color: #f8f7f7;
          padding: 8px;
          border-radius: 4px;
          font-family: 'Geist', 'Switzer', sans-serif;
          font-size: 12px;
          font-weight: 400;
          line-height: 16px;
          color: #1d1916;
          margin-bottom: 8px;
        }

        .map-key-content .esri-legend__layer {
          padding-left: 8px;
        }

        .map-key-content .esri-legend__layer-caption {
          font-family: 'Geist', 'Switzer', sans-serif;
          font-size: 12px;
          font-weight: 400;
          line-height: 16px;
          color: #1d1916;
          padding: 4px 8px;
          border-left: 1px solid #d5d3d2;
        }

        .map-key-content .esri-legend__layer-body {
          padding-left: 8px;
        }

        .map-key-content .esri-legend__layer-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 8px 4px 24px;
        }

        .map-key-content .esri-legend__symbol {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }

        .map-key-content .esri-legend__layer-cell--info {
          font-family: 'Geist', 'Switzer', sans-serif;
          font-size: 12px;
          font-weight: 400;
          line-height: 16px;
          color: #545251;
        }

        .map-key-content .esri-legend__message {
          font-family: 'Switzer', sans-serif;
          font-size: 12px;
          color: #7e7977;
          padding: 8px;
        }
      `}</style>
    </div>
  );
};

export default MapKeySidePanel;
