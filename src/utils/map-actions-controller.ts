import Graphic from "@arcgis/core/Graphic";
import { Extent, Point } from "@arcgis/core/geometry";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer";
import GroupLayer from "@arcgis/core/layers/GroupLayer";
import MapImageLayer from "@arcgis/core/layers/MapImageLayer";
import MapView from "@arcgis/core/views/MapView";
import * as webMercatorUtils from "@arcgis/core/geometry/support/webMercatorUtils";
import { DEFAULT_PIN_NOTE_TITLE } from "../constants/pins";
import { useMapStore } from "../store/useMapStore";
import {
  GeoJSONFeature,
  GeoJSONFeatureCollection,
  GeoJSONGeometry,
  PanMapDirectionType,
  PlotGeoJSONPayload,
  ZoomToFeaturesPayload,
} from "../types/operations";
import { getPinSymbol, getPinIconCursorSvg } from "./common";
import { ExtentType } from "../types";

interface PinGraphicParams {
  latitude: number;
  longitude: number;
  id: string;
  label: string;
  color?: string;
  geometry?: __esri.Point;
}

type GraphicWithZIndex = __esri.Graphic & { zIndex: number };

export class MapActionsController {
  private view: MapView;
  private isPinMode: boolean = false;
  private pinModeClickHandler: __esri.Handle | null = null;

  constructor(view: MapView) {
    if (!view) {
      throw new Error("JimuMapView is required");
    }
    this.view = view;
  }

  async toggleLayerVisibility(
    layerId: string,
    layerName: string,
    visible: boolean,
  ) {
    console.log(`[toggleLayerVisibility] Called with layerId: ${layerId}, layerName: ${layerName}, visible: ${visible}`);

    const { layers } = useMapStore.getState();
    console.log(`[toggleLayerVisibility] Store has ${layers.length} layers:`, layers.map(l => ({ id: l.id, title: l.title })));

    // First try to find by exact ID in ArcGIS map
    let layer = this.findLayerById(layerId);

    // If not found by ID, try to find by title (fuzzy match)
    if (!layer) {
      console.log(`[toggleLayerVisibility] Layer not found by ID, trying to find by title: ${layerName}`);

      // Search all layers in the map
      const allMapLayers = this.view.map?.allLayers;
      if (allMapLayers) {
        // Try exact title match first
        layer = allMapLayers.find((l: any) =>
          l.title?.toLowerCase() === layerName?.toLowerCase()
        );

        // If still not found, try fuzzy title match
        if (!layer) {
          const normalizedName = layerName?.toLowerCase().replace(/[:\-_]/g, ' ').trim();
          layer = allMapLayers.find((l: any) => {
            const normalizedTitle = l.title?.toLowerCase().replace(/[:\-_]/g, ' ').trim();
            return normalizedTitle?.includes(normalizedName) || normalizedName?.includes(normalizedTitle);
          });
        }

        if (layer) {
          console.log(`[toggleLayerVisibility] Found layer by title match: ${(layer as any).title} (ID: ${(layer as any).id})`);
          // Update layerId to use the found layer's actual ID
          layerId = (layer as any).id;
        }
      }
    }

    if (!layer) {
      console.warn(`[toggleLayerVisibility] Layer with id ${layerId} and name ${layerName} not found in map`);
      console.log(`[toggleLayerVisibility] Available map layers:`, this.view.map?.allLayers?.map((l: any) => ({ id: l.id, title: l.title })));
      return;
    }

    layer.visible = visible;
    console.log(`[toggleLayerVisibility] Set ArcGIS layer.visible = ${visible}`);

    // Update the store with the new visibility
    const storeLayer = layers.find(l => l.id === layerId || l.title?.toLowerCase() === layerName?.toLowerCase());
    const storeLayerId = storeLayer?.id || layerId;

    useMapStore.getState().setLayers(
      layers.map((l) =>
        l.id === storeLayerId
          ? {
              ...l,
              visibility: visible,
            }
          : l,
      ),
    );

    console.log(`[toggleLayerVisibility] ${visible ? "Enabled" : "Disabled"} layer: ${layerName}`);
    useMapStore.getState().setMapView(this.view);
  }

