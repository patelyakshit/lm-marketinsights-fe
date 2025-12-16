import { useMapStore } from "../../store/useMapStore";

const MapKeyContent = () => {
  const { mapKeyWidget } = useMapStore();

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
        )}
      </div>
    </div>
  );
};

export default MapKeyContent;
