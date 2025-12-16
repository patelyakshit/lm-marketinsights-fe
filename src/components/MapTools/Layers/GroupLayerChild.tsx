import React, { useState, useRef, useEffect } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { GripVertical, Ellipsis } from "lucide-react";
import { Checkbox } from "../../ui/checkbox";
import SetTransparencyIcon from "../../svg/SetTransparencyIcon";
import SetFilterIcon from "../../svg/SetFilterIcon";
import RemoveLayerIcon from "../../svg/RemoveLayerIcon";
import ZoomLayerIcon from "../../svg/ZoomLayerIcon";
import OpenTable from "../../svg/OpenTable";
import HideLayer from "../../svg/HideLayer";
import DisablePopUpIcon from "../../svg/DisablepopupIcon";
import ShowDetails from "../../svg/ShowDetails";
import { WebMapLayer } from "../../../schema";
import { eventEmitter } from "../../../utils/eventEmitter";
import { useMapStore } from "../../../store/useMapStore";
import { useLayerDetailsStore } from "../../../store/useLayerDetailsStore";
import { toastSuccess, toastError } from "../../../utils/toast";
import { useFavorites } from "../../../hooks/useFavorites";
import { getLayerDetails } from "../../../api";
import FavoriteIcon from "../../svg/FavoriteLayerIcon";

interface GroupLayerChildProps {
  layer: WebMapLayer;
  parentId: string;
  index: number;
  onChildCheckChange: (
    parentId: string,
    childId: string,
    checked: boolean,
  ) => void;
  handleRemoveChildLayer: (parentId: string, childId: string) => void;
  handleSetFilter: (layer: any) => void;
}