  async toggleSublayerVisibility(
    layerId: string,
    sublayerId: string,
    visible: boolean,
  ) {
    const { layers } = useMapStore.getState();
    const parentLayer = this.findLayerById(layerId) as any;

    if (!parentLayer || !parentLayer.layers) {
      console.warn(
        `Parent layer with id ${layerId} not found or has no sublayers`,
      );
      return;
    }

    const sublayer = parentLayer.layers.find((sl: any) => sl.id === sublayerId);
    if (!sublayer) {
      console.warn(
        `Sublayer with id ${sublayerId} not found in layer ${layerId}`,
      );
      return;
    }

    if (visible) {
      parentLayer.visible = true;
    }
    sublayer.visible = visible;

    // Update the store with the new sublayer visibility and parent visibility
    useMapStore.getState().setLayers(
      layers.map((l) =>
        l.id === layerId
          ? {
              ...l,
              visibility: visible ? true : l.visibility,
              layers: l.layers?.map((sl: any) =>
                sl.id === sublayerId
                  ? {
                      ...sl,
                      visibility: visible,
                    }
                  : sl,
              ),
            }
          : l,
      ),
    );

    console.log(
      `${visible ? "Enabled" : "Disabled"} sublayer: ${sublayerId}, parent layer ${visible ? "enabled" : "unchanged"}`,
    );
    useMapStore.getState().setMapView(this.view);
  }

  findLayerById(layerId: string): any {
    return this.view.map?.findLayerById(layerId);
  }

  async handleZoomToFeatures(payload: ZoomToFeaturesPayload) {
    const { layerId, layerName, target } = payload;

    const layer = this.findLayerById(layerId);
    if (!layer) {
      console.error(`Layer with id ${layerId} not found`);
      return;
    }

    if (target === "FULL_EXTENT") {
      this.view.goTo(layer.fullExtent);
      return;
    }

    if (target === "FILTERED") {
      const query = layer.createQuery();

      query.where = layer.definitionExpression || "1=1";

      try {
        const results = await layer.queryFeatures(query);
        if (results.features.length > 0) {
          this.view.goTo(results.features);
        } else {
          console.error("No features found for layer: ", layerName);
        }
      } catch (error) {
        console.error("Error querying features for layer: ", layerName, error);
      }
      return;
    }
    useMapStore.getState().setMapView(this.view);
  }

  zoomInZoomOut(zoom_action: "zoom_in" | "zoom_out", zoom_percentage: number) {
    if (!this.view) {
      throw new Error("MapView is required!");
    }

    const currentScale = this.view.scale;

    const newScale =
      zoom_action === "zoom_in"
        ? currentScale / (1 + zoom_percentage)
        : currentScale * (1 + zoom_percentage);

    console.log(`Zooming ${zoom_action} by ${zoom_percentage}%`);
    console.log(`Current scale: ${currentScale} -> New scale: ${newScale}`);

    this.view.goTo({ scale: newScale }, { duration: 500, easing: "linear" });
    useMapStore.getState().setMapView(this.view);
  }

  optimalZoom(layer: FeatureLayer, view: MapView) {
    const currentScale = view.scale;

    if (currentScale > layer.minScale) {
      view.goTo(
        {
          scale: layer.minScale * 0.75,
        },
        {
          duration: 1000,
          easing: "linear",
        },
      );
    }
  }

  panMap(direction: PanMapDirectionType, distance: number) {
    if (!this.view || !this.view) {
      throw new Error("JimuMapView is required!");
    }

    const screenWidth = this.view.width;
    const screenHeight = this.view.height;

    const pixelDistanceX = screenWidth * (distance / 100) * 5;
    const pixelDistanceY = screenHeight * (distance / 100) * 5;

    let newScreenPoint;

    switch (direction.toLowerCase()) {
      case "up":
      case "north":
        newScreenPoint = {
          x: screenWidth / 2,
          y: screenHeight / 2 - pixelDistanceY,
        };
        break;
      case "down":
      case "south":
        newScreenPoint = {
          x: screenWidth / 2,
          y: screenHeight / 2 + pixelDistanceY,
        };
        break;
      case "right":
      case "east":
        newScreenPoint = {
          x: screenWidth / 2 + pixelDistanceX,
          y: screenHeight / 2,
        };
        break;
      case "left":
      case "west":
        newScreenPoint = {
          x: screenWidth / 2 - pixelDistanceX,
          y: screenHeight / 2,
        };
        break;
      default:
        console.error("Invalid pan direction:", direction);
        return;
    }

    const newMapPoint = this.view.toMap(newScreenPoint);

    this.view.goTo(
      { center: [newMapPoint.longitude, newMapPoint.latitude] },
      { duration: 500, easing: "linear" },
    );
    useMapStore.getState().setMapView(this.view);
  }

