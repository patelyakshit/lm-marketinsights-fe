import {
  ChevronRight,
  ChevronDown,
  Ellipsis,
  GripVertical,
  Loader2,
} from "lucide-react";
import { useMapStore } from "../../../store/useMapStore";
import { useMapLayers } from "../../../hooks/useMapLayers";
import { Checkbox } from "../../ui/checkbox";
import { useState, useRef, useEffect, useMemo } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import AddData from "./AddData";
import ZoomLayerIcon from "../../svg/ZoomLayerIcon";
import SetTransparencyIcon from "../../svg/SetTransparencyIcon";
import SetFilterIcon from "../../svg/SetFilterIcon";
import OpenTable from "../../svg/OpenTable";
import HideLayer from "../../svg/HideLayer";
import DisablePopUpIcon from "../../svg/DisablepopupIcon";
import ShowDetails from "../../svg/ShowDetails";
import RemoveLayerIcon from "../../svg/RemoveLayerIcon";
import { toastSuccess, toastError } from "../../../utils/toast";
import { AppliedLayer } from "../../../schema";
import request from "@arcgis/core/request";
import GroupLayerChild from "./GroupLayerChild";
import TransparencySlider from "./TransparencySlider";
import { eventEmitter } from "../../../utils/eventEmitter";
import { useLayerDetailsStore } from "../../../store/useLayerDetailsStore";
import { useFavorites } from "../../../hooks/useFavorites";
import { getLayerDetails } from "../../../api";
import FavoriteIcon from "../../svg/FavoriteLayerIcon";
import { saveUserLayer, removeUserLayer } from "../../../utils/layerStorage";

interface LayersProps {
  onAddLayer?: (layer: any) => Promise<void>;
  onRemoveLayer?: (layerId: string) => void;
  isLayerAdded?: (layerId: string) => boolean;
  addingLayerId?: string | null;
  hideAddDataButton?: boolean;
  searchQuery?: string;
}

