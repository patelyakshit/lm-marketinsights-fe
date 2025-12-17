import { Extent } from "@arcgis/core/geometry";
import { union } from "@arcgis/core/geometry/geometryEngine";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import GroupLayer from "@arcgis/core/layers/GroupLayer";
import MapImageLayer from "@arcgis/core/layers/MapImageLayer";
import * as locator from "@arcgis/core/rest/locator";
import Query from "@arcgis/core/rest/support/Query";
import MapView from "@arcgis/core/views/MapView";
import { create } from "zustand";
import { DEFAULT_PIN_NOTE_TITLE } from "../constants/pins";
import { AppliedLayer } from "../schema";
import { PinType } from "../types/operations";

interface FilterCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
  isActive: boolean;
}

interface SubLayer {
  id: string;
  sublayerId?: number;
  title: string;
  visibility?: boolean;
  visible?: boolean;
  filterConditions?: FilterCondition[];
}

interface LayerField {
  name: string;
  type: string;
  alias: string;
}

export interface MapState {
  center: { latitude: number; longitude: number } | null;
  zoom: number;
  scale: number;
  extent: any;
  layers: any[];
  pins?: PinType[];
}

interface MapStore {
  layers: AppliedLayer[];
  mapView: MapView | null;
  mapKeyWidget: any;
  isMapReady: boolean;
  pins: (PinType & { _source?: "user" | "socket" })[];
  setLayers: (layers: AppliedLayer[]) => void;
  addLayer: (layer: AppliedLayer) => void;
  removeLayer: (layer: AppliedLayer) => void;
  reorderLayers: (startIndex: number, endIndex: number) => void;
  setMapView: (view: MapView | null) => void;
  setMapKeyWidget: (mapKeyWidget: any) => void;
  setMapReady: (ready: boolean) => void;
  addPin: (pin: PinType, source?: "user" | "socket") => void;
  removePin: (pinId: string) => void;
  removeAllPins: () => void;
  updatePinNote: (
    pinId: string,
    updates: { note: string; title: string },
  ) => void;
  getCurrentMapState: () => Promise<MapState>;
  zoomIn: () => Promise<boolean>;
  zoomOut: () => Promise<boolean>;
  zoomToPlace: (place: string) => Promise<boolean>;
  zoomToFeature: (layerId: string, whereClause: string) => Promise<boolean>;
  toggleLayer: (id: string, visible: boolean) => void;
  applyFilter: (id: string, where: string) => void;
}

// Performance optimization: Cache map state for 5 seconds
let cachedMapState: MapState | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION_MS = 5000; // 5 seconds