  showLocation(extent: ExtentType) {
    if (!this.view) {
      throw new Error("MapView is required!");
    }

    if (extent) {
      const targetExtent = new Extent({
        xmin: extent.xmin,
        ymin: extent.ymin,
        xmax: extent.xmax,
        ymax: extent.ymax,
        spatialReference: extent.spatialReference,
      });

      if (targetExtent) {
        this.view
          .goTo(targetExtent, {
            duration: 2500,
            easing: "ease-in-out",
          })
          .then(() => {
            console.log("Successfully zoomed to geocode extent");
          })
          .catch((error) => {
            console.error("Failed to zoom to geocode extent:", error);
          });
      }
    }

    useMapStore.getState().setMapView(this.view);
  }

  async applyFilter(
    layerId: string,
    whereClause: string,
    spatialLock: boolean = false,
  ) {
    console.log(`[applyFilter] Called with layerId: ${layerId}, whereClause: ${whereClause}, spatialLock: ${spatialLock}`);

    const { layers } = useMapStore.getState();
    let targetLayer = this.findLayerById(layerId);
    let parentLayerId = layerId;
    let sublayerNumericId: number | null = null;

    // If layer not found directly, try to parse as sublayer ID (format: parentId_sublayerId)
    if (!targetLayer && layerId.includes("_")) {
      const parts = layerId.split("_");
      const possibleSublayerId = parts.pop();
      parentLayerId = parts.join("_");

      console.log(`[applyFilter] Layer not found directly, trying parent: ${parentLayerId}, sublayer: ${possibleSublayerId}`);

      targetLayer = this.findLayerById(parentLayerId);
      if (targetLayer && possibleSublayerId) {
        sublayerNumericId = parseInt(possibleSublayerId, 10);
      }
    }

    // Also try to find by layer title/name in the store
    if (!targetLayer) {
      console.log(`[applyFilter] Searching store layers for match...`);
      const storeLayer = layers.find(l =>
        l.id === layerId ||
        l.title?.toLowerCase().includes(layerId.toLowerCase()) ||
        layerId.toLowerCase().includes(l.title?.toLowerCase() || "")
      );

      if (storeLayer) {
        console.log(`[applyFilter] Found store layer: ${storeLayer.id} - ${storeLayer.title}`);
        targetLayer = this.findLayerById(storeLayer.id);
        parentLayerId = storeLayer.id;

        // If still not found by ID, search the actual map layers by title
        if (!targetLayer && storeLayer.title) {
          console.log(`[applyFilter] Layer not found by ID, searching map by title: ${storeLayer.title}`);
          const allMapLayers = this.view.map?.allLayers;
          if (allMapLayers) {
            targetLayer = allMapLayers.find((l: __esri.Layer) =>
              l.title?.toLowerCase() === storeLayer.title?.toLowerCase()
            );
            if (targetLayer) {
              console.log(`[applyFilter] Found layer by title in map: ${targetLayer.title} (actual ID: ${targetLayer.id})`);
            }
          }
        }

        // Check if this is a MapImageLayer with sublayers matching the query
        if (targetLayer instanceof MapImageLayer && storeLayer.layers) {
          const matchingSublayer = storeLayer.layers.find((sl: any) =>
            sl.title?.toLowerCase().includes(layerId.toLowerCase()) ||
            layerId.toLowerCase().includes(sl.title?.toLowerCase() || "")
          );
          if (matchingSublayer && matchingSublayer.sublayerId !== undefined) {
            sublayerNumericId = matchingSublayer.sublayerId;
            console.log(`[applyFilter] Found matching sublayer: ${matchingSublayer.title} (${sublayerNumericId})`);
          }
        }
      }
    }

    if (!targetLayer) {
      console.warn(`[applyFilter] Could not find layer with id: ${layerId}`);
      console.log(`[applyFilter] Available layers:`, layers.map(l => ({ id: l.id, title: l.title })));
      return;
    }

    console.log(`[applyFilter] Found target layer: ${targetLayer.title || targetLayer.id} (type: ${targetLayer.type})`);

    // Handle FeatureLayer
    if (targetLayer instanceof FeatureLayer) {
      console.log(`[applyFilter] Applying filter to FeatureLayer: ${whereClause}`);
      targetLayer.definitionExpression = whereClause;

      // Update store with filter conditions
      useMapStore.getState().setLayers(
        layers.map((l) =>
          l.id === parentLayerId
            ? {
                ...l,
                filterConditions: [
                  ...(l.filterConditions || []),
                  {
                    id: `filter-${Date.now()}`,
                    field: "",
                    operator: "where",
                    value: whereClause,
                    isActive: true,
                  },
                ],
              }
            : l,
        ),
      );

      // Optional: Query and zoom to features if spatialLock is enabled
      if (spatialLock) {
        try {
          const query = targetLayer.createQuery();
          query.where = whereClause;
          query.geometry = this.view.extent;
          query.spatialRelationship = "intersects";

          const results = await targetLayer.queryFeatures(query);
          if (results.features.length > 0) {
            this.view.goTo(results.features);
          } else {
            console.warn(
              `[applyFilter] No features found for layer ${layerId} with filter: ${whereClause}`,
            );
          }
        } catch (error) {
          console.error("[applyFilter] Error querying features for layer: ", layerId, error);
        }
      }

      console.log(`[applyFilter] Successfully applied filter to FeatureLayer`);
    }
    // Handle MapImageLayer (sublayers)
    else if (targetLayer instanceof MapImageLayer) {
      console.log(`[applyFilter] Target is MapImageLayer, looking for sublayer...`);

      // If we already have the sublayer ID, use it
      // Otherwise, try to find the sublayer by matching title
      let sublayer: __esri.Sublayer | undefined;

      if (sublayerNumericId !== null) {
        sublayer = targetLayer.findSublayerById(sublayerNumericId) ?? undefined;
        console.log(`[applyFilter] Found sublayer by ID ${sublayerNumericId}: ${sublayer?.title}`);
      }

      // If not found by ID, try to find by title match
      if (!sublayer && targetLayer.sublayers) {
        const searchTerm = layerId.toLowerCase();
        sublayer = targetLayer.sublayers.find((sl: __esri.Sublayer) =>
          sl.title?.toLowerCase().includes(searchTerm) ||
          searchTerm.includes(sl.title?.toLowerCase() || "")
        );
        if (sublayer) {
          sublayerNumericId = sublayer.id;
          console.log(`[applyFilter] Found sublayer by title match: ${sublayer.title} (${sublayerNumericId})`);
        }
      }

      if (sublayer) {
        console.log(`[applyFilter] Applying filter to sublayer ${sublayer.title}: ${whereClause}`);
        sublayer.definitionExpression = whereClause;

        // Update store with filter conditions for sublayer
        const storeLayer = layers.find(l => l.id === parentLayerId);
        if (storeLayer) {
          useMapStore.getState().setLayers(
            layers.map((l) =>
              l.id === parentLayerId
                ? {
                    ...l,
                    layers: l.layers?.map((sl: any) =>
                      sl.sublayerId === sublayerNumericId
                        ? {
                            ...sl,
                            filterConditions: [
                              ...(sl.filterConditions || []),
                              {
                                id: `filter-${Date.now()}`,
                                field: "",
                                operator: "where",
                                value: whereClause,
                                isActive: true,
                              },
                            ],
                          }
                        : sl,
                    ),
                  }
                : l,
            ),
          );
        }

        console.log(`[applyFilter] Successfully applied filter to sublayer`);
      } else {
        console.warn(
          `[applyFilter] Sublayer not found in MapImageLayer ${parentLayerId}`,
        );
        console.log(`[applyFilter] Available sublayers:`, targetLayer.sublayers?.map((sl: __esri.Sublayer) => ({ id: sl.id, title: sl.title })));
      }
    }
    // Handle GroupLayer (contains multiple FeatureLayers)
    else if (targetLayer instanceof GroupLayer) {
      console.log(`[applyFilter] Target is GroupLayer, looking for FeatureLayer sublayers...`);
      console.log(`[applyFilter] GroupLayer has ${targetLayer.layers?.length || 0} sublayers`);

      // Find FeatureLayer(s) within the GroupLayer to apply the filter
      let filterApplied = false;

      if (targetLayer.layers) {
        for (const sublayer of targetLayer.layers.toArray()) {
          console.log(`[applyFilter] Checking sublayer: ${sublayer.title} (type: ${sublayer.type})`);

          if (sublayer instanceof FeatureLayer) {
            console.log(`[applyFilter] Applying filter to FeatureLayer sublayer: ${sublayer.title}`);
            sublayer.definitionExpression = whereClause;
            filterApplied = true;

            // Update store
            useMapStore.getState().setLayers(
              layers.map((l) =>
                l.id === parentLayerId
                  ? {
                      ...l,
                      layers: l.layers?.map((sl: any) =>
                        sl.title?.toLowerCase() === sublayer.title?.toLowerCase()
                          ? {
                              ...sl,
                              filterConditions: [
                                ...(sl.filterConditions || []),
                                {
                                  id: `filter-${Date.now()}`,
                                  field: "",
                                  operator: "where",
                                  value: whereClause,
                                  isActive: true,
                                },
                              ],
                            }
                          : sl,
                      ),
                    }
                  : l,
              ),
            );
          }
        }
      }

      if (filterApplied) {
        console.log(`[applyFilter] Successfully applied filter to GroupLayer sublayers`);
      } else {
        console.warn(`[applyFilter] No FeatureLayer sublayers found in GroupLayer`);
      }
    } else {
      console.warn(
        `[applyFilter] Layer with id ${layerId} is not a FeatureLayer, MapImageLayer, or GroupLayer. Type: ${targetLayer.type}`,
      );
    }

    useMapStore.getState().setMapView(this.view);
  }