const GroupLayerChild: React.FC<GroupLayerChildProps> = ({
  layer,
  parentId,
  index,
  onChildCheckChange,
  handleRemoveChildLayer,
  handleSetFilter,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const { mapView, layers, setLayers } = useMapStore();
  const { openLayerDetails } = useLayerDetailsStore();
  const { toggleFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsPopoverOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getChildLayerOperations = () => [
    {
      id: "zoom",
      label: "Zoom to layer",
      icon: ZoomLayerIcon,
      operation: "zoom",
    },
    {
      id: "transparency",
      label: "Set transparency",
      icon: SetTransparencyIcon,
      operation: "transparency",
    },
    {
      id: "filter",
      label: "Set Filter",
      icon: SetFilterIcon,
      operation: "filter",
    },
    {
      id: "table",
      label: "Open Table",
      icon: OpenTable,
      operation: "table",
    },
    {
      id: "hide",
      label: "Hide layer",
      icon: HideLayer,
      operation: "hide",
    },
    {
      id: "popup",
      label: layer.popupEnabled ? "Disable popup" : "Enable popup",
      icon: DisablePopUpIcon,
      operation: "popup",
    },
    {
      id: "favorite",
      label: isFavorite(layer.id) ? "Remove from favorite" : "Add to favorite",
      icon: FavoriteIcon,
      operation: "favorite",
    },
    {
      id: "details",
      label: "Show details",
      icon: ShowDetails,
      operation: "details",
    },
  ];

  const handleZoomToChildLayer = (childLayerId: string) => {
    if (!mapView || !mapView.map) return;

    // Find the parent group layer
    const parentLayer = mapView.map.allLayers.find(
      (layer) => layer.id === parentId,
    );
    if (!parentLayer || parentLayer.type !== "group") {
      toastError("Unable to locate the parent layer for zooming");
      return;
    }

    const groupLayer = parentLayer as __esri.GroupLayer;
    const childArcLayer = groupLayer.layers.find(
      (childLayer: any) => childLayer.id === childLayerId,
    );

    if (!childArcLayer) {
      // Try to find by title if ID doesn't match
      const childLayerData = layers
        .find((l) => l.id === parentId)
        ?.layers?.find((cl) => cl.id === childLayerId);

      if (childLayerData) {
        const childArcLayerByTitle = groupLayer.layers.find(
          (childLayer: any) => childLayer.title === childLayerData.title,
        );

        if (childArcLayerByTitle) {
          handleZoomToLayerExtent(childArcLayerByTitle);
          return;
        }
      }

      toastError("Unable to locate the child layer for zooming");
      return;
    }

    handleZoomToLayerExtent(childArcLayer);
  };

  const handleZoomToLayerExtent = (arcLayer: any) => {
    if (!mapView) return;

    try {
      if (arcLayer.fullExtent) {
        mapView
          .goTo(arcLayer.fullExtent, {
            duration: 1000,
            easing: "ease-out",
          })
          .then(() => {
            toastSuccess("Zoomed to layer extent");
          })
          .catch((error: any) => {
            console.error("Error zooming to layer extent:", error);
            toastError("Failed to zoom to layer extent");
          });
      } else {
        if (arcLayer.type === "feature") {
          arcLayer
            .queryExtent()
            .then((result: any) => {
              if (result.extent) {
                mapView
                  .goTo(result.extent, {
                    duration: 1000,
                    easing: "ease-out",
                  })
                  .then(() => {
                    toastSuccess("Zoomed to layer extent");
                  })
                  .catch((error: any) => {
                    console.error("Error zooming to layer extent:", error);
                    toastError("Failed to zoom to layer extent");
                  });
              } else {
                toastError("This layer does not have spatial extent data");
              }
            })
            .catch((error: any) => {
              console.error("Error querying layer extent:", error);
              toastError("Unable to retrieve layer extent data");
            });
        } else {
          toastError("This layer type does not support extent zooming");
        }
      }
    } catch (error: any) {
      console.error("Error in handleZoomToLayerExtent:", error);
      toastError("Unable to zoom to layer due to an unexpected error");
    }
  };

  const handleToggleChildFavorite = async (childLayer: WebMapLayer) => {
    try {
      if (childLayer.isAddedFromWebMap && childLayer.itemId) {
        const layerDetails = await getLayerDetails(childLayer.itemId);

        const completeLayer = {
          id: childLayer.id,
          title: childLayer.title,
          type: layerDetails.type || childLayer.type || "Feature Layer",
          typeKeywords:
            layerDetails.typeKeywords || childLayer.typeKeywords || [],
          description: layerDetails.description || "",
          snippet: layerDetails.snippet || "",
          tags: layerDetails.tags || [],
          thumbnail: layerDetails.thumbnail || "",
          extent: childLayer.extent,
          accessInformation: layerDetails.accessInformation || "",
          licenseInfo: layerDetails.licenseInfo || "",
          url: layerDetails.url || childLayer.url,
          access: layerDetails.access || "",
          size: layerDetails.size,
          modified: layerDetails.modified
            ? new Date(layerDetails.modified).getTime()
            : undefined,
          owner: layerDetails.owner || "",
          avgRating: layerDetails.avgRating,
          itemId: childLayer.itemId,
          visibility: childLayer.visibility,
        };

        toggleFavorite(completeLayer);
      } else {
        const layerWithVisibility = {
          id: childLayer.id,
          title: childLayer.title,
          type: childLayer.type || "Feature Layer",
          typeKeywords: childLayer.typeKeywords || [],
          description: "",
          snippet: "",
          tags: [],
          thumbnail: "",
          extent: childLayer.extent,
          accessInformation: "",
          licenseInfo: "",
          url: childLayer.url,
          access: "",
          size: undefined,
          modified: undefined,
          owner: "",
          avgRating: undefined,
          visibility: childLayer.visibility,
        };
        toggleFavorite(layerWithVisibility);
      }
    } catch (error) {
      console.error("Error handling child layer favorite toggle:", error);
      toastError("Failed to update favorites. Please try again.");
    }
  };

  const handleToggleChildPopup = (childLayer: WebMapLayer) => {
    const childLayerId = childLayer.id;
    const newPopupState = !childLayer.popupEnabled;

    // Update ArcGIS map layers
    const parentLayer = mapView?.map?.allLayers.find(
      (layer) => layer.id === parentId,
    );
    if (parentLayer && parentLayer.type === "group") {
      const childArcLayer = (parentLayer as any).layers.find(
        (childLayer: any) => childLayer.id === childLayerId,
      );

      if (!childArcLayer) {
        // Try to find by title if ID doesn't match
        const childLayerData = layers
          .find((l) => l.id === parentId)
          ?.layers?.find((cl) => cl.id === childLayerId);

        if (childLayerData) {
          const childArcLayerByTitle = (parentLayer as any).layers.find(
            (childLayer: any) => childLayer.title === childLayerData.title,
          );

          if (childArcLayerByTitle) {
            childArcLayerByTitle.popupEnabled = newPopupState;
          }
        }
      } else {
        childArcLayer.popupEnabled = newPopupState;
      }
    }

    // Update application state
    const updatedLayers = layers.map((layer) => {
      if (layer.id === parentId && layer.layers) {
        return {
          ...layer,
          layers: layer.layers.map((childLayer) =>
            childLayer.id === childLayerId
              ? { ...childLayer, popupEnabled: newPopupState }
              : childLayer,
          ),
        };
      }
      return layer;
    });
    setLayers(updatedLayers);

    toastSuccess(
      `Popup ${!newPopupState ? "disabled" : "enabled"} successfully`,
    );
  };

  const handleChildLayerOperation = async (
    operation: string,
    event?: React.MouseEvent,
  ) => {
    switch (operation) {
      case "zoom":
        handleZoomToChildLayer(layer.id);
        setIsPopoverOpen(false);
        break;
      case "transparency": {
        setIsPopoverOpen(false);

        let buttonY = 0;
        if (event) {
          const button = (event.target as HTMLElement).closest("button");
          if (button) {
            // Find the child layer row
            const layerRow = button.closest(".p-2.flex.flex-row");
            const layersContainer = button.closest(
              ".h-full.overflow-y-auto.relative",
            );
            if (layerRow && layersContainer) {
              const layerRect = layerRow.getBoundingClientRect();
              const containerRect = layersContainer.getBoundingClientRect();
              buttonY =
                layerRect.top - containerRect.top + layersContainer.scrollTop;
            }
          }
        }

        eventEmitter.emit("OPEN_TRANSPARENCY_SLIDER", {
          id: layer.id,
          name: layer.title,
          opacity: layer.opacity ?? 1,
          parentId: parentId,
          position: { y: buttonY },
        });
        break;
      }
      case "filter":
        handleSetFilter(layer);
        setIsPopoverOpen(false);
        break;
      case "table":
        console.log("Open table for child layer:", layer);
        setIsPopoverOpen(false);
        break;
      case "hide":
        console.log("Hide child layer:", layer);
        setIsPopoverOpen(false);
        break;
      case "popup":
        handleToggleChildPopup(layer);
        setIsPopoverOpen(false);
        break;
      case "favorite":
        await handleToggleChildFavorite(layer);
        setIsPopoverOpen(false);
        break;
      case "details":
        openLayerDetails(layer.itemId || layer.id);
        setIsPopoverOpen(false);
        break;
      case "remove":
        handleRemoveChildLayer(parentId, layer.id);
        setIsPopoverOpen(false);
        break;
      default:
        console.log("Unknown operation:", operation);
        setIsPopoverOpen(false);
    }
  };

  return (
    <Draggable draggableId={layer.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`${
            snapshot.isDragging ? "opacity-50 shadow-lg" : ""
          } transition-all duration-200 ml-6`}
          style={{
            ...provided.draggableProps.style,
            opacity: snapshot.isDragging ? 1 : 1,
            visibility: snapshot.isDragging ? "hidden" : "visible",
          }}
        >
          <div className="p-2 flex flex-row justify-between items-center gap-5">
            <div className="flex flex-row gap-3 items-center flex-1 min-w-0">
              <div
                {...provided.dragHandleProps}
                className="flex-shrink-0 cursor-grab active:cursor-grabbing"
              >
                <GripVertical strokeWidth={0.8} size={16} />
              </div>
              <Checkbox
                className="w-[15px] h-[15px] flex-shrink-0 rounded-[2.6px] border border-gray-200"
                checked={layer.visibility}
                onCheckedChange={(checked) =>
                  onChildCheckChange(parentId, layer.id, Boolean(checked))
                }
              />
              <div className="flex-1 min-w-0">
                <label className="text-[14.5px] font-[400] leading-5 tracking-[-0.084px] block truncate">
                  {layer.title}
                </label>
              </div>
            </div>

            <div className="relative flex flex-row gap-2 items-center">
              <button
                onClick={() => setIsPopoverOpen(!isPopoverOpen)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <Ellipsis strokeWidth={0.8} size={16} />
              </button>

              {isPopoverOpen && (
                <div
                  ref={popoverRef}
                  className="absolute right-0 top-full py-1 mt-1 z-50 flex w-80 min-w-max flex-col items-start rounded-lg border border-[#EBEBEB] bg-white shadow-[0_16px_32px_-12px_rgba(14,18,27,0.10)]"
                >
                  {getChildLayerOperations().map((operation) => {
                    const IconComponent = operation.icon;
                    return (
                      <button
                        key={operation.id}
                        onClick={(e) =>
                          handleChildLayerOperation(operation.operation, e)
                        }
                        className="w-full flex items-center gap-1.5 px-3 py-2 text-left hover:bg-gray-50 rounded transition-colors"
                      >
                        <IconComponent />
                        <span className="text-[14px] text-[#171717] font-[400]">
                          {operation.label}
                        </span>
                      </button>
                    );
                  })}

                  <div className="w-[calc(100%-16px)] h-px bg-gray-200 mx-2" />

                  <button
                    onClick={() => handleChildLayerOperation("remove")}
                    className="w-full flex items-center gap-1.5 px-3 py-2 text-left hover:bg-gray-50 rounded transition-colors text-red-600"
                  >
                    <RemoveLayerIcon />
                    <span className="text-[14px] font-[400]">Remove Layer</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default GroupLayerChild;