export const useMapStore = create<MapStore>((set, get) => ({
  layers: [],
  mapView: null,
  mapKeyWidget: null,
  isMapReady: false,
  pins: [],
  setLayers: (layers) => set({ layers }),
  addLayer: (layer) => set((state) => ({ layers: [...state.layers, layer] })),
  removeLayer: (layer) => {
    const { mapView } = get();
    if (mapView?.map) {
      const arcLayer = mapView.map.findLayerById(layer.id);
      if (arcLayer) {
        const layerWithHandlers = arcLayer as any;
        if (layerWithHandlers._clickHandler) {
          layerWithHandlers._clickHandler?.remove();
          layerWithHandlers._clickHandler = null;
          layerWithHandlers._clickHandlerRegistered = false;
        }
        mapView.map.remove(arcLayer);
      }
    }

    set((state) => ({
      layers: state.layers.filter((l) => l.id !== layer.id),
    }));
  },
  reorderLayers: (startIndex: number, endIndex: number) => {
    const { mapView, layers } = get();
    const newLayers = Array.from(layers);
    const [reorderedItem] = newLayers.splice(startIndex, 1);
    newLayers.splice(endIndex, 0, reorderedItem);
    set({ layers: newLayers });

    if (mapView?.map) {
      try {
        // Collect all map layers in the new order
        const mapLayers: any[] = [];
        newLayers.forEach((layer) => {
          const mapLayer = mapView.map?.findLayerById(layer.id);
          if (mapLayer && mapView.map) {
            mapLayers.push(mapLayer);
            mapView.map.remove(mapLayer);
          }
        });

        // Add layers back in order - higher index in array = higher on map (drawn on top)
        // This matches the UI where we reverse() to display, so visually top = highest index
        mapLayers.forEach((mapLayer, index) => {
          if (mapView.map) {
            mapView.map.add(mapLayer, index);
          }
        });
      } catch (error) {
        console.error("Error reordering map layers:", error);
      }
    }
  },
  setMapView: (view: MapView | null) => set({ mapView: view }),
  setMapKeyWidget: (mapKeyWidget: any) => set({ mapKeyWidget }),
  setMapReady: (ready: boolean) => set({ isMapReady: ready }),
  addPin: (pin: PinType, source: "user" | "socket" = "user") => {
    const { pins } = get();
    // Check if pin already exists
    if (!pins.find((p) => p.id === pin.id)) {
      set({
        pins: [
          ...pins,
          {
            ...pin,
            title: pin.title || DEFAULT_PIN_NOTE_TITLE,
            _source: source, // Internal flag to track source
          } as PinType & { _source: "user" | "socket" },
        ],
      });
    }
  },
  removePin: (pinId: string) => {
    const { pins, mapView } = get();
    const pinToRemove = pins.find((p) => p.id === pinId);

    // Remove graphic from map if it exists
    if (mapView && pinToRemove) {
      const graphicsToRemove = mapView.graphics.filter(
        (graphic) => graphic.attributes?.id === pinId,
      );
      mapView.graphics.removeMany(graphicsToRemove);
    }

    set({ pins: pins.filter((p) => p.id !== pinId) });
  },
  removeAllPins: () => {
    const { mapView, pins } = get();

    // Remove all pin graphics from map
    if (mapView) {
      const pinIds = pins.map((p) => p.id);
      const graphicsToRemove = mapView.graphics.filter((graphic) =>
        pinIds.includes(graphic.attributes?.id),
      );
      mapView.graphics.removeMany(graphicsToRemove);
    }

    set({ pins: [] });
  },
  updatePinNote: (pinId: string, updates: { note: string; title: string }) => {
    set((state) => {
      let hasUpdated = false;
      const updatedPins = state.pins.map((pin) => {
        if (pin.id === pinId) {
          const currentNote = pin.note || "";
          const currentTitle = pin.title || DEFAULT_PIN_NOTE_TITLE;
          if (currentNote !== updates.note || currentTitle !== updates.title) {
            hasUpdated = true;
            return {
              ...pin,
              note: updates.note,
              title: updates.title,
            };
          }
        }
        return pin;
      });

      if (!hasUpdated) {
        return state;
      }

      return { pins: updatedPins };
    });
  },
  getCurrentMapState: async (): Promise<MapState> => {
    const { mapView, layers } = get();
    if (!mapView)
      return {
        center: null,
        zoom: 0,
        scale: 0,
        extent: null,
        layers: [],
        pins: [],
      };

    // Performance optimization: Return cached state if still valid (within 5 seconds)
    const now = Date.now();
    if (cachedMapState && (now - cacheTimestamp) < CACHE_DURATION_MS) {
      // Update only fast-changing properties (center, zoom, pins)
      const { pins } = get();
      return {
        ...cachedMapState,
        center: mapView.center
          ? {
              latitude: mapView.center?.latitude ?? 0,
              longitude: mapView.center?.longitude ?? 0,
            }
          : null,
        zoom: mapView.zoom,
        scale: mapView.scale,
        extent: mapView.extent?.toJSON(),
        pins: pins.map((pin) => ({
          id: pin.id,
          address: pin.address,
          latitude: pin.latitude,
          longitude: pin.longitude,
          title: pin.title || DEFAULT_PIN_NOTE_TITLE,
          note: pin.note || "",
          color: pin.color,
        })),
      };
    }

    // FAST PATH: Get basic layer info immediately (for layer toggles)
    // This doesn't require async queries and should be instant
    const basicLayers = layers.map((layer) => {
      const arcLayer = mapView.map?.findLayerById(layer.id);
      return {
        id: layer.id,
        title: layer.title,
        visible: layer.visibility ?? arcLayer?.visible ?? false,
        schema: {},
        example_data: [],
        current_filter: "1=1",
        sublayers: [],
        service_url: layer.url || (arcLayer as any)?.url || null,
        index: (arcLayer as any)?.layerId || null,
      };
    }).filter(Boolean);

    console.log(`[getCurrentMapState] Fast path: ${basicLayers.length} layers`);

    // Performance optimization: Add 2000ms timeout to prevent blocking
    // Increased from 500ms to allow for larger layers with feature queries
    const timeoutPromise = new Promise<null[]>((resolve) =>
      setTimeout(() => {
        console.warn("[getCurrentMapState] Timeout hit, using basic layers");
        resolve([]);
      }, 2000)
    );

    const layerPromise = Promise.all(
      layers.map(async (layer) => {
        const arcLayer = mapView.map?.findLayerById(layer.id);
        if (!arcLayer) return null;

        let fields: LayerField[] = [];
        let exampleRows: Record<string, any>[] = [];
        let definitionExpression = "1=1";
        let sublayers: SubLayer[] = [];

        if (arcLayer instanceof FeatureLayer) {
          fields =
            arcLayer.fields?.map((f) => ({
              name: f.name,
              type: f.type,
              alias: f.alias || "",
            })) || [];

          // First, check the feature count
          const countQuery = new Query({
            where: arcLayer.definitionExpression || "1=1",
            returnGeometry: false,
          });

          let featureCount = 0;
          try {
            featureCount = await arcLayer.queryFeatureCount(countQuery);
          } catch {
            featureCount = 999; // Assume large if count fails
          }

          // For small layers (< 100 features), include ALL data with geometry
          // This allows the backend to find specific features (like "Store 18")
          const isSmallLayer = featureCount < 100;
          const query = new Query({
            where: arcLayer.definitionExpression || "1=1",
            outFields: ["*"],
            num: isSmallLayer ? 100 : 3, // Get all features for small layers
            returnGeometry: isSmallLayer, // Include geometry for small layers so backend can get coordinates
          });
          const result = await arcLayer.queryFeatures(query);

          // Include geometry for small layers (convert to simple lat/lng)
          exampleRows = result.features.map((f) => {
            const attrs = { ...f.attributes };
            if (isSmallLayer && f.geometry) {
              const geom = f.geometry as any;
              if (geom.type === "point") {
                attrs._latitude = geom.latitude;
                attrs._longitude = geom.longitude;
              } else if (geom.extent) {
                // For polygons, use center of extent
                attrs._latitude = (geom.extent.ymin + geom.extent.ymax) / 2;
                attrs._longitude = (geom.extent.xmin + geom.extent.xmax) / 2;
              }
            }
            return attrs;
          });
          definitionExpression = arcLayer.definitionExpression || "1=1";
        } else if (
          arcLayer instanceof MapImageLayer &&
          Array.isArray(layer?.layers)
        ) {
          const sublayerResults = await Promise.all(
            layer.layers.map(async (subLayer: any) => {
              const sublayer = arcLayer?.findSublayerById(subLayer?.sublayerId);
              if (!sublayer) return null;
              const subFields =
                sublayer?.fields?.map((f) => ({
                  name: f.name,
                  type: f.type,
                  alias: f.alias || "",
                })) || [];
              const query = new Query({
                where: sublayer.definitionExpression || "1=1",
                outFields: ["*"],
                num: 3,
                returnGeometry: false,
              });
              const result = await sublayer.queryFeatures(query);
              return {
                id: subLayer.id || `${layer.id}_${subLayer.sublayerId}`,
                sublayerId: subLayer.sublayerId,
                title: subLayer.title || sublayer.title,
                visible: sublayer.visible,
                fields: subFields,
                exampleRows: result.features.map((f) => f.attributes),
                definitionExpression: sublayer.definitionExpression || "1=1",
                filterConditions: subLayer.filterConditions || [],
              };
            }),
          );
          sublayers = sublayerResults.filter(
            (item): item is NonNullable<typeof item> => item !== null,
          );
        } else if (arcLayer instanceof GroupLayer && layer.layers) {
          sublayers = layer.layers.map((subLayer: any) => {
            const arcGISSublayer = arcLayer.layers.find(
              (sl: any) => sl.id === subLayer.id,
            );
            return {
              id: subLayer.id,
              title: subLayer.title,
              visible: arcGISSublayer
                ? arcGISSublayer.visible
                : subLayer.visibility,
              filterConditions: subLayer.filterConditions || [],
            };
          });
        }

        const schema = fields.reduce(
          (acc: Record<string, { type: string; description: string }>, f) => {
            acc[f.name] = { type: f.type, description: f.alias || f.name };
            return acc;
          },
          {},
        );

        const transformedSublayers = sublayers
          .filter(Boolean)
          .map((sl: any) => {
            const subSchema = (sl.fields || []).reduce(
              (
                acc: Record<string, { type: string; description: string }>,
                f: LayerField,
              ) => {
                acc[f.name] = { type: f.type, description: f.alias || f.name };
                return acc;
              },
              {},
            );
            return {
              title: sl.title,
              id: sl.id,
              visible: sl.visible,
              schema: subSchema,
              example_data: sl.exampleRows || [],
              current_filter: sl.definitionExpression || "1=1",
            };
          });

        return {
          id: layer.id,
          title: layer.title,
          visible: layer.visibility,
          schema,
          example_data: exampleRows,
          current_filter: definitionExpression,
          sublayers: transformedSublayers,
          service_url: layer.url || (arcLayer as any).url || null,
          index: (arcLayer as any).layerId || null,
        };
      }),
    );

    // Use Promise.race to timeout after 500ms - use basicLayers as fallback if layer queries are slow
    const detailedLayers = await Promise.race([layerPromise, timeoutPromise]);

    // If timeout hit (empty array) or no detailed layers, use basicLayers
    const mapLayers = detailedLayers.filter(Boolean).length > 0
      ? detailedLayers.filter(Boolean)
      : basicLayers;

    console.log(`[getCurrentMapState] Final: ${mapLayers.length} layers (detailed: ${detailedLayers.filter(Boolean).length}, basic: ${basicLayers.length})`);

    const { pins } = get();

    const result: MapState = {
      center: mapView.center
        ? {
            latitude: mapView.center?.latitude ?? 0,
            longitude: mapView.center?.longitude ?? 0,
          }
        : null,
      zoom: mapView.zoom,
      scale: mapView.scale,
      extent: mapView.extent?.toJSON(),
      layers: mapLayers,
      pins: pins.map((pin) => ({
        id: pin.id,
        address: pin.address,
        latitude: pin.latitude,
        longitude: pin.longitude,
        title: pin.title || DEFAULT_PIN_NOTE_TITLE,
        note: pin.note || "",
        color: pin.color,
      })),
    };

    // Cache the result for 5 seconds
    cachedMapState = result;
    cacheTimestamp = Date.now();

    return result;
  },
  zoomIn: async (): Promise<boolean> => {
    const { mapView } = get();
    console.log("Map view in zoomIn is: ", mapView);
    if (!mapView) return false;

    try {
      const currentZoom = mapView.zoom;
      const newZoom = Math.min(currentZoom + 1, 21);
      await mapView.goTo({ zoom: newZoom }, { duration: 500 });
      return true;
    } catch (error) {
      console.error("Zoom in failed:", error);
      return false;
    }
  },
  zoomOut: async (): Promise<boolean> => {
    const { mapView } = get();
    if (!mapView) return false;

    try {
      const currentZoom = mapView.zoom;
      const newZoom = Math.max(currentZoom - 1, 0);
      await mapView.goTo({ zoom: newZoom }, { duration: 500 });
      return true;
    } catch (error) {
      console.error("Zoom out failed:", error);
      return false;
    }
  },
  zoomToPlace: async (place: string): Promise<boolean> => {
    const { mapView } = get();
    console.log("zoomToPlace...", place, mapView);
    if (!mapView || !place) return false;

    const geocodeUrl =
      "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer";
    const params = {
      address: { singleLine: place },
      outFields: ["*"],
    };

    try {
      const response = await locator.addressToLocations(geocodeUrl, params);
      if (response.length > 0) {
        const candidate = response[0];
        await mapView.goTo(candidate.extent || candidate.location, {
          duration: 1000,
        });
        return true;
      }
    } catch (error) {
      console.error("Geocode failed:", error);
    }
    return false;
  },
  zoomToFeature: async (
    layerId: string,
    whereClause: string,
  ): Promise<boolean> => {
    const { mapView } = get();
    if (!mapView) return false;

    // if (!mapView.map) return false;
    const layer = mapView.map?.findLayerById(layerId);
    let queryLayer: FeatureLayer | __esri.Sublayer | null = null;

    if (layer instanceof FeatureLayer) {
      queryLayer = layer;
    } else if (layer instanceof MapImageLayer) {
      const sublayerId = layerId.split("_").pop();
      const sublayer = layer.findSublayerById(parseInt(sublayerId || "0"));
      if (sublayer) queryLayer = sublayer;
    }

    if (!queryLayer) return false;

    const query = new Query({
      where: whereClause,
      outFields: ["*"],
      returnGeometry: true,
    });

    try {
      const result = await queryLayer.queryFeatures(query);
      if (result.features.length > 0) {
        let fullExtent = result.features[0]?.geometry?.extent?.clone();
        for (let i = 1; i < result.features.length; i++) {
          const ext = result.features[i]?.geometry?.extent;
          if (ext && fullExtent)
            fullExtent = union([fullExtent, ext]) as Extent;
        }
        if (fullExtent) {
          await mapView.goTo(fullExtent.expand(1.2), { duration: 1000 });
          return true;
        }
      }
    } catch (error) {
      console.error("Query failed:", error);
    }
    return false;
  },
  toggleLayer: (id: string, visible: boolean) => {
    const { mapView, layers } = get();
    if (mapView) {
      const layer = mapView.map?.findLayerById(id);
      if (layer) {
        layer.visible = visible;
        if (
          layer instanceof MapImageLayer &&
          layers.find((l) => l.id === id)?.layers
        ) {
          layer.allSublayers.forEach((sublayer) => {
            const subLayerConfig = layers
              .find((l) => l.id === id)
              ?.layers?.find((sl: any) => sl.sublayerId === sublayer.id);
            if (subLayerConfig) {
              // Sublayer is visible only if parent is visible AND sublayer's stored visibility is true
              sublayer.visible =
                visible && (subLayerConfig.visibility ?? false);
            }
          });
        } else if (
          layer instanceof GroupLayer &&
          layers.find((l) => l.id === id)?.layers
        ) {
          layer.layers.forEach((sublayer) => {
            const subLayerConfig = layers
              .find((l) => l.id === id)
              ?.layers?.find((sl: any) => sl.id === sublayer.id);
            if (subLayerConfig) {
              sublayer.visible =
                visible && (subLayerConfig.visibility ?? false);
            }
          });
        }
      }
    }
    set({
      layers: layers.map((l) =>
        l.id === id
          ? {
              ...l,
              visibility: visible,
            }
          : l,
      ),
    });
  },
  applyFilter: (id: string, where: string) => {
    const { mapView, layers } = get();
    if (mapView) {
      const layer = mapView.map?.findLayerById(id);
      if (layer instanceof FeatureLayer) {
        layer.definitionExpression = where;
        set({
          layers: layers.map((l) =>
            l.id === id
              ? {
                  ...l,
                  filterConditions: [
                    ...(l.filterConditions || []),
                    {
                      id: `filter-${Date.now()}`,
                      field: "",
                      operator: "where",
                      value: where,
                      isActive: true,
                    },
                  ],
                }
              : l,
          ),
        });
      } else if (layer instanceof MapImageLayer) {
        const sublayerId = id.split("_").pop();
        const sublayer = layer.findSublayerById(parseInt(sublayerId || "0"));
        if (sublayer) {
          sublayer.definitionExpression = where;
          set({
            layers: layers.map((l) =>
              l.id === id
                ? {
                    ...l,
                    layers: l.layers?.map((sl: any) =>
                      sl.sublayerId === parseInt(sublayerId || "0")
                        ? {
                            ...sl,
                            filterConditions: [
                              ...(sl.filterConditions || []),
                              {
                                id: `filter-${Date.now()}`,
                                field: "",
                                operator: "where",
                                value: where,
                                isActive: true,
                              },
                            ],
                          }
                        : sl,
                    ),
                  }
                : l,
            ),
          });
        }
      }
    }
  },
}));