  // Legacy filter method for backward compatibility
  async handleLegacyFilter(
    layerId: string,
    whereClause: string,
    spatialLock: boolean = false,
  ) {
    console.log("Legacy filter operation - redirecting to applyFilter");
    return this.applyFilter(layerId, whereClause, spatialLock);
  }

  // Legacy layer toggle method for backward compatibility
  async handleLegacyToggleLayer(layerId: string, visible: boolean) {
    console.log(
      "Legacy toggle layer operation - redirecting to toggleLayerVisibility",
    );
    const layer = this.findLayerById(layerId);
    if (!layer) {
      console.warn(`Layer with id ${layerId} not found`);
      return;
    }
    return this.toggleLayerVisibility(layerId, layer.title || layerId, visible);
  }

  async toggleLabels(layerId: string, enabled: boolean, labelField?: string) {
    const layer = this.findLayerById(layerId) as any;
    if (!layer || layer.type !== "feature") {
      console.warn(`Feature layer with id ${layerId} not found`);
      return;
    }

    if (enabled && labelField) {
      layer.labelingInfo = [
        {
          symbol: {
            type: "text",
            color: "green",
            backgroundColor: [255, 255, 255, 1],
            borderLineColor: "green",
            borderLineSize: 1,
            yoffset: 5,
            font: {
              family: "Playfair Display",
              size: 12,
              weight: "bold",
            },
          },
          labelPlacement: "above-center",
          labelExpressionInfo: {
            expression: `$feature.${labelField}`,
          },
        },
      ];
      layer.labelsVisible = true;
    } else {
      layer.labelingInfo = null;
      layer.labelsVisible = false;
    }

    console.log(
      `${enabled ? "Enabled" : "Disabled"} labels for layer: ${layerId}`,
    );
    useMapStore.getState().setMapView(this.view);
  }

