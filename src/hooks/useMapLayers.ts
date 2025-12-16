import { useState, useRef, useEffect } from "react";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import VectorTileLayer from "@arcgis/core/layers/VectorTileLayer";
import MapImageLayer from "@arcgis/core/layers/MapImageLayer";
import ImageryTileLayer from "@arcgis/core/layers/ImageryTileLayer";
import ImageLayer from "@arcgis/core/layers/ImageryLayer";
import GroupLayer from "@arcgis/core/layers/GroupLayer";
import Color from "@arcgis/core/Color";
import type { AppliedLayer } from "../schema";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";
import CIMSymbol from "@arcgis/core/symbols/CIMSymbol";
import UniqueValueRenderer from "@arcgis/core/renderers/UniqueValueRenderer";
import ClassBreaksRenderer from "@arcgis/core/renderers/ClassBreaksRenderer";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";
import PortalItem from "@arcgis/core/portal/PortalItem";
import Portal from "@arcgis/core/portal/Portal";
import request from "@arcgis/core/request";
import PopupTemplate from "@arcgis/core/PopupTemplate";
import Graphic from "@arcgis/core/Graphic";
import { reorderLayers } from "../lib/reorderLayers";
import { useMapStore } from "../store/useMapStore";

type AnyLayer =
  | __esri.FeatureLayer
  | __esri.MapImageLayer
  | __esri.ImageryLayer
  | __esri.VectorTileLayer
  | __esri.ImageryTileLayer
  | __esri.GroupLayer;

interface LayerData {
  layerDefinition?: {
    drawingInfo?: {
      renderer?: {
        type: string;
        symbol?: any;
        field?: string;
        uniqueValueInfos?: Array<{
          value: any;
          symbol: {
            color: number[];
            outline: {
              color: number[];
              width: number;
            };
          };
          label: string;
        }>;
        classBreakInfos?: Array<{
          minValue: number;
          maxValue: number;
          symbol: {
            color: number[];
            outline: {
              color: number[];
              width: number;
            };
          };
        }>;
      };
      labelingInfo?: any[];
    };
    minScale?: number;
    maxScale?: number;
    transparency?: number;
  };
  popupInfo?: {
    title: string;
    content: any[];
  };
  layers?: Array<{
    id: number;
    layerDefinition?: {
      defaultVisibility?: boolean;
      minScale?: number;
      maxScale?: number;
    };
    disablePopup?: boolean;
    popupInfo?: {
      title: string;
      popupElements: any[];
      fieldInfos: any[];
    };
  }>;
}

interface UseMapLayersProps {
  view: __esri.MapView | null;
}

interface LayerDefinition {
  minScale?: number;
  layers?: any[];
  drawingInfo?: {
    renderer?: any;
  };
}