const Layers = ({
  onAddLayer,
  onRemoveLayer,
  isLayerAdded,
  addingLayerId: propAddingLayerId,
  hideAddDataButton = false,
  searchQuery = "",
}: LayersProps) => {
  const { layers, setLayers, mapView, reorderLayers } = useMapStore();
  const { isMapLoading } = useMapLayers({ view: mapView });
  const { openLayerDetails } = useLayerDetailsStore();
  const { toggleFavorite, isFavorite } = useFavorites();

  const ensureOpacityInitialized = (layers: AppliedLayer[]): AppliedLayer[] => {
    return layers.map((layer) => ({
      ...layer,
      opacity: layer.opacity ?? 1,
      layers: layer.layers?.map((childLayer) => ({
        ...childLayer,
        opacity: childLayer.opacity ?? 1,
      })),
    }));
  };
  const [isAddDataOpen, setIsAddDataOpen] = useState(false);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set());
  const [localAddingLayerId, setLocalAddingLayerId] = useState<string | null>(
    null,
  );
  const [reorderingLayerIds, setReorderingLayerIds] = useState<Set<string>>(
    new Set(),
  );
  const [removingLayerId, setRemovingLayerId] = useState<string | null>(null);
  const [showTransparencySlider, setShowTransparencySlider] = useState(false);
  const [currentTransparencyLayer, setCurrentTransparencyLayer] =
    useState<any>(null);
  const [transparencySliderPosition, setTransparencySliderPosition] = useState({
    x: 100,
    y: 100,
  });
  const popoverRef = useRef<HTMLDivElement>(null);

  // Use props if provided, otherwise use local state
  const currentAddingLayerId =
    propAddingLayerId !== undefined ? propAddingLayerId : localAddingLayerId;
  const currentIsLayerAdded =
    isLayerAdded ||
    ((layerId: string) => layers.some((layer) => layer.id === layerId));

  // Filter layers based on search query
  const filteredLayers = useMemo(() => {
    if (!searchQuery.trim()) {
      return layers;
    }

    const query = searchQuery.toLowerCase().trim();

    return layers.filter((layer) => {
      // Check if parent layer title matches
      const parentMatches = layer.title?.toLowerCase().includes(query);

      // Check if any child layer title matches
      const childMatches = layer.layers?.some((childLayer) =>
        childLayer.title?.toLowerCase().includes(query),
      );

      return parentMatches || childMatches;
    });
  }, [layers, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setOpenPopoverId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const layersWithOpacity = ensureOpacityInitialized(layers);
    const hasChanges = layers.some((layer, index) => {
      const updatedLayer = layersWithOpacity[index];
      return (
        layer.opacity !== updatedLayer.opacity ||
        layer.layers?.some(
          (childLayer, childIndex) =>
            childLayer.opacity !== updatedLayer.layers?.[childIndex]?.opacity,
        )
      );
    });

    if (hasChanges) {
      setLayers(layersWithOpacity);
    }
  }, []);

  // Sync child layers from loaded GroupLayers on the map
  useEffect(() => {
    if (!mapView?.map) return;

    const updateChildLayers = () => {
      if (!mapView?.map) return;
      const map = mapView.map;

      const updatedLayers = layers.map((layer) => {
        // Process GroupLayers that need child layer syncing
        if (
          layer.type === "GroupLayer" ||
          layer.layerType === "GroupLayer" ||
          layer.type === "Group Layer" ||
          layer.layerType === "Group Layer" ||
          (layer.typeKeywords && layer.typeKeywords.includes("Group Layer"))
        ) {
          const mapLayer = map.findLayerById(layer.id);
          if (mapLayer && mapLayer.type === "group") {
            const groupLayer = mapLayer as __esri.GroupLayer;
            if (groupLayer.loaded && groupLayer.layers.length > 0) {
              // Get actual ArcGIS layer IDs from the map
              const mapChildLayers = groupLayer.layers.toArray();
              const mapChildCount = mapChildLayers.length;
              const currentChildCount = layer.layers?.length || 0;

              // Check if IDs match - this ensures toggle functionality works
              const currentIds = (layer.layers || []).map((l: any) => l.id);
              const mapIds = mapChildLayers.map(
                (l: any) =>
                  l.id || `${layer.id}_child_${mapChildLayers.indexOf(l)}`,
              );
              const idsMatch =
                currentIds.length === mapIds.length &&
                currentIds.every((id: string) => mapIds.includes(id));

              // Sync if: no children, count differs, or IDs don't match
              if (
                currentChildCount === 0 ||
                currentChildCount !== mapChildCount ||
                !idsMatch
              ) {
                console.log(
                  `Syncing child layers for ${layer.title}, found ${mapChildCount} children (store has ${currentChildCount}), IDs match: ${idsMatch}`,
                );
                const childLayers = mapChildLayers.map(
                  (childLayer: any, index: number) => ({
                    // IMPORTANT: Use actual ArcGIS layer ID for proper toggle
                    id: childLayer.id || `${layer.id}_child_${index}`,
                    title: childLayer.title || "Unnamed Layer",
                    type: childLayer.type || "Feature Layer",
                    layerType: childLayer.type || "Feature Layer",
                    url: childLayer.url,
                    visibility: childLayer.visible !== false,
                    popupEnabled: childLayer.popupEnabled !== false,
                    labelsVisible: childLayer.labelsVisible !== false,
                    itemId: childLayer.portalItem?.id,
                    parentId: layer.id,
                    isChildLayer: true,
                    minScale: childLayer.minScale,
                    maxScale: childLayer.maxScale,
                    opacity: childLayer.opacity ?? 1,
                    isAddedFromWebMap: true,
                  }),
                );

                console.log(`Child layers for ${layer.title}:`, childLayers);
                return {
                  ...layer,
                  layers: childLayers,
                };
              }
            } else if (!groupLayer.loaded) {
              // Layer not loaded yet, wait for it
              groupLayer.when(() => {
                if (groupLayer.layers.length > 0) {
                  console.log(
                    `Layer ${layer.title} loaded, syncing ${groupLayer.layers.length} children`,
                  );
                  debouncedUpdate();
                }
              });
            }
          }
        }
        return layer;
      });

      const hasChanges = updatedLayers.some((updatedLayer, index) => {
        const originalLayer = layers[index];
        const countChanged =
          (updatedLayer.layers?.length || 0) !==
          (originalLayer.layers?.length || 0);

        // Also check if IDs changed (even if count is same)
        const updatedIds = (updatedLayer.layers || []).map((l: any) => l.id);
        const originalIds = (originalLayer.layers || []).map((l: any) => l.id);
        const idsChanged =
          updatedIds.length !== originalIds.length ||
          !updatedIds.every((id: string, i: number) => id === originalIds[i]);

        const hasLayerChanges = countChanged || idsChanged;
        if (hasLayerChanges) {
          console.log(
            `Layer ${updatedLayer.title} has changes: count ${originalLayer.layers?.length || 0} -> ${updatedLayer.layers?.length || 0}, IDs changed: ${idsChanged}`,
          );
        }
        return hasLayerChanges;
      });

      if (hasChanges) {
        console.log("Updating layers with synced child layers");
        console.log(
          "Updated layers:",
          updatedLayers
            .filter((l) => l.layers && l.layers.length > 0)
            .map((l) => ({
              title: l.title,
              id: l.id,
              childCount: l.layers?.length || 0,
            })),
        );

        setLayers(updatedLayers);

        // Auto-expand group layers that just got their children synced
        const layersWithNewChildren = updatedLayers.filter(
          (updatedLayer, index) => {
            const originalLayer = layers[index];
            return (
              (updatedLayer.layers?.length || 0) > 0 &&
              (originalLayer.layers?.length || 0) === 0
            );
          },
        );

        if (layersWithNewChildren.length > 0) {
          setExpandedLayers((prev) => {
            const newExpanded = new Set(prev);
            layersWithNewChildren.forEach((layer) => {
              newExpanded.add(layer.id);
            });
            return newExpanded;
          });
        }
      } else {
        console.log("No child layer changes detected");
      }
    };

    // Debounced update function to avoid excessive calls
    let updateTimeout: NodeJS.Timeout | null = null;
    const debouncedUpdate = () => {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      updateTimeout = setTimeout(() => {
        updateChildLayers();
        updateTimeout = null;
      }, 300);
    };

    updateChildLayers();

    const fallbackCheck = setTimeout(() => {
      console.log("Fallback check for child layers (2500ms)");
      updateChildLayers();
    }, 2500);

    // Watch for when layers are added to the map
    const handleLayerAdded = (event: any) => {
      if (event.layer && event.layer.type === "group") {
        console.log(
          "Group layer added to map:",
          event.layer.title,
          "ID:",
          event.layer.id,
        );
        const groupLayer = event.layer as __esri.GroupLayer;
        if (groupLayer.loaded) {
          debouncedUpdate();
        } else {
          groupLayer.when(() => {
            console.log(
              "Group layer loaded after add:",
              groupLayer.title,
              "sublayerCount:",
              groupLayer.layers.length,
            );
            setTimeout(() => {
              debouncedUpdate();
            }, 200);
          });
        }
      }
    };

    const allLayers = mapView.map.allLayers;
    allLayers.on("after-add", handleLayerAdded);

    const layerWatchers: Array<{ remove: () => void }> = [];
    allLayers.forEach((layer) => {
      if (layer.type === "group") {
        const groupLayer = layer as __esri.GroupLayer;
        if (!groupLayer.loaded) {
          groupLayer.when(() => {
            console.log("Group layer loaded via when():", groupLayer.title);
            debouncedUpdate();
          });
        }

        const watcher = groupLayer.watch("loaded", (loaded) => {
          if (loaded) {
            console.log(
              "Group layer loaded property changed to true:",
              groupLayer.title,
            );
            debouncedUpdate();
          }
        });
        layerWatchers.push(watcher);
      }
    });

    return () => {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      clearTimeout(fallbackCheck);
      layerWatchers.forEach((watcher) => watcher.remove());
    };
  }, [layers, mapView, setLayers]);

  useEffect(() => {
    if (currentTransparencyLayer && showTransparencySlider) {
      const layerId = currentTransparencyLayer.id;
      const parentId = currentTransparencyLayer.parentId;

      let updatedOpacity = currentTransparencyLayer.opacity;

      if (parentId) {
        const parentLayer = layers.find((l) => l.id === parentId);
        const childLayer = parentLayer?.layers?.find((cl) => cl.id === layerId);
        updatedOpacity = childLayer?.opacity ?? 1;
      } else {
        const layer = layers.find((l) => l.id === layerId);
        updatedOpacity = layer?.opacity ?? 1;
      }

      if (updatedOpacity !== currentTransparencyLayer.opacity) {
        setCurrentTransparencyLayer((prev: any) => ({
          ...prev!,
          opacity: updatedOpacity,
        }));
      }
    }
  }, [layers, currentTransparencyLayer, showTransparencySlider]);

  useEffect(() => {
    const unsubscribeTransparencySlider = eventEmitter.on(
      "OPEN_TRANSPARENCY_SLIDER",
      (layerData: {
        id: string;
        name: string;
        opacity: number;
        parentId?: string;
        position?: { y: number };
      }) => {
        setCurrentTransparencyLayer(layerData);
        setShowTransparencySlider(true);

        const yPosition = layerData.position?.y ?? 0;

        setTransparencySliderPosition({ x: 0, y: yPosition });
      },
    );

    return () => {
      unsubscribeTransparencySlider();
    };
  }, []);

  useEffect(() => {
    const handleClickOutsideTransparency = (event: MouseEvent) => {
      const target = event.target as Element;
      const layersContainer = target.closest(
        ".h-full.overflow-y-auto.relative",
      );

      if (layersContainer && !target.closest("[data-transparency-slider]")) {
        setShowTransparencySlider(false);
        setCurrentTransparencyLayer(null);
      }
    };

    if (showTransparencySlider) {
      document.addEventListener("mousedown", handleClickOutsideTransparency);
      return () => {
        document.removeEventListener(
          "mousedown",
          handleClickOutsideTransparency,
        );
      };
    }
  }, [showTransparencySlider]);

  // Clear loading states when map operations are complete
  useEffect(() => {
    if (!isMapLoading) {
      setReorderingLayerIds(new Set());
      setRemovingLayerId(null);
    }
  }, [isMapLoading]);

  const toggleExpand = (layerId: string) => {
    setExpandedLayers((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(layerId)) {
        newExpanded.delete(layerId);
      } else {
        newExpanded.add(layerId);
      }
      return newExpanded;
    });
  };

  const handleChildCheckChange = (
    parentId: string,
    childId: string,
    checked: boolean,
  ) => {
    console.log(
      `Toggling child layer: ${childId} in parent: ${parentId} to ${checked}`,
    );

    // Get child layer info from state for fallback matching
    const parentFromState = layers.find((l) => l.id === parentId);
    const childFromState = parentFromState?.layers?.find(
      (l: any) => l.id === childId,
    );
    const childTitle = childFromState?.title;

    if (mapView?.map) {
      const parentLayer = mapView.map.findLayerById(parentId) as any;
      if (parentLayer && parentLayer.layers) {
        console.log(
          `Found parent layer, type: ${parentLayer.type}, layers count: ${parentLayer.layers.length}`,
        );

        // Find sublayer by ID first
        let sublayer = parentLayer.layers.find((sl: any) => sl.id === childId);

        // Fallback: Try matching by title if ID doesn't match
        if (!sublayer && childTitle) {
          console.log(`ID match failed, trying title match for: ${childTitle}`);
          sublayer = parentLayer.layers.find(
            (sl: any) => sl.title === childTitle,
          );
          if (sublayer) {
            console.log(
              `Found sublayer by title: ${childTitle}, ID: ${sublayer.id}`,
            );
          }
        }

        // Fallback: Try matching by index if both ID and title fail
        if (!sublayer && childFromState) {
          const childIndex = parentFromState?.layers?.findIndex(
            (l: any) => l.id === childId,
          );
          if (childIndex !== undefined && childIndex >= 0) {
            const layersArray = parentLayer.layers.toArray
              ? parentLayer.layers.toArray()
              : parentLayer.layers;
            if (layersArray[childIndex]) {
              sublayer = layersArray[childIndex];
              console.log(
                `Found sublayer by index ${childIndex}: ${sublayer.title}, ID: ${sublayer.id}`,
              );
            }
          }
        }

        if (sublayer) {
          console.log(
            `Setting sublayer ${sublayer.id} (${sublayer.title}) visible to ${checked}`,
          );
          sublayer.visible = checked;
        } else {
          console.warn(`Sublayer ${childId} not found in parent ${parentId}`);
          console.log(
            "Available sublayer IDs:",
            parentLayer.layers.map((sl: any) => `${sl.id} (${sl.title})`),
          );
        }
      } else {
        console.warn(`Parent layer ${parentId} not found or has no layers`);
      }
    }

    const updatedLayers = layers.map((layer) => {
      if (layer.id === parentId && layer.layers) {
        return {
          ...layer,
          layers: layer.layers.map((childLayer) =>
            childLayer.id === childId
              ? { ...childLayer, visibility: checked }
              : childLayer,
          ),
        };
      }
      return layer;
    });
    setLayers(updatedLayers);
  };

  const handleRemoveChildLayer = (parentId: string, childId: string) => {
    const updatedLayers = layers.map((layer) => {
      if (layer.id === parentId && layer.layers) {
        return {
          ...layer,
          layers: layer.layers.filter(
            (childLayer) => childLayer.id !== childId,
          ),
        };
      }
      return layer;
    });
    setLayers(updatedLayers);
    toastSuccess("Child layer removed successfully");
  };

  const handleTogglePopup = (layer: any) => {
    const layerId = layer.id;
    const newPopupState = !layer.popupEnabled;

    // Update ArcGIS map layers
    const arcLayer = mapView?.map?.allLayers.find(
      (layer) => layer.id === layerId,
    );
    if (arcLayer) {
      (arcLayer as any).popupEnabled = newPopupState;

      if (arcLayer.type === "group") {
        (arcLayer as any).layers.forEach((childLayer: any) => {
          childLayer.popupEnabled = newPopupState;
        });
      }
    }

    // Update application state
    const updatedLayers = layers.map((layer: AppliedLayer) => {
      if (layer.id === layerId) {
        return {
          ...layer,
          popupEnabled: newPopupState,
          layers: layer.layers?.map((childLayer) => ({
            ...childLayer,
            popupEnabled: newPopupState,
          })),
        };
      }
      return layer;
    });
    setLayers(updatedLayers);

    toastSuccess(
      `Popup ${!newPopupState ? "disabled" : "enabled"} successfully`,
    );
  };

  const handleTransparencyChange = (opacity: number) => {
    if (!currentTransparencyLayer) return;

    const layerId = currentTransparencyLayer.id;

    const isChildLayer = currentTransparencyLayer.parentId;

    if (isChildLayer) {
      const parentLayerId = currentTransparencyLayer.parentId;
      const arcParentLayer = mapView?.map?.allLayers.find(
        (layer) => layer.id === parentLayerId,
      );

      if (arcParentLayer && arcParentLayer.type === "group") {
        let childArcLayer = (arcParentLayer as any).layers.find(
          (childLayer: any) => childLayer.id === layerId,
        );

        if (!childArcLayer) {
          const childLayerData = layers
            .find((l) => l.id === parentLayerId)
            ?.layers?.find((cl) => cl.id === layerId);

          if (childLayerData) {
            childArcLayer = (arcParentLayer as any).layers.find(
              (childLayer: any) => childLayer.title === childLayerData.title,
            );
          }
        }

        if (childArcLayer) {
          childArcLayer.opacity = opacity;
        } else {
          console.error(`Could not find child layer with ID: ${layerId}`);
        }
      }

      const updatedLayers = layers.map((layer: AppliedLayer) => {
        if (layer.id === parentLayerId && layer.layers) {
          return {
            ...layer,
            layers: layer.layers.map((childLayer) =>
              childLayer.id === layerId
                ? { ...childLayer, opacity: opacity }
                : childLayer,
            ),
          };
        }
        return layer;
      });
      setLayers(updatedLayers);
    } else {
      const arcLayer = mapView?.map?.allLayers.find(
        (layer) => layer.id === layerId,
      );
      if (arcLayer) {
        arcLayer.opacity = opacity;

        if (arcLayer.type === "group") {
          (arcLayer as any).layers.forEach((childLayer: any) => {
            childLayer.opacity = opacity;
          });
        }
      } else {
        console.error(`Could not find parent layer with ID: ${layerId}`);
      }

      const updatedLayers = layers.map((layer: AppliedLayer) => {
        if (layer.id === layerId) {
          return {
            ...layer,
            opacity: opacity,
            layers: layer.layers?.map((childLayer) => ({
              ...childLayer,
              opacity: opacity,
            })),
          };
        }
        return layer;
      });
      setLayers(updatedLayers);
    }
  };

  const handleCloseTransparencySlider = () => {
    setShowTransparencySlider(false);
    setCurrentTransparencyLayer(null);
  };

  const handleAddLayer = async (layerToAdd: any): Promise<void> => {
    if (onAddLayer) {
      await onAddLayer(layerToAdd);
      return;
    }

    setLocalAddingLayerId(layerToAdd.id);

    try {
      // If layer doesn't have a URL but has an ID (curated/ArcGIS layer), fetch the URL
      let layerUrl = layerToAdd.url;
      let layerTypeFromMetadata = layerToAdd.type;

      if (!layerUrl && layerToAdd.id && !layerToAdd.isAddedFromFile) {
        try {
          console.log(`Fetching metadata for layer: ${layerToAdd.title}`);
          const response = await fetch(
            `https://www.arcgis.com/sharing/rest/content/items/${layerToAdd.id}?f=json&token=${import.meta.env.VITE_ARCGIS_API_KEY}`,
          );
          const data = await response.json();
          layerUrl = data.url;
          // Get the actual type from metadata if available
          if (data.type) {
            layerTypeFromMetadata = data.type;
          }
          // Also update typeKeywords if available
          if (data.typeKeywords && !layerToAdd.typeKeywords) {
            layerToAdd.typeKeywords = data.typeKeywords;
          }
          console.log(`Fetched metadata for layer ${layerToAdd.title}:`, {
            url: layerUrl,
            type: layerTypeFromMetadata,
            typeKeywords: data.typeKeywords,
          });
        } catch (error) {
          console.warn(
            `Could not fetch URL for layer ${layerToAdd.id}:`,
            error,
          );
        }
      }

      // Determine if this is a group layer (Web Map or GroupLayer)
      const isGroupLayer =
        layerToAdd.type === "GroupLayer" ||
        layerToAdd.layerType === "GroupLayer" ||
        layerToAdd.type === "Web Map" ||
        layerTypeFromMetadata === "Web Map" ||
        (layerToAdd.typeKeywords &&
          layerToAdd.typeKeywords.includes("Web Map"));

      const layerWithVisibility: AppliedLayer = {
        id: layerToAdd.id,
        title: layerToAdd.title,
        type: isGroupLayer ? "GroupLayer" : layerTypeFromMetadata,
        layerType: isGroupLayer ? "GroupLayer" : layerTypeFromMetadata,
        url: layerUrl,
        visibility: true,
        popupEnabled: true,
        labelsVisible: true,
        typeKeywords: layerToAdd.typeKeywords || [],
        itemId: layerToAdd.id,
        extent: layerToAdd.extent,
        opacity: 1,
        isAddedFromFile: layerToAdd.isAddedFromFile,
      };

      if (
        layerToAdd.type === "Map Service" ||
        layerToAdd.layerType === "Map Service"
      ) {
        try {
          const response = await request(`${layerToAdd.url}?f=json`, {
            method: "auto",
          });

          if (response.data.layers && response.data.layers.length > 0) {
            const childLayers = response.data.layers.map((subLayer: any) => ({
              id: `${layerToAdd.id}_${subLayer.id}`,
              title: subLayer.name,
              type: subLayer.type || "Feature Layer",
              layerType: subLayer.type || "Feature Layer",
              visibility: subLayer.defaultVisibility !== false,
              popupEnabled: true,
              labelsVisible: true,
              minScale: subLayer.minScale,
              maxScale: subLayer.maxScale,
              parentId: layerToAdd.id,
              isChildLayer: true,
              sublayerId: subLayer.id,
              url: layerToAdd.url,
              geometryType: subLayer.geometryType,
              supportsDynamicLegends: subLayer.supportsDynamicLegends,
              opacity: 1,
            }));

            const layerWithChildLayers = {
              ...layerWithVisibility,
              layers: childLayers,
            };

            if (layers.some((l) => l.id === layerWithVisibility.id)) {
              toastError("Layer already added");
              return;
            }

            setLayers([...layers, layerWithChildLayers]);
            toastSuccess(
              `Added Map Service with ${childLayers.length} sublayers`,
            );
          } else {
            setLayers([...layers, layerWithVisibility]);
            toastSuccess("Layer added successfully");
          }
        } catch (error) {
          console.warn("Could not fetch Map Service sublayers:", error);
          setLayers([...layers, layerWithVisibility]);
          toastSuccess("Layer added successfully");
        }
      } else if (isGroupLayer) {
        // For Web Maps or Group Layers from curated layers, fetch the portal item data to get child layers
        let childLayers: any[] = layerToAdd.layers || [];

        // If no child layers, fetch the portal item data
        if (
          childLayers.length === 0 &&
          layerToAdd.id &&
          !layerToAdd.isAddedFromFile
        ) {
          try {
            const portalItemResponse = await fetch(
              `https://www.arcgis.com/sharing/rest/content/items/${layerToAdd.id}/data?f=json&token=${import.meta.env.VITE_ARCGIS_API_KEY}`,
            );
            const portalItemData = await portalItemResponse.json();

            // Check for Web Map structure (operationalLayers)
            if (
              portalItemData.operationalLayers &&
              portalItemData.operationalLayers.length > 0
            ) {
              childLayers = portalItemData.operationalLayers.map(
                (childLayer: any, index: number) => ({
                  id:
                    childLayer.id ||
                    `${layerToAdd.id}_child_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  title: childLayer.title || "Unnamed Layer",
                  type:
                    childLayer.layerType || childLayer.type || "Feature Layer",
                  layerType:
                    childLayer.layerType || childLayer.type || "Feature Layer",
                  url: childLayer.url,
                  visibility: childLayer.visibility !== false,
                  popupEnabled: childLayer.popupEnabled !== false,
                  labelsVisible: childLayer.labelsVisible !== false,
                  itemId: childLayer.itemId,
                  parentId: layerToAdd.id,
                  isChildLayer: true,
                  minScale: childLayer.minScale,
                  opacity: childLayer.opacity ?? 1,
                  isAddedFromWebMap: true,
                }),
              );
            }
            // Check for Group Layer structure (layers array)
            else if (
              portalItemData.layers &&
              Array.isArray(portalItemData.layers) &&
              portalItemData.layers.length > 0
            ) {
              childLayers = portalItemData.layers.map(
                (childLayer: any, index: number) => ({
                  id:
                    childLayer.id ||
                    `${layerToAdd.id}_child_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  title: childLayer.title || childLayer.name || "Unnamed Layer",
                  type:
                    childLayer.layerType || childLayer.type || "Feature Layer",
                  layerType:
                    childLayer.layerType || childLayer.type || "Feature Layer",
                  url: childLayer.url,
                  visibility:
                    childLayer.visibility !== false &&
                    childLayer.defaultVisibility !== false,
                  popupEnabled: childLayer.popupEnabled !== false,
                  labelsVisible: childLayer.labelsVisible !== false,
                  itemId: childLayer.itemId,
                  parentId: layerToAdd.id,
                  isChildLayer: true,
                  minScale: childLayer.minScale,
                  maxScale: childLayer.maxScale,
                  opacity: childLayer.opacity ?? 1,
                  sublayerId: childLayer.id,
                }),
              );
            }
          } catch (error) {
            console.warn("Could not fetch Group Layer child layers:", error);
          }
        }

        const layerWithChildLayers = {
          ...layerWithVisibility,
          layers: childLayers,
        };

        if (layers.some((l) => l.id === layerWithVisibility.id)) {
          toastError("Layer already added");
          return;
        }

        setLayers([...layers, layerWithChildLayers]);
        // Save to localStorage for persistence across page refreshes
        saveUserLayer(layerWithChildLayers);
        toastSuccess(`Added Group Layer with ${childLayers.length} sublayers`);
      } else {
        setLayers([...layers, layerWithVisibility]);
        // Save to localStorage for persistence across page refreshes
        saveUserLayer(layerWithVisibility);
        toastSuccess("Layer added successfully");
      }
    } catch (error) {
      console.error("Error adding layer:", error);
      toastError("Failed to add layer. Please try again.");
    } finally {
      setLocalAddingLayerId(null);
    }
  };

  const localHandleRemoveLayer = (layerId: string) => {
    setRemovingLayerId(layerId);

    if (onRemoveLayer) {
      onRemoveLayer(layerId);
      setRemovingLayerId(null);
      return;
    }

    const updatedLayers = layers.filter((l) => l.id !== layerId);
    setLayers(updatedLayers);

    // Also remove from localStorage (if it was a user-added layer)
    removeUserLayer(layerId);

    toastSuccess("Layer removed successfully");

    // Reset removing state after a short delay
    setTimeout(() => {
      setRemovingLayerId(null);
    }, 500);
  };

  const handleEllipsisClick = (layerId: string) => {
    setOpenPopoverId(openPopoverId === layerId ? null : layerId);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const { source, destination } = result;

    if (source.index === destination.index) {
      return;
    }

    // Handle child layer reordering
    if (
      source.droppableId !== "layers" &&
      destination.droppableId !== "layers"
    ) {
      const parentId = source.droppableId;
      const parentLayer = layers.find((layer) => layer.id === parentId);

      if (parentLayer && parentLayer.layers) {
        const newChildLayers = Array.from(parentLayer.layers);
        const [reorderedItem] = newChildLayers.splice(source.index, 1);
        newChildLayers.splice(destination.index, 0, reorderedItem);

        const updatedLayers = layers.map((layer) =>
          layer.id === parentId ? { ...layer, layers: newChildLayers } : layer,
        );
        setLayers(updatedLayers);
      }
      return;
    }

    // Handle parent layer reordering
    const totalLayers = layers.length;
    const actualSourceIndex = totalLayers - 1 - source.index;
    const actualDestinationIndex = totalLayers - 1 - destination.index;

    // Get the layer being reordered
    const sourceLayer = layers[actualSourceIndex];

    if (sourceLayer) {
      setReorderingLayerIds(new Set([sourceLayer.id]));
    }

    reorderLayers(actualSourceIndex, actualDestinationIndex);

    // Reset reordering state after a short delay to allow map operations to complete
    setTimeout(() => {
      setReorderingLayerIds(new Set());
    }, 500);
  };

  const handleZoomToLayer = (id: string, url: string) => {
    if (!mapView || !mapView.map) return;

    let layer = mapView.map.allLayers.find((layer) => layer.id === id);
    if (!layer) {
      layer = mapView.map.allLayers.find((layer) => (layer as any).url === url);
    }
    if (!layer) {
      toastError("Unable to locate the layer for zooming");
      return;
    }

    try {
      if (layer.type === "group") {
        const groupLayer = layer as __esri.GroupLayer;
        if (groupLayer.layers.length > 0) {
          const extents = groupLayer.layers
            .toArray()
            .map((childLayer) => {
              if (childLayer.fullExtent) {
                return childLayer.fullExtent;
              }
              return null;
            })
            .filter(Boolean);

          if (extents.length > 0) {
            let combinedExtent = extents[0]!;
            for (let i = 1; i < extents.length; i++) {
              const extent = extents[i];
              if (extent) {
                combinedExtent = combinedExtent.union(extent);
              }
            }

            mapView
              .goTo(combinedExtent, {
                duration: 1000,
                easing: "ease-out",
              })
              .then(() => {
                toastSuccess("Zoomed to layer extent");
              })
              .catch((error) => {
                console.error("Error zooming to layer extent:", error);
                toastError("Failed to zoom to layer extent");
              });
          }
        }
      } else {
        if (layer.fullExtent) {
          mapView
            .goTo(layer.fullExtent, {
              duration: 1000,
              easing: "ease-out",
            })
            .then(() => {
              toastSuccess("Zoomed to layer extent");
            })
            .catch((error) => {
              console.error("Error zooming to layer extent:", error);
              toastError("Failed to zoom to layer extent");
            });
        } else {
          if (layer.type === "feature") {
            const featureLayer = layer as __esri.FeatureLayer;
            featureLayer
              .queryExtent()
              .then((result) => {
                if (result.extent) {
                  mapView
                    .goTo(result.extent, {
                      duration: 1000,
                      easing: "ease-out",
                    })
                    .then(() => {
                      toastSuccess("Zoomed to layer extent");
                    })
                    .catch((error) => {
                      console.error("Error zooming to layer extent:", error);
                      toastError("Failed to zoom to layer extent");
                    });
                } else {
                  toastError("This layer does not have spatial extent data");
                }
              })
              .catch((error) => {
                console.error("Error querying layer extent:", error);
                toastError("Unable to retrieve layer extent data");
              });
          } else {
            toastError("This layer type does not support extent zooming");
          }
        }
      }
    } catch (error) {
      console.error("Error in handleZoomToLayer:", error);
      toastError("Unable to zoom to layer due to an unexpected error");
    }
  };

  const handleToggleFavorite = async (layer: any) => {
    try {
      if (layer.isAddedFromWebMap && layer.itemId) {
        const layerDetails = await getLayerDetails(layer.itemId);

        const completeLayer = {
          id: layer.id,
          title: layer.title,
          type: layerDetails.type || layer.type,
          typeKeywords: layerDetails.typeKeywords || layer.typeKeywords || [],
          description: layerDetails.description || "",
          snippet: layerDetails.snippet || "",
          tags: layerDetails.tags || [],
          thumbnail: layerDetails.thumbnail || "",
          extent: layer.extent,
          accessInformation: layerDetails.accessInformation || "",
          licenseInfo: layerDetails.licenseInfo || "",
          url: layerDetails.url || layer.url,
          access: layerDetails.access || "",
          size: layerDetails.size,
          modified: layerDetails.modified
            ? new Date(layerDetails.modified).getTime()
            : undefined,
          owner: layerDetails.owner || "",
          avgRating: layerDetails.avgRating,
          itemId: layer.itemId,
          visibility: layer.visibility,
        };

        toggleFavorite(completeLayer);
      } else {
        const layerWithVisibility = {
          ...layer,
          visibility: layer.visibility,
        };
        toggleFavorite(layerWithVisibility);
      }
    } catch (error) {
      console.error("Error handling favorite toggle:", error);
      toastError("Failed to update favorites. Please try again.");
    }
  };

  const getLayerOperations = (layer: any) => {
    const baseOperations = [
      {
        id: "zoom",
        label: "Zoom to layer",
        icon: ZoomLayerIcon,
        operation: "zoom",
        disabled: false,
      },
      {
        id: "transparency",
        label: "Set transparency",
        icon: SetTransparencyIcon,
        operation: "transparency",
        disabled: false,
      },
      {
        id: "filter",
        label: "Set Filter",
        icon: SetFilterIcon,
        operation: "filter",
        disabled: true,
      },
      {
        id: "table",
        label: "Open Table",
        icon: OpenTable,
        operation: "table",
        disabled: true,
      },
      {
        id: "hide",
        label: "Hide layer",
        icon: HideLayer,
        operation: "hide",
        disabled: true,
      },
      {
        id: "popup",
        label: layer.popupEnabled ? "Disable popup" : "Enable popup",
        icon: DisablePopUpIcon,
        operation: "popup",
        disabled: false,
      },
    ];

    // Only add favorite option for non-Group layers
    if (layer.type !== "GroupLayer" && layer.layerType !== "GroupLayer") {
      baseOperations.push({
        id: "favorite",
        label: isFavorite(layer.id)
          ? "Remove from favorite"
          : "Add to favorite",
        icon: FavoriteIcon,
        operation: "favorite",
        disabled: false,
      });
    }

    if (layer.type !== "GroupLayer" && layer.layerType !== "GroupLayer") {
      baseOperations.push({
        id: "details",
        label: "Show details",
        icon: ShowDetails,
        operation: "details",
        disabled: layer.isAddedFromFile,
      });
    }

    return baseOperations;
  };

  const handleLayerOperation = async (
    operation: string,
    layer: any,
    event?: React.MouseEvent,
  ) => {
    switch (operation) {
      case "zoom":
        handleZoomToLayer(layer.id, layer.url);
        setOpenPopoverId(null);
        break;
      case "transparency": {
        setOpenPopoverId(null);

        let buttonY = 0;
        if (event) {
          const button = (event.target as HTMLElement).closest("button");
          if (button) {
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
          position: { y: buttonY },
        });
        break;
      }
      case "filter":
        console.log("Set filter for layer:", layer);
        setOpenPopoverId(null);
        break;
      case "table":
        console.log("Open table for layer:", layer);
        setOpenPopoverId(null);
        break;
      case "hide":
        console.log("Hide layer:", layer);
        setOpenPopoverId(null);
        break;
      case "popup":
        handleTogglePopup(layer);
        setOpenPopoverId(null);
        break;
      case "details":
        openLayerDetails(layer.itemId);
        setOpenPopoverId(null);
        break;
      case "favorite":
        await handleToggleFavorite(layer);
        setOpenPopoverId(null);
        break;
      case "remove":
        localHandleRemoveLayer(layer.id);
        setOpenPopoverId(null);
        break;
      default:
        console.log("Unknown operation:", operation);
        setOpenPopoverId(null);
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto relative bg-white">
      {isAddDataOpen ? (
        <AddData
          onBack={() => setIsAddDataOpen(false)}
          onAddLayer={handleAddLayer}
          onRemoveLayer={localHandleRemoveLayer}
          isLayerAdded={currentIsLayerAdded}
          addingLayerId={currentAddingLayerId}
        />
      ) : (
        <>
          {!hideAddDataButton && (
            <div className="flex justify-center w-full">
              <button
                onClick={() => setIsAddDataOpen(true)}
                className="w-full bg-[#F7F7F7] text-gray-950 p-1 py-1.5 rounded-[2px] m-2 text-[12px] font-[500] px-4 cursor-pointer hover:bg-[#EBEBEB] transition-colors duration-200"
              >
                Add Data
              </button>
            </div>
          )}

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="layers" direction="vertical">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-0"
                >
                  {filteredLayers.length === 0 && searchQuery.trim() ? (
                    <div className="text-center py-8 px-4">
                      <p className="text-sm text-gray-500">
                        No layers found matching "{searchQuery}"
                      </p>
                    </div>
                  ) : (
                    filteredLayers
                      .slice()
                      .reverse()
                      .map((layer, index) => (
                        <div key={layer.id} className="flex flex-col">
                          <Draggable draggableId={layer.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`${snapshot.isDragging ? "opacity-50 shadow-lg" : ""} transition-all duration-200`}
                              >
                                <div className="p-2 flex flex-row justify-between items-center gap-5 hover:bg-[#F7F7F7] transition-colors duration-200 rounded-sm group">
                                  <div className="flex flex-row gap-3 items-center flex-1 min-w-0">
                                    <div
                                      {...provided.dragHandleProps}
                                      className="flex-shrink-0 cursor-grab active:cursor-grabbing"
                                    >
                                      <GripVertical
                                        strokeWidth={0.8}
                                        size={16}
                                      />
                                    </div>
                                    <Checkbox
                                      className="w-[15px] h-[15px] flex-shrink-0 rounded-[2.6px] border border-gray-200 hover:border-[#71330A] transition-colors duration-200"
                                      checked={layer.visibility}
                                      onCheckedChange={(checked) => {
                                        const updatedLayers = layers.map((l) =>
                                          l.id === layer.id
                                            ? {
                                                ...l,
                                                visibility: checked as boolean,
                                              }
                                            : l,
                                        );
                                        setLayers(updatedLayers);
                                      }}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <label className="text-[14.5px] font-[400] leading-5 tracking-[-0.084px] block truncate group-hover:text-gray-900 transition-colors duration-200">
                                        {layer.title}
                                      </label>
                                    </div>
                                  </div>

                                  <div className="relative flex flex-row gap-2 items-center">
                                    {layer.layers && layer.layers.length > 0 ? (
                                      <button
                                        onClick={() => toggleExpand(layer.id)}
                                        className="p-1 hover:bg-gray-100 rounded transition-colors duration-200 hover:text-[#71330A]"
                                      >
                                        {expandedLayers.has(layer.id) ? (
                                          <ChevronDown
                                            strokeWidth={1.25}
                                            className="h-4 w-4 transition-colors duration-200"
                                          />
                                        ) : (
                                          <ChevronRight
                                            strokeWidth={1.25}
                                            className="h-4 w-4 transition-colors duration-200"
                                          />
                                        )}
                                      </button>
                                    ) : (
                                      <div className="w-4 h-4" />
                                    )}
                                    {(currentAddingLayerId === layer.id ||
                                      removingLayerId === layer.id ||
                                      reorderingLayerIds.has(layer.id)) && (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    )}
                                    <button
                                      onClick={() =>
                                        handleEllipsisClick(layer.id)
                                      }
                                      className="p-1 hover:bg-gray-100 rounded transition-colors duration-200 hover:text-[#71330A] cursor-pointer"
                                    >
                                      <Ellipsis
                                        strokeWidth={0.8}
                                        size={16}
                                        className="transition-colors duration-200"
                                      />
                                    </button>

                                    {openPopoverId === layer.id && (
                                      <div
                                        ref={popoverRef}
                                        className="absolute right-0 top-full py-1 mt-1 z-50 flex w-80 min-w-max flex-col items-start rounded-lg border border-[#EBEBEB] bg-white shadow-[0_16px_32px_-12px_rgba(14,18,27,0.10)]"
                                      >
                                        {getLayerOperations(layer).map(
                                          (operation) => {
                                            const IconComponent =
                                              operation.icon;
                                            return (
                                              <button
                                                key={operation.id}
                                                onClick={(e) =>
                                                  !operation.disabled &&
                                                  handleLayerOperation(
                                                    operation.operation,
                                                    layer,
                                                    e,
                                                  )
                                                }
                                                disabled={operation.disabled}
                                                className={`w-full flex items-center gap-1.5 px-3 py-2 text-left rounded transition-colors duration-200 ${
                                                  operation.disabled
                                                    ? "opacity-50 cursor-not-allowed text-gray-400"
                                                    : "hover:bg-[#F7F7F7] text-[#171717] hover:text-[#71330A]"
                                                }`}
                                              >
                                                <IconComponent />
                                                <span className="text-[14px] font-[400]">
                                                  {operation.label}
                                                </span>
                                              </button>
                                            );
                                          },
                                        )}

                                        <div className="w-[calc(100%-16px)] h-px bg-gray-200 mx-2" />

                                        <button
                                          onClick={() =>
                                            handleLayerOperation(
                                              "remove",
                                              layer,
                                            )
                                          }
                                          className="w-full flex items-center gap-1.5 px-3 py-2 text-left hover:bg-red-50 rounded transition-colors duration-200 text-red-600 hover:text-red-700"
                                        >
                                          <RemoveLayerIcon />
                                          <span className="text-[14px] font-[400]">
                                            Remove Layer
                                          </span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>

                          {/* Child layers */}
                          {expandedLayers.has(layer.id) &&
                            layer.layers &&
                            layer.layers.length > 0 && (
                              <Droppable droppableId={layer.id} type="child">
                                {(provided) => (
                                  <div
                                    className="bg-gray-50"
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                  >
                                    {layer.layers
                                      ?.slice()
                                      .reverse()
                                      .map((childLayer, childIndex) => {
                                        // Find the current layer data from the updated layers state
                                        const currentParentLayer = layers.find(
                                          (l) => l.id === layer.id,
                                        );
                                        const currentChildLayer =
                                          currentParentLayer?.layers?.find(
                                            (cl) => cl.id === childLayer.id,
                                          );

                                        return (
                                          <GroupLayerChild
                                            key={childLayer.id}
                                            layer={
                                              currentChildLayer || childLayer
                                            }
                                            parentId={layer.id}
                                            index={childIndex}
                                            onChildCheckChange={
                                              handleChildCheckChange
                                            }
                                            handleRemoveChildLayer={
                                              handleRemoveChildLayer
                                            }
                                            handleSetFilter={(layer) =>
                                              console.log(
                                                "Set filter for child layer:",
                                                layer,
                                              )
                                            }
                                          />
                                        );
                                      })}
                                    {provided.placeholder}
                                  </div>
                                )}
                              </Droppable>
                            )}

                          {index < filteredLayers.length - 1 && (
                            <div className="h-px bg-gray-200" />
                          )}
                        </div>
                      ))
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </>
      )}

      {showTransparencySlider && currentTransparencyLayer && (
        <TransparencySlider
          value={currentTransparencyLayer.opacity}
          onChange={handleTransparencyChange}
          onClose={handleCloseTransparencySlider}
          layerName={currentTransparencyLayer.name}
          position={transparencySliderPosition}
        />
      )}
    </div>
  );
};

export default Layers;