  async toggleSublayerLabels(
    layerId: string,
    sublayerId: string,
    enabled: boolean,
    labelField?: string,
  ) {
    const parentLayer = this.findLayerById(layerId) as any;
    if (!parentLayer || !parentLayer.layers) {
      console.warn(`Parent layer with id ${layerId} not found`);
      return;
    }

    const sublayer = parentLayer.layers.find((sl: any) => sl.id === sublayerId);
    if (!sublayer || sublayer.type !== "feature") {
      console.warn(`Feature sublayer with id ${sublayerId} not found`);
      return;
    }

    if (enabled && labelField) {
      sublayer.labelingInfo = [
        {
          symbol: {
            type: "text",
            color: "green",
            backgroundColor: [255, 255, 255, 1],
            borderLineColor: "green",
            borderLineSize: 1,
            yoffset: 5,
            font: {
              family: "Playfair Display",
              size: 12,
              weight: "bold",
            },
          },
          labelPlacement: "above-center",
          labelExpressionInfo: {
            expression: `$feature.${labelField}`,
          },
        },
      ];
      sublayer.labelsVisible = true;
    } else {
      sublayer.labelingInfo = null;
      sublayer.labelsVisible = false;
    }
    useMapStore.getState().setMapView(this.view);
  }

  async addPins(pins: any[]) {
    if (!this.view) {
      throw new Error("MapView is required!");
    }

    pins.forEach((pin) => {
      const existingGraphic = this.view.graphics.find(
        (g) => g.attributes?.id === pin.id,
      );

      if (!existingGraphic) {
        const graphic: Graphic = this.createPinGraphic({
          latitude: pin.latitude,
          longitude: pin.longitude,
          id: pin.id,
          label:
            pin.address ||
            `Pin at ${pin.latitude.toFixed(4)}, ${pin.longitude.toFixed(4)}`,
          color: pin.color,
        });

        this.view.graphics.add(graphic);
      }

      // Store pin in the map store (from socket operation)
      const pinData: any = {
        id: pin.id,
        address:
          pin.address ||
          `Pin at ${pin.latitude.toFixed(4)}, ${pin.longitude.toFixed(4)}`,
        latitude: pin.latitude,
        longitude: pin.longitude,
        title: pin.title || DEFAULT_PIN_NOTE_TITLE,
        note: pin.note || "",
        color: pin.color,
        score: pin.score,
      };
      useMapStore.getState().addPin(pinData, "socket");
    });

    if (pins.length > 0) {
      await this.view.goTo(
        { center: [pins[0].longitude, pins[0].latitude], zoom: 12 },
        { duration: 1500, easing: "ease-in-out" },
      );
    }
  }

