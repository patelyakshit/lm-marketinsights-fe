import React, { useState, useEffect } from "react";
import TabContent from "../../../components/MapTools/Layers/TabContent";
import { useMapStore } from "../../../store/useMapStore";
import { AppliedLayer } from "../../../schema";
import request from "@arcgis/core/request";
import { toastSuccess, toastError } from "../../../utils/toast";

type TabType = "Curated" | "ArcGIS" | "File" | "Web" | "favorite";

interface AddDataSidePanelProps {
  className?: string;
  onAddLayer?: (layer: any) => Promise<void>;
  onRemoveLayer?: (layerId: string) => void;
  isLayerAdded?: (layerId: string) => boolean;
  addingLayerId?: string | null;
  onClose?: () => void;
}

const AddDataSidePanel: React.FC<AddDataSidePanelProps> = ({
  className = "",
  onAddLayer,
  onRemoveLayer,
  isLayerAdded,
  addingLayerId,
}) => {
  const [selectedTab, setSelectedTab] = useState<TabType>("Curated");
  const [localAddingLayerId, setLocalAddingLayerId] = useState<string | null>(
    null,
  );
  const { layers, setLayers } = useMapStore();

  const tabs: { id: TabType; label: string }[] = [
    { id: "Curated", label: "Curated" },
    { id: "ArcGIS", label: "ArcGIS" },
    { id: "File", label: "File" },
    { id: "Web", label: "Web" },
    { id: "favorite", label: "Favourite" },
  ];

  const currentAddingLayerId =
    addingLayerId !== undefined ? addingLayerId : localAddingLayerId;

  const defaultIsLayerAdded = (layerId: string) =>
    layers.some((layer) => layer.id === layerId);

  const defaultOnAddLayer = async (layerToAdd: any): Promise<void> => {
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
        layerToAdd.type === "Group Layer" ||
        layerToAdd.layerType === "Group Layer" ||
        layerToAdd.type === "Web Map" ||
        layerTypeFromMetadata === "Web Map" ||
        (layerToAdd.typeKeywords &&
          (layerToAdd.typeKeywords.includes("Web Map") ||
            layerToAdd.typeKeywords.includes("Group Layer")));

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
            console.log(
              `Fetching portal item data for Group Layer: ${layerToAdd.title}`,
            );
            const portalItemResponse = await fetch(
              `https://www.arcgis.com/sharing/rest/content/items/${layerToAdd.id}/data?f=json&token=${import.meta.env.VITE_ARCGIS_API_KEY}`,
            );
            const portalItemData = await portalItemResponse.json();

            console.log(`Portal item data for ${layerToAdd.title}:`, {
              hasOperationalLayers: !!portalItemData.operationalLayers,
              operationalLayersCount:
                portalItemData.operationalLayers?.length || 0,
              hasLayers: !!portalItemData.layers,
              layersCount: portalItemData.layers?.length || 0,
            });

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
              console.log(
                `Created ${childLayers.length} child layers from operationalLayers`,
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
              console.log(
                `Created ${childLayers.length} child layers from layers array`,
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
        toastSuccess(`Added Group Layer with ${childLayers.length} sublayers`);
      } else {
        if (layers.some((l) => l.id === layerWithVisibility.id)) {
          toastError("Layer already added");
          return;
        }

        setLayers([...layers, layerWithVisibility]);
        toastSuccess("Layer added successfully");
      }
    } catch (error) {
      console.error("Error adding layer:", error);
      toastError("Failed to add layer. Please try again.");
    } finally {
      setLocalAddingLayerId(null);
    }
  };

  const defaultOnRemoveLayer = (layerId: string) => {
    const updatedLayers = layers.filter((l) => l.id !== layerId);
    setLayers(updatedLayers);
    toastSuccess("Layer removed successfully");
  };

  // Sync child layers from loaded GroupLayers on the map (similar to Layers.tsx)
  useEffect(() => {
    const { mapView } = useMapStore.getState();
    if (!mapView?.map) return;

    const updateChildLayers = () => {
      if (!mapView?.map) return;
      const map = mapView.map;

      const updatedLayers = layers.map((layer) => {
        // Process GroupLayers that don't have child layers yet or need syncing
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

              // Check if we need to sync:
              // 1. No child layers in state
              // 2. Different count
              // 3. IDs don't match (most important - ensures map toggling works)
              const currentIds = (layer.layers || []).map((l: any) => l.id);
              const mapIds = mapChildLayers.map(
                (l: any) =>
                  l.id || `${layer.id}_child_${mapChildLayers.indexOf(l)}`,
              );
              const idsMatch =
                currentIds.length === mapIds.length &&
                currentIds.every((id: string) => mapIds.includes(id));

              if (
                currentChildCount === 0 ||
                currentChildCount !== mapChildCount ||
                !idsMatch
              ) {
                console.log(
                  `Syncing child layers for ${layer.title}, found ${mapChildCount} children (store has ${currentChildCount}), IDs match: ${idsMatch}`,
                );
                if (!idsMatch && currentChildCount > 0) {
                  console.log("Current IDs:", currentIds);
                  console.log("Map IDs:", mapIds);
                }

                const childLayers = mapChildLayers.map(
                  (childLayer: any, index: number) => ({
                    // IMPORTANT: Use actual ArcGIS layer ID for proper toggle functionality
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
        setLayers(updatedLayers);
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
    const layerAddedHandle = allLayers.on("after-add", handleLayerAdded);

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
      if (layerAddedHandle) {
        layerAddedHandle.remove();
      }
      layerWatchers.forEach((watcher) => watcher.remove());
    };
  }, [layers, setLayers]);

  return (
    <div
      className={`flex flex-col h-full overflow-hidden ${className}`}
      style={{
        backgroundColor: "#ffffff",
      }}
    >
      {/* Segmented Tabs - Sticky header */}
      <div
        className="shrink-0 sticky top-0 z-10 p-1"
        style={{
          backgroundColor: "#f8f7f7",
          borderBottom: "1px solid #eceae9",
        }}
      >
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex-1 py-1.5 px-2 rounded transition-colors ${
                selectedTab === tab.id
                  ? "bg-white border border-[#eceae9]"
                  : "hover:bg-[#eceae9]"
              }`}
              style={{
                fontFamily: "Switzer, sans-serif",
                fontSize: "14px",
                lineHeight: "20px",
                color: selectedTab === tab.id ? "#1d1916" : "#7e7977",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <TabContent
          selectedTab={selectedTab}
          onAddLayer={onAddLayer || defaultOnAddLayer}
          onRemoveLayer={onRemoveLayer || defaultOnRemoveLayer}
          isLayerAdded={isLayerAdded || defaultIsLayerAdded}
          addingLayerId={currentAddingLayerId || null}
        />
      </div>
    </div>
  );
};

export default AddDataSidePanel;