export function useMapLayers({ view }: UseMapLayersProps) {
  const [isMapLoading, setIsMapLoading] = useState(false);
  const layerCache = useRef<Record<string, AnyLayer>>({});
  const previousLayersRef = useRef<AppliedLayer[]>([]);
  const processingQueue = useRef<Promise<void>>(Promise.resolve());
  const processingLayersRef = useRef<Set<string>>(new Set());
  const addedLayersRef = useRef<Set<string>>(new Set());
  const { layers } = useMapStore();

  const createWebLayer = async (
    layerItem: AppliedLayer,
    id: string,
    visible: boolean,
    minScale: number,
  ): Promise<AnyLayer> => {
    const layerType = layerItem.layerType || layerItem.type || "";
    let layer: AnyLayer;

    if (
      (layerType === "GroupLayer" || layerType === "Group Layer") &&
      layerItem.layers &&
      layerItem.layers.length > 0
    ) {
      const groupLayer = new GroupLayer({
        title: layerItem.title,
        id,
        visible,
        minScale,
      });

      for (const childLayerItem of layerItem.layers) {
        try {
          const childLayer = await createWebLayer(
            childLayerItem,
            childLayerItem.id,
            childLayerItem.visibility ?? true,
            childLayerItem.minScale || 0,
          );
          if (childLayer) {
            groupLayer.add(childLayer);
          } else {
            console.error(
              `Failed to create child layer: ${childLayerItem.title}`,
            );
          }
        } catch (error) {
          console.error(
            `Error creating child layer ${childLayerItem.title}:`,
            error,
          );
        }
      }

      if (layerItem.opacity !== undefined) {
        groupLayer.opacity = layerItem.opacity;
      }

      return groupLayer;
    }

    switch (layerType) {
      case "Feature Service":
      case "Feature Layer":
      case "ArcGISFeatureLayer":
        layer = new FeatureLayer({
          url: layerItem.url!,
          title: layerItem.title,
          id,
          visible,
          minScale,
          outFields: ["*"],
          popupEnabled: layerItem.popupEnabled ?? true,
          labelsVisible: layerItem.labelsVisible ?? true,
        });

        try {
          await layer.load();
          if (layerItem.filterConditions) {
            const activeFilters = layerItem.filterConditions
              .filter((f) => f.isActive)
              .map((f) => `${f.field} ${f.operator} '${f.value}'`)
              .join(" AND ");
            if (activeFilters) layer.definitionExpression = activeFilters;
          }
        } catch (error) {
          console.error(
            `Failed to load FeatureLayer: ${layerItem.title}`,
            error,
          );
          throw error;
        }

        try {
          const response = await request(`${layerItem.url}?f=json`, {
            method: "auto",
          });

          if (response.data) {
            const data = response.data;

            let popupTemplate: PopupTemplate | null = null;

            if (data.popupInfo) {
              const popupInfo = data.popupInfo;
              popupTemplate = new PopupTemplate({
                title: popupInfo.title || layerItem.title,
                content: popupInfo.content || [
                  {
                    type: "fields",
                    fieldInfos: popupInfo.fieldInfos || [],
                  },
                ],
                fieldInfos: popupInfo.fieldInfos || [],
              });
            } else if (data.fields && data.fields.length > 0) {
              const fieldInfos = data.fields.map((field: any) => ({
                fieldName: field.name,
                label: field.alias || field.name,
                visible: true,
                format: field.domain ? { places: 0 } : undefined,
              }));

              popupTemplate = new PopupTemplate({
                title: layerItem.title,
                content: [
                  {
                    type: "fields",
                    fieldInfos: fieldInfos,
                  },
                ],
                fieldInfos: fieldInfos,
              });
            } else if (layer.fields && layer.fields.length > 0) {
              const fieldInfos = layer.fields.map((field: any) => ({
                fieldName: field.name,
                label: field.alias || field.name,
                visible: true,
              }));

              popupTemplate = new PopupTemplate({
                title: layerItem.title,
                content: [
                  {
                    type: "fields",
                    fieldInfos: fieldInfos,
                  },
                ],
                fieldInfos: fieldInfos,
              });
            }

            if (popupTemplate) {
              layer.popupTemplate = popupTemplate;
            }
          }
        } catch (error) {
          console.warn(
            "Could not retrieve popup template for web layer:",
            error,
          );
          if (layer.fields && layer.fields.length > 0) {
            const fieldInfos = layer.fields.map((field: any) => ({
              fieldName: field.name,
              label: field.alias || field.name,
              visible: true,
            }));

            const popupTemplate = new PopupTemplate({
              title: layerItem.title,
              content: [
                {
                  type: "fields",
                  fieldInfos: fieldInfos,
                },
              ],
              fieldInfos: fieldInfos,
            });
            layer.popupTemplate = popupTemplate;
          }
        }

        layer.popupEnabled = true;
        break;

      case "Map Service":
      case "Map Image Layer":
        if (layerItem.layers && layerItem.layers.length > 0) {
          const sublayers = layerItem.layers.map((childLayer: any) => ({
            id: childLayer.sublayerId,
            visible: childLayer.visibility ?? true,
            opacity: childLayer.opacity ?? 1,
            definitionExpression:
              childLayer.filterConditions
                ?.filter((f: any) => f.isActive)
                .map((f: any) => `${f.field} ${f.operator} '${f.value}'`)
                .join(" AND ") || "1=1",
          }));

          layer = new MapImageLayer({
            url: layerItem.url!,
            title: layerItem.title,
            visible,
            minScale,
            id,
            sublayers,
          });

          await layer.load();

          try {
            const response = await request(`${layerItem.url}?f=json`, {
              method: "auto",
            });

            if (response.data?.layers && response.data.layers.length > 0) {
              const layers = response.data.layers;
              layers.forEach((subLayer: any) => {
                if (subLayer.popupInfo) {
                  const popupInfo = subLayer.popupInfo;
                  const popupTemplate = new PopupTemplate({
                    title: subLayer.name || layerItem.title,
                    content: popupInfo.content || [
                      {
                        type: "fields",
                        fieldInfos: popupInfo.fieldInfos || [],
                      },
                    ],
                    fieldInfos: popupInfo.fieldInfos || [],
                  });

                  if (layer instanceof MapImageLayer) {
                    const mapImageLayer = layer as MapImageLayer;
                    const sublayer = mapImageLayer.sublayers?.find(
                      (sl: any) => sl.id === subLayer.id,
                    );
                    if (sublayer) {
                      sublayer.popupEnabled = true;
                      sublayer.popupTemplate = popupTemplate;
                    }
                  }
                }
              });
            }
          } catch (error) {
            console.warn(
              "Could not retrieve popup template for MapImageLayer:",
              error,
            );
          }
        } else {
          layer = new MapImageLayer({
            url: layerItem.url!,
            title: layerItem.title,
            visible,
            minScale,
            id,
          });

          await layer.load();
          try {
            const response = await request(`${layerItem.url}?f=json`, {
              method: "auto",
            });

            if (response.data?.layers && response.data.layers.length > 0) {
              const layers = response.data.layers;
              layers.forEach((subLayer: any) => {
                if (subLayer.popupInfo) {
                  const popupInfo = subLayer.popupInfo;
                  const popupTemplate = new PopupTemplate({
                    title: subLayer.name || layerItem.title,
                    content: popupInfo.content || [
                      {
                        type: "fields",
                        fieldInfos: popupInfo.fieldInfos || [],
                      },
                    ],
                    fieldInfos: popupInfo.fieldInfos || [],
                  });

                  if (layer instanceof MapImageLayer) {
                    const mapImageLayer = layer as MapImageLayer;
                    const sublayer = mapImageLayer.sublayers?.find(
                      (sl: any) => sl.id === subLayer.id,
                    );
                    if (sublayer) {
                      sublayer.popupEnabled = true;
                      sublayer.popupTemplate = popupTemplate;
                    }
                  }
                }
              });
            }
          } catch (error) {
            console.warn(
              "Could not retrieve popup template for MapImageLayer:",
              error,
            );
          }
        }

        break;

      case "Vector Tile Service":
      case "Vector Tile Layer":
        layer = new VectorTileLayer({
          url: layerItem.url!,
          title: layerItem.title,
          visible,
          minScale,
          id,
        });
        break;

      case "Image Service":
      case "Imagery Layer":
        layer = new ImageLayer({
          url: layerItem.url!,
          title: layerItem.title,
          id,
          visible,
          minScale,
        });

        await layer.load();

        if (
          !Object.prototype.hasOwnProperty.call(
            layer,
            "_clickHandlerRegistered",
          )
        ) {
          const clickHandler = async (event: __esri.ViewClickEvent) => {
            if (!layer.visible) {
              return;
            }

            try {
              const response = await request(`${layerItem.url}/identify`, {
                query: {
                  f: "json",
                  geometry: JSON.stringify({
                    x: event.mapPoint.x,
                    y: event.mapPoint.y,
                    spatialReference: event.mapPoint.spatialReference,
                  }),
                  geometryType: "esriGeometryPoint",
                  returnGeometry: false,
                  pixelSize: "1,1",
                  returnCatalogItems: false,
                  returnPixelValues: true,
                },
                method: "auto",
              });

              if (response.data && response.data.value !== undefined) {
                const pixelValue = response.data.value;
                const popupContent = `
                  <div style="padding: 10px;">
                    <h3>${layerItem.title}</h3>
                    <p><strong>Pixel Value:</strong> ${pixelValue}</p>
                    <p><strong>Coordinates:</strong> ${event.mapPoint.x.toFixed(4)}, ${event.mapPoint.y.toFixed(4)}</p>
                    <p><strong>Service Type:</strong> Image Service</p>
                  </div>
                `;

                const popup = new PopupTemplate({
                  title: layerItem.title,
                  content: popupContent,
                });

                const graphic = new Graphic({
                  geometry: event.mapPoint,
                  popupTemplate: popup,
                });

                view?.graphics.add(graphic);
                if (view?.popup) {
                  view.popup.open({
                    features: [graphic],
                    location: event.mapPoint,
                  });

                  view.popup.watch("visible", (visible) => {
                    if (!visible) {
                      view?.graphics.remove(graphic);
                    }
                  });
                }
              }
            } catch (error) {
              console.warn(
                "Could not get pixel information for Image Service:",
                error,
              );
              const popupContent = `
                <div style="padding: 10px;">
                  <h3>${layerItem.title}</h3>
                  <p><strong>Service Type:</strong> Image Service</p>
                  <p><strong>Coordinates:</strong> ${event.mapPoint.x.toFixed(4)}, ${event.mapPoint.y.toFixed(4)}</p>
                  <p><em>Pixel information not available at this location</em></p>
                </div>
              `;

              const popup = new PopupTemplate({
                title: layerItem.title,
                content: popupContent,
              });

              const graphic = new Graphic({
                geometry: event.mapPoint,
                popupTemplate: popup,
              });

              view?.graphics.add(graphic);
              if (view?.popup) {
                view.popup.open({
                  features: [graphic],
                  location: event.mapPoint,
                });

                view.popup.watch("visible", (visible) => {
                  if (!visible) {
                    view?.graphics.remove(graphic);
                  }
                });
              }
            }
          };

          const handle = view?.on("click", clickHandler);

          // Store the handler reference for cleanup
          // @ts-expect-error - Custom property to track handler registration
          layer._clickHandlerRegistered = true;
          // @ts-expect-error - Store handler reference
          layer._clickHandler = handle;
        }
        break;

      case "Imagery Tile Layer":
      case "Tiled Imagery":
        layer = new ImageryTileLayer({
          url: layerItem.url!,
          title: layerItem.title,
          visible,
          minScale,
          id,
        });
        break;

      default:
        layer = new FeatureLayer({
          url: layerItem.url!,
          title: layerItem.title,
          id,
          visible,
          minScale,
          outFields: ["*"],
          popupEnabled: layerItem.popupEnabled ?? true,
          labelsVisible: layerItem.labelsVisible ?? true,
        });

        await layer.load();
        if (layer.fields && layer.fields.length > 0) {
          const fieldInfos = layer.fields.map((field: any) => ({
            fieldName: field.name,
            label: field.alias || field.name,
            visible: true,
          }));

          const popupTemplate = new PopupTemplate({
            title: layerItem.title,
            content: [
              {
                type: "fields",
                fieldInfos: fieldInfos,
              },
            ],
            fieldInfos: fieldInfos,
          });
          layer.popupTemplate = popupTemplate;
        }
        break;
    }

    if (layerItem.opacity !== undefined) {
      layer.opacity = layerItem.opacity;
    }

    return layer;
  };

  const createLayerFromPortalItem = async (
    itemId: string,
    layerType: string,
  ): Promise<AnyLayer | null> => {
    try {
      // Validate itemId format - should be alphanumeric and proper length (32 chars for ArcGIS items)
      if (!itemId || typeof itemId !== "string" || itemId.length < 32) {
        console.warn(`Invalid portal item ID format: ${itemId}`);
        return null;
      }

      console.log(
        `Creating layer from portal item: ${itemId}, type: ${layerType}`,
      );

      const portal = new Portal();

      const portalItem = new PortalItem({
        id: itemId,
        portal: portal,
      });

      await portalItem.load();

      let layerData: LayerData | null = null;

      try {
        const response = await request(
          `https://www.arcgis.com/sharing/rest/content/items/${itemId}/data?f=json&token=${import.meta.env.VITE_ARCGIS_API_KEY}`,
          {
            method: "auto",
          },
        );
        layerData = response.data as LayerData;
      } catch (error) {
        console.warn(`Could not fetch layer data for item ${itemId}:`, error);
      }

      if (!layerData) {
        console.warn("No layer data found for item:", itemId);
      }

      let layer: AnyLayer;

      switch (layerType) {
        case "Feature Layer":
        case "Feature Service":
        case "ArcGISFeatureLayer":
          layer = new FeatureLayer({
            portalItem: portalItem,
            outFields: ["*"],
            popupEnabled: true,
            labelsVisible: true,
          });
          break;

        case "Map Image Layer":
        case "Map Service":
          layer = new MapImageLayer({
            portalItem: portalItem,
          });
          break;

        case "Vector Tile Layer":
        case "Vector Tile Service":
          layer = new VectorTileLayer({
            portalItem: portalItem,
          });
          break;

        case "Imagery Layer":
        case "Image Service":
        case "ArcGISImageServiceLayer":
          layer = new ImageLayer({
            portalItem: portalItem,
          });
          break;

        case "Imagery Tile Layer":
        case "Tiled Imagery":
          layer = new ImageryTileLayer({
            portalItem: portalItem,
          });
          break;

        case "Group Layer":
        case "GroupLayer":
          layer = new GroupLayer({
            portalItem: portalItem,
          });
          await layer.load();
          console.log(`GroupLayer loaded from portal item: ${itemId}`, {
            loaded: layer.loaded,
            sublayerCount: (layer as __esri.GroupLayer).layers?.length || 0,
          });
          break;

        default:
          console.error("Unsupported layer type:", layerType);
          return null;
      }

      if (layerData?.layerDefinition) {
        const { drawingInfo, minScale, maxScale, transparency } =
          layerData.layerDefinition;

        if (drawingInfo?.renderer && layer instanceof FeatureLayer) {
          if (drawingInfo.renderer.type === "simple") {
            layer.renderer = new SimpleRenderer({
              symbol: new CIMSymbol({
                data: drawingInfo.renderer.symbol,
              }),
            });
          } else if (drawingInfo.renderer.type === "uniqueValue") {
            const uniqueValueInfos =
              drawingInfo.renderer.uniqueValueInfos?.map((info) => ({
                value: info.value,
                symbol: new SimpleFillSymbol({
                  color: new Color(info.symbol.color),
                  outline: new SimpleLineSymbol({
                    color: new Color(info.symbol.outline.color),
                    width: info.symbol.outline.width,
                  }),
                }),
                label: info.label,
              })) || [];

            layer.renderer = new UniqueValueRenderer({
              field: drawingInfo.renderer.field || "",
              uniqueValueInfos,
            });
          } else if (drawingInfo.renderer.type === "classBreaks") {
            const classBreakInfos =
              drawingInfo.renderer.classBreakInfos?.map((info) => ({
                minValue: info.minValue,
                maxValue: info.maxValue,
                symbol: new SimpleFillSymbol({
                  color: new Color(info.symbol.color),
                  outline: new SimpleLineSymbol({
                    color: new Color(info.symbol.outline.color),
                    width: info.symbol.outline.width,
                  }),
                }),
              })) || [];

            layer.renderer = new ClassBreaksRenderer({
              field: drawingInfo.renderer.field || "",
              classBreakInfos,
            });
          }
        }

        if (minScale) layer.minScale = minScale;
        if (maxScale) layer.maxScale = maxScale;

        if (transparency !== undefined) {
          layer.opacity = 1 - transparency / 100;
        }
      }

      if (
        layerData?.layerDefinition?.drawingInfo?.labelingInfo &&
        layer instanceof FeatureLayer
      ) {
        layer.labelingInfo = layerData.layerDefinition.drawingInfo.labelingInfo;
      }

      if (layerData?.popupInfo && layer instanceof FeatureLayer) {
        const popupTemplate = new PopupTemplate({
          title: layerData.popupInfo.title,
          content: layerData.popupInfo.content,
          fieldInfos: layerData.popupInfo.content[0]?.fieldInfos || [],
        });
        layer.popupTemplate = popupTemplate;
      }

      // Explicitly load the layer to ensure it's ready (skip if already loaded for GroupLayer)
      if (!layer.loaded) {
        try {
          await layer.load();
          console.log(`Layer loaded successfully from portal item: ${itemId}`, {
            loaded: layer.loaded,
            layerType: layer.type,
            sublayerCount:
              layer.type === "group"
                ? (layer as __esri.GroupLayer).layers?.length || 0
                : undefined,
          });
        } catch (loadError) {
          console.error(
            `Error loading layer from portal item ${itemId}:`,
            loadError,
          );
          throw loadError;
        }
      } else {
        console.log(`Layer already loaded from portal item: ${itemId}`, {
          loaded: layer.loaded,
          layerType: layer.type,
          sublayerCount:
            layer.type === "group"
              ? (layer as __esri.GroupLayer).layers?.length || 0
              : undefined,
        });
      }

      console.log(`Successfully created layer from portal item: ${itemId}`);
      return layer;
    } catch (error) {
      console.error(`Error creating layer from portal item ${itemId}:`, error);
      return null;
    }
  };

  const createLayerByType = async (
    layerItem: AppliedLayer & { layerDefinition?: LayerDefinition },
  ): Promise<AnyLayer> => {
    const id =
      layerItem.id ||
      `${layerItem.layerType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const visible = layerItem.visibility ?? true;
    const minScale =
      layerItem.minScale ||
      (layerItem.layerDefinition && layerItem.layerDefinition.minScale) ||
      0;

    if (layerItem.url && layerItem.id?.startsWith("web-layer-")) {
      return await createWebLayer(layerItem, id, visible, minScale);
    }

    if (
      layerItem.itemId &&
      layerItem.itemId.length >= 32 &&
      !layerItem.itemId.includes("-layer-")
    ) {
      const layer = await createLayerFromPortalItem(
        layerItem.itemId,
        layerItem.layerType || layerItem.type || "",
      );
      if (layer) {
        layer.id = id;
        layer.title = layerItem.title;
        layer.visible = visible;
        layer.minScale = minScale;
        if (layerItem.opacity !== undefined) {
          layer.opacity = layerItem.opacity;
        }
        return layer;
      }
    }

    if (layerItem.url) {
      console.log(`Creating layer from URL: ${layerItem.title}`);
    }

    const layerType =
      layerItem.layerType === "Image Service" &&
      layerItem?.typeKeywords?.includes("Tiled Imagery")
        ? "Tiled Imagery"
        : layerItem.layerType || layerItem.type;

    let layer: AnyLayer;

    switch (layerType) {
      case "Feature Layer":
      case "Feature Service":
      case "ArcGISFeatureLayer":
        if (layerItem.graphics && Array.isArray(layerItem.graphics)) {
          layer = new FeatureLayer({
            source: layerItem.graphics,
            title: layerItem.title,
            id,
            visible,
            minScale,
            objectIdField: "ObjectID",
            spatialReference: { wkid: 3857 },
            renderer: layerItem.renderer,
          });
        } else {
          layer = new FeatureLayer({
            url: layerItem.url,
            title: layerItem.title,
            id,
            visible,
            minScale,
            outFields: ["*"],
            popupEnabled: true,
          });
        }
        if (layerItem.opacity !== undefined) {
          layer.opacity = layerItem.opacity;
        }
        break;

      case "Map Image Layer":
      case "Map Service":
        if (layerItem.layers && layerItem.layers.length > 0) {
          return await createWebLayer(layerItem, id, visible, minScale);
        } else {
          layer = new MapImageLayer({
            url: layerItem.url,
            title: layerItem.title,
            visible,
            minScale,
            id,
          });
          if (layerItem.opacity !== undefined) {
            layer.opacity = layerItem.opacity;
          }
        }
        break;

      case "Vector Tile Layer":
      case "Vector Tile Service":
        layer = new VectorTileLayer({
          url: layerItem.url,
          title: layerItem.title,
          visible,
          minScale,
          id,
        });
        if (layerItem.opacity !== undefined) {
          layer.opacity = layerItem.opacity;
        }
        break;

      case "Imagery Layer":
      case "Image Service":
      case "ArcGISImageServiceLayer":
        layer = new ImageLayer({
          url: layerItem.url,
          title: layerItem.title,
          id,
          visible,
          minScale,
        });
        if (layerItem.opacity !== undefined) {
          layer.opacity = layerItem.opacity;
        }
        break;

      case "Imagery Tile Layer":
      case "Tiled Imagery":
        layer = new ImageryTileLayer({
          url: layerItem.url,
          title: layerItem.title,
          visible,
          minScale,
          id,
        });
        if (layerItem.opacity !== undefined) {
          layer.opacity = layerItem.opacity;
        }
        break;

      case "Group Layer":
      case "GroupLayer":
        layer = new GroupLayer({
          title: layerItem.title,
          id,
          visible,
          minScale,
        });
        if (layerItem.opacity !== undefined) {
          layer.opacity = layerItem.opacity;
        }
        break;

      default:
        console.warn(
          `Unsupported layer type: ${layerType}, skipping layer: ${layerItem.title}`,
        );
        // Return a placeholder FeatureLayer to prevent errors
        layer = new FeatureLayer({
          url: layerItem.url || undefined,
          title: layerItem.title || "Unknown Layer",
          id,
          visible: false,
          minScale,
        });
    }

    return layer;
  };

  const findLayerDifferences = (
    oldLayers: AppliedLayer[],
    newLayers: AppliedLayer[],
  ): {
    added: AppliedLayer[];
    removed: AppliedLayer[];
    unchanged: AppliedLayer[];
    updated: AppliedLayer[];
  } => {
    const getLayerKey = (layer: AppliedLayer) =>
      layer.id || layer.url || JSON.stringify(layer);

    const oldLayerMap = new Map(
      oldLayers.map((layer) => [getLayerKey(layer), layer]),
    );
    const newLayerMap = new Map(
      newLayers.map((layer) => [getLayerKey(layer), layer]),
    );

    const added: AppliedLayer[] = [];
    const removed: AppliedLayer[] = [];
    const unchanged: AppliedLayer[] = [];
    const updated: AppliedLayer[] = [];

    for (const [key, layer] of oldLayerMap.entries()) {
      if (!newLayerMap.has(key)) {
        removed.push(layer);
      }
    }

    for (const [key, layer] of newLayerMap.entries()) {
      if (!oldLayerMap.has(key)) {
        added.push(layer);
      } else {
        const oldLayer = oldLayerMap.get(key)!;
        const hasBasicChanges =
          oldLayer.visibility !== layer.visibility ||
          oldLayer.minScale !== layer.minScale ||
          oldLayer.opacity !== layer.opacity ||
          JSON.stringify(oldLayer.extent) !== JSON.stringify(layer.extent);

        const hasSublayerChanges =
          layer.layers && oldLayer.layers
            ? JSON.stringify(
                layer.layers.map((l: any) => ({
                  id: l.id,
                  visibility: l.visibility,
                  opacity: l.opacity,
                })),
              ) !==
              JSON.stringify(
                oldLayer.layers.map((l: any) => ({
                  id: l.id,
                  visibility: l.visibility,
                  opacity: l.opacity,
                })),
              )
            : layer.layers !== oldLayer.layers;

        if (hasBasicChanges || hasSublayerChanges) {
          updated.push(layer);
        } else {
          unchanged.push(layer);
        }
      }
    }

    return { added, removed, unchanged, updated };
  };

  const processLayerChanges = async () => {
    if (!view || !view.map) {
      console.warn("View or map is not initialized");
      setIsMapLoading(false);
      return;
    }

    try {
      const oldLayers = previousLayersRef.current;
      const newLayers = layers;

      // Skip if no changes
      if (oldLayers.length === newLayers.length) {
        const hasChanges = newLayers.some((newLayer, index) => {
          const oldLayer = oldLayers[index];
          if (
            !oldLayer ||
            oldLayer.id !== newLayer.id ||
            oldLayer.visibility !== newLayer.visibility ||
            oldLayer.opacity !== newLayer.opacity
          ) {
            return true;
          }

          // Check for sublayer changes (for GroupLayer and MapImageLayer)
          if (newLayer?.layers && oldLayer?.layers) {
            const hasSublayerChanges =
              newLayer.layers.length !== oldLayer.layers.length ||
              newLayer.layers.some((newSubLayer: any) => {
                const oldSubLayer = oldLayer.layers?.find(
                  (sl: any) => sl.id === newSubLayer.id,
                );
                if (!oldSubLayer) {
                  return true;
                }
                return (
                  oldSubLayer.visibility !== newSubLayer.visibility ||
                  oldSubLayer.opacity !== newSubLayer.opacity
                );
              }) ||
              oldLayer.layers.some((oldSubLayer: any) => {
                return !newLayer.layers?.find(
                  (sl: any) => sl.id === oldSubLayer.id,
                );
              });
            if (hasSublayerChanges) {
              return true;
            }
          } else if (newLayer.layers !== oldLayer.layers) {
            return true;
          }

          return false;
        });

        if (!hasChanges) {
          console.log("No layer changes detected, skipping processing");
          setIsMapLoading(false);
          return;
        }
      }

      setIsMapLoading(true);

      // Helper function to safely add layer to map
      const safelyAddLayerToMap = (
        layer: AnyLayer,
        layerItem: AppliedLayer,
      ): boolean => {
        if (!view?.map) {
          console.error("Map is not initialized, cannot add layer");
          return false;
        }

        try {
          const existingLayer = view.map.findLayerById(layer.id);
          if (existingLayer) {
            console.log(
              `Layer ${layerItem.title} (${layer.id}) already exists on map, skipping add`,
            );
            // Update existing layer properties instead
            existingLayer.visible = layerItem.visibility ?? true;
            if (layerItem.opacity !== undefined) {
              existingLayer.opacity = layerItem.opacity;
            }
            return false;
          }

          if (layerItem.url && (layer as any).url) {
            const existingByUrl = view.map.allLayers.find(
              (l: any) => l.url === layerItem.url && l.id !== layer.id,
            );
            if (existingByUrl) {
              console.log(
                `Layer with URL ${layerItem.url} already exists on map with different ID (${existingByUrl.id} vs ${layer.id}), removing old and adding new`,
              );
              try {
                view.map.remove(existingByUrl);
                // Clear from tracking if it was tracked
                addedLayersRef.current.delete(existingByUrl.id);
                console.log(`Removed old layer with ID ${existingByUrl.id}`);
              } catch (removeError) {
                console.warn(
                  `Error removing old layer ${existingByUrl.id}:`,
                  removeError,
                );
              }
            }
          }

          view.map.add(layer);
          return true;
        } catch (error) {
          console.error(`Error adding layer ${layerItem.title} to map:`, error);
          return false;
        }
      };

      if (oldLayers.length === 0) {
        // If there are no layers to add, set loading to false and return early
        if (newLayers.length === 0) {
          console.log("No layers to add, map is ready");
          setIsMapLoading(false);
          previousLayersRef.current = [];
          return;
        }

        for (const layerItem of newLayers) {
          try {
            // Check if layer is already added or being processed to prevent duplicates
            if (addedLayersRef.current.has(layerItem.id)) {
              console.log(
                `Initial layer already added (skipping): ${layerItem.title}`,
              );
              continue;
            }

            // Check if layer already exists on map
            const existingLayer = view.map.findLayerById(layerItem.id);
            if (existingLayer) {
              console.log(
                `Initial layer ${layerItem.title} already exists on map, updating properties`,
              );
              existingLayer.visible = layerItem.visibility ?? true;
              if (layerItem.opacity !== undefined) {
                existingLayer.opacity = layerItem.opacity;
              }

              // Update sublayers for GroupLayer
              if (
                existingLayer instanceof GroupLayer &&
                layerItem.layers &&
                Array.isArray(layerItem.layers)
              ) {
                const parentVisible = layerItem.visibility ?? false;
                layerItem.layers.forEach((childLayer: any) => {
                  const childEsriLayer = existingLayer.layers.find(
                    (l: any) => l.id === childLayer.id,
                  );
                  if (childEsriLayer) {
                    childEsriLayer.visible =
                      parentVisible && (childLayer.visibility ?? false);
                    if (childLayer.opacity !== undefined) {
                      childEsriLayer.opacity = childLayer.opacity;
                    }
                    console.log(
                      `Updated sublayer ${childLayer.title} visibility: ${childEsriLayer.visible} (parent: ${parentVisible}, sublayer: ${childLayer.visibility})`,
                    );
                  }
                });
              }

              // Update sublayers for MapImageLayer
              if (
                existingLayer instanceof MapImageLayer &&
                layerItem.layers &&
                Array.isArray(layerItem.layers)
              ) {
                const mapImageLayer = existingLayer as MapImageLayer;
                layerItem.layers.forEach((childLayer: any) => {
                  if (childLayer.sublayerId !== undefined) {
                    const sublayer = mapImageLayer.findSublayerById(
                      childLayer.sublayerId,
                    );
                    if (sublayer) {
                      sublayer.visible = childLayer.visibility ?? false;
                      if (childLayer.opacity !== undefined) {
                        sublayer.opacity = childLayer.opacity;
                      }
                    }
                  }
                });
              }

              addedLayersRef.current.add(layerItem.id);
              continue;
            }

            if (processingLayersRef.current.has(layerItem.id)) {
              console.log(
                `Initial layer already being processed (skipping): ${layerItem.title}`,
              );
              continue;
            }

            processingLayersRef.current.add(layerItem.id);

            const layer = await createLayerByType(layerItem);
            if (layer) {
              if (!layer.title || layer.title !== layerItem.title) {
                layer.title = layerItem.title;
              }

              const wasAdded = safelyAddLayerToMap(layer, layerItem);
              if (!wasAdded) {
                const existingLayer = view.map.findLayerById(layer.id);
                if (existingLayer) {
                  existingLayer.visible = layerItem.visibility ?? true;
                  if (layerItem.opacity !== undefined) {
                    existingLayer.opacity = layerItem.opacity;
                  }
                  if (existingLayer.title !== layerItem.title) {
                    existingLayer.title = layerItem.title;
                  }
                  console.log(
                    `Updated existing initial layer ${layerItem.title} properties (visible: ${existingLayer.visible})`,
                  );
                }
              } else {
                layer.visible = layerItem.visibility ?? true;
                if (layerItem.opacity !== undefined) {
                  layer.opacity = layerItem.opacity;
                }
              }

              addedLayersRef.current.add(layerItem.id);
              processingLayersRef.current.delete(layerItem.id);

              console.log(
                `Initial layer processed: ${layerItem.title} (visible: ${layer.visible}, added: ${wasAdded})`,
              );
            } else {
              console.warn(
                `Skipping layer ${layerItem.title} - could not create`,
              );
              processingLayersRef.current.delete(layerItem.id);
            }
          } catch (error) {
            // Silently skip errors for invalid portal items or unsupported layer types
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            if (
              errorMessage.includes("Unsupported layer type") ||
              errorMessage.includes("does not exist") ||
              errorMessage.includes("inaccessible")
            ) {
              console.warn(`Skipping layer ${layerItem.title}:`, errorMessage);
            } else {
              console.error(`Error adding layer ${layerItem.title}:`, error);
            }
            processingLayersRef.current.delete(layerItem.id);
          }
        }
      } else {
        const { added, removed, updated } = findLayerDifferences(
          oldLayers,
          newLayers,
        );

        for (const layerToRemove of removed) {
          const layerId = layerToRemove.id;
          let esriLayer: AnyLayer | undefined;

          if (layerId) {
            esriLayer = view.map.findLayerById(layerId) as AnyLayer;
          }
          if (!esriLayer && layerToRemove.url) {
            esriLayer = view.map.allLayers.find(
              (l) => (l as any).url === layerToRemove.url,
            ) as AnyLayer;
          }

          if (esriLayer) {
            if (
              Object.prototype.hasOwnProperty.call(esriLayer, "_clickHandler")
            ) {
              // @ts-expect-error - Remove click handler
              esriLayer._clickHandler?.remove();
              // @ts-expect-error - Clear handler reference
              esriLayer._clickHandler = null;
              // @ts-expect-error - Clear registration flag
              esriLayer._clickHandlerRegistered = false;
            }
            view.map.remove(esriLayer);

            // Clear the layer from tracking refs so it can be re-added
            addedLayersRef.current.delete(layerId);
            processingLayersRef.current.delete(layerId);
            console.log(
              `Removed layer and cleared tracking: ${layerToRemove.title}`,
            );
          }
        }
        for (const layerToUpdate of updated) {
          const layerId = layerToUpdate.id;
          let esriLayer: AnyLayer | undefined;

          if (layerId) {
            esriLayer = view.map.findLayerById(layerId) as AnyLayer;
          }
          if (!esriLayer && layerToUpdate.url) {
            esriLayer = view.map.allLayers.find(
              (l) => (l as any).url === layerToUpdate.url,
            ) as AnyLayer;
          }
          if (esriLayer) {
            esriLayer.visible = layerToUpdate.visibility ?? false;

            if (layerToUpdate.opacity !== undefined) {
              esriLayer.opacity = layerToUpdate.opacity;
            }

            if (
              esriLayer instanceof GroupLayer &&
              Array.isArray((esriLayer as any).layers) &&
              Array.isArray(layerToUpdate.layers)
            ) {
              const parentVisible = layerToUpdate.visibility ?? false;
              layerToUpdate.layers.forEach((childLayer: any) => {
                const childEsriLayer = (esriLayer as any).layers.find(
                  (l: any) => l.id === childLayer.id,
                );
                if (childEsriLayer) {
                  childEsriLayer.visible =
                    parentVisible && (childLayer.visibility ?? false);
                  if (childLayer.opacity !== undefined) {
                    childEsriLayer.opacity = childLayer.opacity;
                  }
                  if ((childEsriLayer as any).refresh) {
                    (childEsriLayer as any).refresh();
                  }
                }
              });
            }

            if (esriLayer instanceof MapImageLayer && layerToUpdate.layers) {
              const mapImageLayer = esriLayer as MapImageLayer;
              layerToUpdate.layers.forEach((childLayer: any) => {
                if (childLayer.sublayerId !== undefined) {
                  const sublayer = mapImageLayer.findSublayerById(
                    childLayer.sublayerId,
                  );
                  if (sublayer) {
                    sublayer.visible = childLayer.visibility ?? false;
                    if (childLayer.opacity !== undefined) {
                      sublayer.opacity = childLayer.opacity;
                    }
                    if ((sublayer as any).refresh) {
                      (sublayer as any).refresh();
                    }
                  }
                }
              });
              if ((mapImageLayer as any).refresh) {
                (mapImageLayer as any).refresh();
              }
            }

            if ((esriLayer as any).refresh) {
              (esriLayer as any).refresh();
            }
          }
        }

        for (const layerItem of added) {
          try {
            if (addedLayersRef.current.has(layerItem.id)) {
              console.log(`Layer already added (skipping): ${layerItem.title}`);
              continue;
            }

            // Check if layer already exists on map
            const existingLayer = view.map.findLayerById(layerItem.id);
            if (existingLayer) {
              console.log(
                `Layer ${layerItem.title} already exists on map, updating properties`,
              );
              existingLayer.visible = layerItem.visibility ?? true;
              if (layerItem.opacity !== undefined) {
                existingLayer.opacity = layerItem.opacity;
              }
              if (existingLayer.title !== layerItem.title) {
                existingLayer.title = layerItem.title;
              }
              addedLayersRef.current.add(layerItem.id);
              continue;
            }

            if (processingLayersRef.current.has(layerItem.id)) {
              console.log(
                `Layer already being processed (skipping): ${layerItem.title}`,
              );
              continue;
            }

            processingLayersRef.current.add(layerItem.id);

            console.log(`Adding layer: ${layerItem.title}`, {
              id: layerItem.id,
              type: layerItem.type,
              layerType: layerItem.layerType,
              url: layerItem.url,
              itemId: layerItem.itemId,
            });

            const layer = await createLayerByType(layerItem);
            if (!layer) {
              console.warn(`Could not create layer: ${layerItem.title}`);
              processingLayersRef.current.delete(layerItem.id);
              continue;
            }

            if (!layer.title || layer.title !== layerItem.title) {
              layer.title = layerItem.title;
            }

            if (view.map) {
              const wasAdded = safelyAddLayerToMap(layer, layerItem);
              if (!wasAdded) {
                const existingLayer = view.map.findLayerById(layer.id);
                if (existingLayer) {
                  existingLayer.visible = layerItem.visibility ?? true;
                  if (layerItem.opacity !== undefined) {
                    existingLayer.opacity = layerItem.opacity;
                  }
                  if (existingLayer.title !== layerItem.title) {
                    existingLayer.title = layerItem.title;
                  }
                  console.log(
                    `Updated existing layer ${layerItem.title} properties (visible: ${existingLayer.visible})`,
                  );
                }
                addedLayersRef.current.add(layerItem.id);
                processingLayersRef.current.delete(layerItem.id);
                continue;
              }
            }

            layer.visible = layerItem.visibility ?? true;
            if (layerItem.opacity !== undefined) {
              layer.opacity = layerItem.opacity;
            }

            console.log(
              `Successfully added layer to map: ${layerItem.title} (visible: ${layer.visible}, type: ${layer.type})`,
            );

            layer
              .when(() => {
                const layerExtent = layer.fullExtent || layerItem.extent;
                if (layerExtent && view) {
                  console.log(`Zooming to layer extent: ${layerItem.title}`);
                  view
                    .goTo(layerExtent, {
                      duration: 1000,
                      easing: "ease-in-out",
                    })
                    .catch((error) => {
                      console.warn(
                        `Could not zoom to layer ${layerItem.title}:`,
                        error,
                      );
                    });
                } else {
                  console.warn(
                    `No extent available for layer: ${layerItem.title}`,
                  );
                }
              })
              .catch((err) => {
                console.warn(`Layer load error for ${layerItem.title}:`, err);
              });

            if (layer instanceof FeatureLayer) {
              layer
                .when(() => {
                  console.log(`FeatureLayer ready: ${layerItem.title}`, {
                    loaded: layer.loaded,
                    visible: layer.visible,
                    minScale: layer.minScale,
                    maxScale: layer.maxScale,
                    hasData: layer.source?.length > 0 || layer.url != null,
                    extent: layer.fullExtent?.toJSON(),
                  });
                })
                .catch((err) => {
                  console.warn(
                    `FeatureLayer load error for ${layerItem.title}:`,
                    err,
                  );
                });
            } else if (layer instanceof GroupLayer) {
              layer
                .when(() => {
                  console.log(`GroupLayer ready: ${layerItem.title}`, {
                    loaded: layer.loaded,
                    visible: layer.visible,
                    sublayerCount: layer.layers?.length || 0,
                    sublayers: layer.layers?.map((l: any) => ({
                      title: l.title,
                      type: l.type,
                      visible: l.visible,
                    })),
                  });
                })
                .catch((err) => {
                  console.warn(
                    `GroupLayer load error for ${layerItem.title}:`,
                    err,
                  );
                });
            }

            // Handle sublayers
            if (layer instanceof GroupLayer && layerItem?.layers) {
              const parentVisible = layerItem.visibility ?? false;
              layerItem.layers.forEach((childLayer: any) => {
                const childEsriLayer = layer.layers.find(
                  (l: any) => l.id === childLayer.id,
                );
                if (childEsriLayer) {
                  childEsriLayer.visible =
                    parentVisible && (childLayer.visibility ?? false);
                  if (childLayer.opacity !== undefined) {
                    childEsriLayer.opacity = childLayer.opacity;
                  }
                }
              });
            }

            if (layer instanceof MapImageLayer && layerItem.layers) {
              const mapImageLayer = layer as MapImageLayer;
              layerItem.layers.forEach((childLayer: any) => {
                if (childLayer.sublayerId !== undefined) {
                  const sublayer = mapImageLayer.findSublayerById(
                    childLayer.sublayerId,
                  );
                  if (sublayer) {
                    sublayer.visible = childLayer.visibility ?? false;
                    if (childLayer.opacity !== undefined) {
                      sublayer.opacity = childLayer.opacity;
                    }
                  }
                }
              });
            }

            processingLayersRef.current.delete(layerItem.id);
            addedLayersRef.current.add(layerItem.id);
          } catch (error) {
            processingLayersRef.current.delete(layerItem.id);

            const errorMessage =
              error instanceof Error ? error.message : String(error);
            if (
              errorMessage.includes("Unsupported layer type") ||
              errorMessage.includes("does not exist") ||
              errorMessage.includes("inaccessible")
            ) {
              console.warn(`Skipping layer ${layerItem.title}:`, errorMessage);
            } else {
              console.error(`Error adding layer ${layerItem.title}:`, error);
              console.error("Layer details:", {
                id: layerItem.id,
                type: layerItem.type,
                layerType: layerItem.layerType,
                url: layerItem.url,
                itemId: layerItem.itemId,
              });
              addedLayersRef.current.delete(layerItem.id);
            }
          }
        }
      }

      reorderLayers(view.map);

      console.log("Layer processing complete. Legend will auto-update.");

      previousLayersRef.current = JSON.parse(JSON.stringify(newLayers));
    } catch (error) {
      console.error("Layer processing error:", error);
    } finally {
      setIsMapLoading(false);
    }
  };

  const lastLayersRef = useRef(layers);
  const initialLoadComplete = useRef(false);

  useEffect(() => {
    if (!view) {
      setIsMapLoading(false);
      return;
    }

    if (JSON.stringify(lastLayersRef.current) === JSON.stringify(layers)) {
      // No changes, ensure loading is false
      if (!initialLoadComplete.current) {
        console.log("Initial map load complete, no layer changes");
        initialLoadComplete.current = true;
      }
      setIsMapLoading(false);
      return;
    }

    console.log("Layer change detected, current layers:", layers);

    const processChanges = async () => {
      await processLayerChanges();
      if (!initialLoadComplete.current) {
        console.log("Initial layer processing complete");
        initialLoadComplete.current = true;
      }
    };
    processingQueue.current = processingQueue.current.then(processChanges);

    lastLayersRef.current = layers;
  }, [view, layers]);

  useEffect(() => {
    return () => {
      layerCache.current = {};
      previousLayersRef.current = [];
      processingLayersRef.current.clear();
      addedLayersRef.current.clear();
      initialLoadComplete.current = false;
    };
  }, []);

  return {
    isMapLoading,
  };
}