  async removePins(pinIds: string[]) {
    if (!this.view) {
      throw new Error("MapView is required!");
    }

    // Handle "all" case - remove all pins
    if (pinIds.includes("all")) {
      const { pins } = useMapStore.getState();
      const allPinIds = pins.map((p) => p.id);

      // Remove all pin graphics from map
      const graphicsToRemove = this.view.graphics.filter((graphic) =>
        allPinIds.includes(graphic.attributes?.id),
      );
      this.view.graphics.removeMany(graphicsToRemove);

      // Remove all pins from store
      useMapStore.getState().removeAllPins();
      return;
    }

    // Remove graphics by pin IDs
    const graphicsToRemove = this.view.graphics.filter((graphic) =>
      pinIds.includes(graphic.attributes?.id),
    );

    this.view.graphics.removeMany(graphicsToRemove);

    // Remove pins from store
    pinIds.forEach((pinId) => {
      useMapStore.getState().removePin(pinId);
    });
  }

  async resetLayers(layerIds: string[]) {
    layerIds.forEach((layerId) => {
      const layer = this.findLayerById(layerId);
      if (layer) {
        layer.visible = true;
        if (layer.type === "feature") {
          (layer as any).definitionExpression = null;
          (layer as any).labelingInfo = null;
          (layer as any).labelsVisible = false;
        }
      }
    });

    console.log(`Reset layers: ${layerIds.join(", ")}`);
    useMapStore.getState().setMapView(this.view);
  }

  async getCurrentMapState() {
    if (!this.view || !this.view) {
      throw new Error("JimuMapView is required!");
    }

    return {
      center: {
        longitude: this.view.center.longitude,
        latitude: this.view.center.latitude,
      },
      zoom: this.view.zoom,
      scale: this.view.scale,
      extent: this.view.extent,
    };
  }

  private createPinGraphic(params: PinGraphicParams) {
    console.log("Creating pin graphic:", params);

    try {
      const symbol = getPinSymbol({ fill: params.color || "#FF891C" });
      let geometry: Point;

      if (params.geometry) {
        geometry = params.geometry.clone() as Point;
      } else {
        geometry = new Point({
          longitude: params.longitude,
          latitude: params.latitude,
          spatialReference: { wkid: 4326 },
        });

        const viewSpatialReference = this.view.spatialReference;
        if (
          viewSpatialReference &&
          geometry.spatialReference &&
          !geometry.spatialReference.equals(viewSpatialReference)
        ) {
          if (viewSpatialReference.isWebMercator) {
            const projected =
              webMercatorUtils.geographicToWebMercator(geometry);
            if (projected) {
              geometry = projected as Point;
            }
          }
        }
      }

      const graphic = new Graphic({
        geometry,
        symbol: symbol,
        attributes: {
          id: params.id,
          label: params.label,
        },
      }) as GraphicWithZIndex;

      graphic.zIndex = 1000;

      console.log("Pin graphic created successfully:", graphic);
      return graphic;
    } catch (error) {
      console.error("Error creating pin graphic:", error);
      throw error;
    }
  }

  setPinMode() {
    if (!this.view) {
      throw new Error("MapView is required!");
    }

    if (this.isPinMode) {
      return;
    }

    this.isPinMode = true;

    const cursorSvg = getPinIconCursorSvg();
    const encodedCursorSvg = encodeURIComponent(cursorSvg);
    const cursorDataUrl = `data:image/svg+xml;charset=utf-8,${encodedCursorSvg}`;

    const container = this.view.container as HTMLElement;
    if (container) {
      container.style.cursor = `url('${cursorDataUrl}') 15.5 19.5, pointer`;
    }

    const clickHandler = (event: __esri.ViewClickEvent) => {
      const { mapPoint } = event;
      if (mapPoint && mapPoint.latitude != null && mapPoint.longitude != null) {
        this.addPinAtLocation(mapPoint);
        this.resetPinMode();
      }
    };

    this.pinModeClickHandler = this.view.on("click", clickHandler);
  }

  resetPinMode() {
    if (!this.isPinMode) {
      return;
    }

    this.isPinMode = false;

    // Remove click handler
    if (this.pinModeClickHandler) {
      this.pinModeClickHandler.remove();
      this.pinModeClickHandler = null;
    }

    // Reset cursor
    const container = this.view.container as HTMLElement;
    if (container) {
      container.style.cursor = "";
    }
  }

  isPinPlacementActive() {
    return this.isPinMode;
  }

  addPinAtLocation(mapPoint: __esri.Point) {
    if (!this.view) {
      throw new Error("MapView is required!");
    }

    try {
      const isWebMercator =
        mapPoint?.spatialReference?.isWebMercator ||
        mapPoint?.spatialReference?.wkid === 102100;
      const geographicPoint = isWebMercator
        ? (webMercatorUtils.webMercatorToGeographic(mapPoint) as Point)
        : (mapPoint as Point);

      const latitudeValue =
        geographicPoint.latitude ?? mapPoint.latitude ?? null;
      const longitudeValue =
        geographicPoint.longitude ?? mapPoint.longitude ?? null;

      if (latitudeValue == null || longitudeValue == null) {
        throw new Error(
          "Unable to determine latitude/longitude for pin placement.",
        );
      }

      const latitude = latitudeValue;
      const longitude = longitudeValue;
      const pinId = `pin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const address = `Pin at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      const graphic = this.createPinGraphic({
        latitude,
        longitude,
        id: pinId,
        label: address,
        geometry: mapPoint.clone(),
      });

      this.view.graphics.add(graphic);

      // Store pin in the map store (from user interaction)
      const pinData: any = {
        id: pinId,
        address: address,
        latitude: latitude,
        longitude: longitude,
        note: "",
        color: "#FF891C",
        score: 100,
      };
      useMapStore.getState().addPin(pinData, "user");

      console.log(`Pin added at: ${latitude}, ${longitude}`, graphic);
      console.log(`Total graphics in view: ${this.view.graphics.length}`);
    } catch (error) {
      console.error("Error adding pin at location:", error);
      throw error;
    }
  }

  async plotGeoJSON(payload: PlotGeoJSONPayload) {
    console.log("Plotting GeoJSON============>", payload);

    // Check for either download_url (file-based) or inline geojson
    if (!payload || (!payload.download_url && !payload.geojson)) {
      console.error("No GeoJSON data provided (neither URL nor inline)");
      return;
    }

    try {
      let geoJSONData: GeoJSONFeatureCollection | GeoJSONFeature | GeoJSONGeometry;
      let geoJSONUrl: string;

      if (payload.geojson) {
        // Handle inline GeoJSON - convert to FeatureCollection if needed
        if (payload.geojson.type === "Polygon" || payload.geojson.type === "MultiPolygon" ||
            payload.geojson.type === "Point" || payload.geojson.type === "LineString") {
          // It's a raw geometry, wrap it in a Feature
          geoJSONData = {
            type: "FeatureCollection",
            features: [{
              type: "Feature",
              geometry: payload.geojson as GeoJSONGeometry,
              properties: { label: payload.label || "Trade Area" }
            }]
          };
        } else if (payload.geojson.type === "Feature") {
          geoJSONData = {
            type: "FeatureCollection",
            features: [payload.geojson as GeoJSONFeature]
          };
        } else {
          geoJSONData = payload.geojson as GeoJSONFeatureCollection;
        }

        // Create a Blob URL for the inline GeoJSON
        const blob = new Blob([JSON.stringify(geoJSONData)], { type: "application/json" });
        geoJSONUrl = URL.createObjectURL(blob);
        console.log("Created Blob URL for inline GeoJSON:", geoJSONUrl);
      } else {
        // Download from URL (original behavior)
        const response = await fetch(payload.download_url!);
        console.log("response GeoJSON from download_url===", response);

        if (!response.ok) {
          throw new Error(`Failed to download GeoJSON: ${response.statusText}`);
        }

        geoJSONData = await response.json();
        geoJSONUrl = payload.download_url!;
        console.log("GeoJSON data downloaded:", geoJSONData);
      }

      // Create a unique layer ID
      const layerId = payload.id || `geojson_${Date.now()}`;
      const layerTitle = payload.label || (geoJSONData as { name?: string }).name || `GeoJSON Layer ${Date.now()}`;

      // ✅ Create popupTemplate dynamically based on feature properties
      const features = (geoJSONData as GeoJSONFeatureCollection).features || [];
      const sampleFeature = features[0];
      let popupTemplate = undefined;

      if (sampleFeature && sampleFeature.properties) {
        // Create fieldInfos for a proper table-based popup
        const fieldInfos = Object.keys(sampleFeature.properties).map((key) => ({
          fieldName: key,
          label: key.replace(/([A-Z])/g, " $1").trim(), // Add spaces before capital letters
          visible: true,
        }));

        // Get title from properties or fallback to layerTitle
        const props = sampleFeature.properties as Record<string, string>;
        const featureTitle = props.name || props.Name || props.label || layerTitle;

        popupTemplate = {
          title: featureTitle,
          content: [
            {
              type: "fields",
              fieldInfos: fieldInfos,
            },
          ],
          outFields: ["*"],
        };
      } else {
        popupTemplate = {
          title: layerTitle,
          content: "Trade area polygon",
        };
      }

      // ✅ Determine renderer based on geometry type and custom style
      const geometryType = sampleFeature?.geometry?.type ||
        (payload.geojson as GeoJSONGeometry)?.type || "Polygon";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let renderer: any;

      if (geometryType === "Polygon" || geometryType === "MultiPolygon") {
        // Use custom style if provided, otherwise defaults
        const fillColor = payload.style?.fillColor || [59, 130, 246, 0.2]; // Blue with transparency
        const strokeColor = payload.style?.strokeColor || [37, 99, 235, 1]; // Darker blue
        const strokeWidth = payload.style?.strokeWidth || 2;

        renderer = {
          type: "simple",
          symbol: {
            type: "simple-fill",
            color: fillColor,
            outline: {
              color: strokeColor,
              width: strokeWidth,
            },
          },
        };
      } else if (geometryType === "Point" || geometryType === "MultiPoint") {
        renderer = {
          type: "simple",
          symbol: {
            type: "simple-marker",
            color: payload.style?.fillColor || "orange",
            outline: { color: "white", width: 1 },
            size: "10px",
          },
        };
      } else {
        // LineString or other
        renderer = {
          type: "simple",
          symbol: {
            type: "simple-line",
            color: payload.style?.strokeColor || [37, 99, 235, 1],
            width: payload.style?.strokeWidth || 2,
          },
        };
      }

      // ✅ Create GeoJSON layer with popup and symbol styling
      const geoJSONLayer = new GeoJSONLayer({
        id: layerId,
        title: layerTitle,
        url: geoJSONUrl,
        visible: true,
        popupEnabled: true,
        popupTemplate,
        renderer,
      });

      console.log("geoJSONLayer===", geoJSONLayer);

      // ✅ Add layer to map
      if (this.view.map) {
        this.view.map.add(geoJSONLayer);
      } else {
        console.error(
          "Map is not initialized on the view. Cannot add GeoJSON layer.",
        );
        return;
      }

      // ✅ Add to store
      const newLayer = {
        id: layerId,
        title: layerTitle,
        visibility: true,
        popupEnabled: true,
        type: "GeoJSON Layer",
        layerType: "GeoJSON",
        isAddedFromFile: payload.download_url ? true : false,
      };

      useMapStore.getState().addLayer(newLayer);

      // ✅ Zoom to extent
      try {
        await geoJSONLayer.when();
        await this.view.goTo(geoJSONLayer.fullExtent, {
          duration: 1000,
          easing: "ease-in-out",
        });
      } catch (error) {
        console.warn("Could not zoom to GeoJSON layer extent:", error);
      }

      console.log(`✅ Successfully added GeoJSON layer: ${layerTitle}`);
      useMapStore.getState().setMapView(this.view);
    } catch (error) {
      console.error("Error plotting GeoJSON:", error);
      throw error;
    }
  }
}

let controllerInstance: MapActionsController | null = null;

export function initializeMapActionsController(view: MapView) {
  if (!controllerInstance) {
    console.log("Initializing MapActionsController Singleton...");
    controllerInstance = new MapActionsController(view);
  }
  return controllerInstance;
}

export function getMapActionsController() {
  if (!controllerInstance) {
    throw new Error(
      "MapActionsController has not been initialized. Call initializeMapController first.",
    );
  }

  return controllerInstance;
}
