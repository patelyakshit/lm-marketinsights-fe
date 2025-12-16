import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Info, Loader2 } from "lucide-react";
import { toastError } from "../../../utils/toast";
import type { AppliedLayer } from "../../../schema";
import request from "@arcgis/core/request";

interface AddWebLayersProps {
  handleAddLayer: (layer: AppliedLayer) => Promise<void>;
  setIsAddLayersMode: (mode: boolean) => void;
}

interface LayerType {
  id: string;
  name: string;
  description: string;
  active: boolean;
  icon: string;
}

interface ServiceInfo {
  name: string;
  type: string;
  description?: string;
  layers?: Array<{
    id: number;
    name: string;
    type: string;
    description?: string;
  }>;
}

const AddWebLayers: React.FC<AddWebLayersProps> = ({
  handleAddLayer,
  setIsAddLayersMode,
}) => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRetrievingInfo, setIsRetrievingInfo] = useState(false);
  const [expandedLayerTypes, setExpandedLayerTypes] = useState<
    Record<string, boolean>
  >({});
  const [selectedLayerType, setSelectedLayerType] =
    useState<string>("arcgis_server");
  const [serviceInfo, setServiceInfo] = useState<ServiceInfo | null>(null);
  const [selectedLayers, setSelectedLayers] = useState<number[]>([]);
  const [layerName, setLayerName] = useState("");

  const updateLayerName = (selectedLayerIds: number[]) => {
    if (!serviceInfo) return;

    const isDirectChildLayer = /\/(\d+)\/?$/.test(url.trim());
    let childLayerId: number | null = null;

    if (isDirectChildLayer) {
      const match = url.trim().match(/\/(\d+)\/?$/);
      childLayerId = match ? parseInt(match[1]) : null;
    }

    if (
      isDirectChildLayer &&
      childLayerId !== null &&
      serviceInfo.layers &&
      serviceInfo.layers.length === 1
    ) {
      setLayerName(sanitizeLayerName(serviceInfo.layers[0].name));
    } else if (selectedLayerIds.includes(-1) || selectedLayerIds.length > 1) {
      setLayerName(sanitizeLayerName(serviceInfo.name));
    } else if (selectedLayerIds.length === 1) {
      const selectedLayer = serviceInfo.layers?.find(
        (layer) => layer.id === selectedLayerIds[0],
      );
      if (selectedLayer) {
        setLayerName(sanitizeLayerName(selectedLayer.name));
      }
    } else {
      setLayerName(sanitizeLayerName(serviceInfo.name));
    }
  };

  useEffect(() => {
    if (serviceInfo) {
      updateLayerName(selectedLayers);
    }
  }, [serviceInfo]);

  const layerTypes: LayerType[] = [
    {
      id: "arcgis_server",
      name: "ArcGIS Server Web Service",
      description:
        "Add ArcGIS Server feature, map, image, and vector tile services",
      active: true,
      icon: "🌐",
    },
    // {
    //   id: "geojson",
    //   name: "GeoJSON",
    //   description: "Add GeoJSON data from web URLs",
    //   active: false,
    //   icon: "📄",
    // },
    // {
    //   id: "kml",
    //   name: "KML/KMZ",
    //   description: "Add KML or KMZ files from web URLs",
    //   active: false,
    //   icon: "🗺️",
    // },
    // {
    //   id: "ogc_wms",
    //   name: "OGC WMS",
    //   description: "Add Web Map Service layers",
    //   active: false,
    //   icon: "🌍",
    // },
    // {
    //   id: "ogc_wfs",
    //   name: "OGC WFS",
    //   description: "Add Web Feature Service layers",
    //   active: false,
    //   icon: "🔗",
    // },
  ];

  const toggleLayerType = (layerTypeId: string) => {
    setExpandedLayerTypes((prev) => ({
      ...prev,
      [layerTypeId]: !prev[layerTypeId],
    }));
  };

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const sanitizeLayerName = (name: string): string => {
    if (!name) return name;
    let sanitized = name
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "")
      .replace(/_/g, " ")
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    sanitized = sanitized
      .split(" ")
      .map((word) => {
        const acronyms = ["FS", "VCGI", "H3", "VT", "SP", "WM", "LEVEL"];
        if (acronyms.includes(word.toUpperCase())) {
          return word.toUpperCase();
        }
        if (/^\d+$/.test(word)) {
          return word;
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(" ");

    return sanitized || name;
  };

  const getServiceInfo = async (
    serviceUrl: string,
  ): Promise<ServiceInfo | null> => {
    try {
      let normalizedUrl = serviceUrl.trim();
      if (!normalizedUrl.endsWith("/")) {
        normalizedUrl += "/";
      }

      const hasServiceType = /\/\w+Server\/?$/.test(normalizedUrl);

      const isDirectChildLayer = /\/(\d+)\/?$/.test(normalizedUrl);
      let childLayerId: number | null = null;

      if (isDirectChildLayer) {
        const match = normalizedUrl.match(/\/(\d+)\/?$/);
        childLayerId = match ? parseInt(match[1]) : null;
        normalizedUrl = normalizedUrl.replace(/\/(\d+)\/?$/, "/");
      }

      let endpoints: string[] = [];

      if (hasServiceType) {
        endpoints = [normalizedUrl];
      } else {
        endpoints = [
          normalizedUrl,
          `${normalizedUrl}MapServer`,
          `${normalizedUrl}FeatureServer`,
          `${normalizedUrl}ImageServer`,
          `${normalizedUrl}VectorTileServer`,
        ];
      }

      for (const endpoint of endpoints) {
        try {
          let queryUrl = `${endpoint}?f=json`;
          if (isDirectChildLayer && childLayerId !== null) {
            queryUrl = `${endpoint}${childLayerId}?f=json`;
          }

          const response = await request(queryUrl, {
            method: "auto",
            timeout: 10000,
          });

          if (response.data) {
            const data = response.data;

            if (data.error) {
              console.warn("Service returned error:", data.error);
              continue;
            }

            let serviceType = "Unknown";
            if (endpoint.includes("MapServer")) serviceType = "Map Service";
            else if (endpoint.includes("FeatureServer"))
              serviceType = "Feature Service";
            else if (endpoint.includes("ImageServer"))
              serviceType = "Image Service";
            else if (endpoint.includes("VectorTileServer"))
              serviceType = "Vector Tile Service";
            else if (data.layers) serviceType = "Map Service";
            else if (data.features) serviceType = "Feature Service";

            let serviceName = "Unknown Service";

            if (isDirectChildLayer && childLayerId !== null) {
              serviceName =
                data.name ||
                data.title ||
                data.displayName ||
                `Layer ${childLayerId}`;
            } else {
              try {
                const urlParts = new URL(endpoint);
                const pathParts = urlParts.pathname
                  .split("/")
                  .filter((part) => part.trim());

                for (let i = pathParts.length - 1; i >= 0; i--) {
                  const part = pathParts[i];
                  if (
                    !/^(FeatureServer|MapServer|ImageServer|VectorTileServer|services|rest|arcgis)$/i.test(
                      part,
                    )
                  ) {
                    serviceName = part;
                    break;
                  }
                }
              } catch (urlError) {
                console.warn("Could not extract name from URL:", urlError);
              }

              if (serviceName === "Unknown Service") {
                if (data.serviceName) {
                  serviceName = data.serviceName;
                } else if (data.name) {
                  serviceName = data.name;
                } else if (data.title) {
                  serviceName = data.title;
                } else if (data.displayName) {
                  serviceName = data.displayName;
                } else if (data.layerName) {
                  serviceName = data.layerName;
                } else if (data.layers && data.layers.length > 0) {
                  const firstLayer = data.layers[0];
                  if (firstLayer.name) {
                    serviceName = firstLayer.name;
                  } else if (firstLayer.title) {
                    serviceName = firstLayer.title;
                  } else if (firstLayer.displayName) {
                    serviceName = firstLayer.displayName;
                  }
                }
              }
            }
            serviceName = sanitizeLayerName(serviceName);
            if (isDirectChildLayer && childLayerId !== null) {
              return {
                name: serviceName,
                type: serviceType,
                description: data.description || data.serviceDescription,
                layers: [
                  {
                    id: childLayerId,
                    name: serviceName,
                    type: "Feature Layer",
                    description: data.description,
                  },
                ],
              };
            }

            return {
              name: serviceName,
              type: serviceType,
              description: data.description || data.serviceDescription,
              layers: data.layers?.map((layer: any) => ({
                id: layer.id,
                name: layer.name,
                type: layer.type || "Feature Layer",
                description: layer.description,
              })),
            };
          }
        } catch (error) {
          console.warn(`Failed to connect to ${endpoint}:`, error);
          continue;
        }
      }

      return null;
    } catch (error) {
      console.error("Error getting service info:", error);
      return null;
    }
  };

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    // Clear service info when URL changes
    setServiceInfo(null);
    setSelectedLayers([]);
    setLayerName("");
  };

  const handleRetrieveLayerInfo = async () => {
    if (!url.trim()) {
      toastError("Please enter a URL");
      return;
    }

    if (!validateUrl(url)) {
      toastError("Please enter a valid URL");
      return;
    }

    setIsRetrievingInfo(true);
    try {
      const info = await getServiceInfo(url);
      if (info) {
        setServiceInfo(info);
        const isDirectChildLayer = /\/(\d+)\/?$/.test(url.trim());
        let childLayerId: number | null = null;

        if (isDirectChildLayer) {
          const match = url.trim().match(/\/(\d+)\/?$/);
          childLayerId = match ? parseInt(match[1]) : null;
        }

        if (info.layers && info.layers.length > 0) {
          if (isDirectChildLayer && childLayerId !== null) {
            setSelectedLayers([childLayerId]);
            updateLayerName([childLayerId]);
          } else if (info.layers.length > 1) {
            setSelectedLayers([-1]);
            updateLayerName([-1]);
          } else {
            setSelectedLayers([info.layers[0].id]);
            updateLayerName([info.layers[0].id]);
          }
        } else {
          setSelectedLayers([]);
          updateLayerName([]);
        }
      } else {
        toastError(
          "Unable to retrieve service information. Please check the URL.",
        );
      }
    } catch (error) {
      console.error("Error retrieving layer info:", error);
      toastError("Failed to retrieve layer information. Please try again.");
    } finally {
      setIsRetrievingInfo(false);
    }
  };

  const createLayerFromUrl = async (): Promise<AppliedLayer | null> => {
    if (!url.trim() || !validateUrl(url)) {
      toastError("Please enter a valid URL");
      return null;
    }

    if (!serviceInfo) {
      toastError(
        "Unable to retrieve service information. Please check the URL.",
      );
      return null;
    }

    try {
      let normalizedUrl = url.trim();
      if (!normalizedUrl.endsWith("/")) {
        normalizedUrl += "/";
      }

      const layerType = serviceInfo.type;
      const hasServiceType = /\/\w+Server\/?$/.test(normalizedUrl);
      const isDirectChildLayer = /\/(\d+)\/?$/.test(normalizedUrl);
      let childLayerId: number | null = null;

      if (isDirectChildLayer) {
        const match = normalizedUrl.match(/\/(\d+)\/?$/);
        childLayerId = match ? parseInt(match[1]) : null;
      }
      if (isDirectChildLayer && childLayerId !== null) {
        const layerId = `web-layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const layerToAdd: AppliedLayer = {
          id: layerId,
          title: layerName || sanitizeLayerName(serviceInfo.name),
          url: url.trim(),
          type: "Feature Layer",
          layerType: "Feature Layer",
          visibility: true,
          popupEnabled: true,
          labelsVisible: true,
          isAddedFromWebMap: true,
          opacity: 1,
        };

        return layerToAdd;
      }

      if (
        selectedLayers.includes(-1) ||
        (serviceInfo.layers &&
          serviceInfo.layers.length > 1 &&
          selectedLayers.length > 1)
      ) {
        const groupLayerId = `web-layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const childLayers: AppliedLayer[] = [];

        if (selectedLayers.includes(-1)) {
          if (serviceInfo.layers) {
            serviceInfo.layers.forEach((layer) => {
              let childLayerUrl = normalizedUrl;
              if (normalizedUrl.includes("FeatureServer")) {
                childLayerUrl = `${normalizedUrl}${layer.id}`;
              } else if (normalizedUrl.includes("MapServer")) {
                childLayerUrl = `${normalizedUrl}${layer.id}`;
              } else if (normalizedUrl.includes("ImageServer")) {
                childLayerUrl = `${normalizedUrl}${layer.id}`;
              } else {
                if (layerType === "Feature Service") {
                  childLayerUrl = `${normalizedUrl}FeatureServer/${layer.id}`;
                } else if (layerType === "Map Service") {
                  childLayerUrl = `${normalizedUrl}MapServer/${layer.id}`;
                } else if (layerType === "Image Service") {
                  childLayerUrl = `${normalizedUrl}ImageServer/${layer.id}`;
                }
              }

              const childLayer: AppliedLayer = {
                id: `web-layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                title: sanitizeLayerName(layer.name),
                url: childLayerUrl,
                type: layerType,
                layerType: layerType,
                visibility: true,
                popupEnabled: true,
                labelsVisible: true,
                isAddedFromWebMap: true,
                parentId: groupLayerId,
                opacity: 1,
              };
              childLayers.push(childLayer);
            });
          }
        } else {
          selectedLayers.forEach((layerId) => {
            const layer = serviceInfo.layers?.find((l) => l.id === layerId);
            if (layer) {
              let childLayerUrl = normalizedUrl;
              if (normalizedUrl.includes("FeatureServer")) {
                childLayerUrl = `${normalizedUrl}${layer.id}`;
              } else if (normalizedUrl.includes("MapServer")) {
                childLayerUrl = `${normalizedUrl}${layer.id}`;
              } else if (normalizedUrl.includes("ImageServer")) {
                childLayerUrl = `${normalizedUrl}${layer.id}`;
              } else {
                if (layerType === "Feature Service") {
                  childLayerUrl = `${normalizedUrl}FeatureServer/${layer.id}`;
                } else if (layerType === "Map Service") {
                  childLayerUrl = `${normalizedUrl}MapServer/${layer.id}`;
                } else if (layerType === "Image Service") {
                  childLayerUrl = `${normalizedUrl}ImageServer/${layer.id}`;
                }
              }

              const childLayer: AppliedLayer = {
                id: `web-layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                title: sanitizeLayerName(layer.name),
                url: childLayerUrl,
                type: layerType,
                layerType: layerType,
                visibility: true,
                popupEnabled: true,
                labelsVisible: true,
                isAddedFromWebMap: true,
                parentId: groupLayerId,
                opacity: 1,
              };
              childLayers.push(childLayer);
            }
          });
        }

        const groupLayer: AppliedLayer = {
          id: groupLayerId,
          title: layerName || sanitizeLayerName(serviceInfo.name),
          url: normalizedUrl,
          type: "GroupLayer",
          layerType: "GroupLayer",
          visibility: true,
          popupEnabled: true,
          labelsVisible: true,
          isAddedFromWebMap: true,
          layers: childLayers,
          opacity: 1,
        };

        return groupLayer;
      } else {
        let layerUrl = normalizedUrl;

        if (
          serviceInfo.layers &&
          serviceInfo.layers.length > 0 &&
          !selectedLayers.includes(-1)
        ) {
          const selectedLayer = serviceInfo.layers.find((layer) =>
            selectedLayers.includes(layer.id),
          );
          if (selectedLayer) {
            if (!hasServiceType) {
              if (layerType === "Feature Service") {
                layerUrl = `${normalizedUrl}FeatureServer/${selectedLayer.id}`;
              } else if (layerType === "Map Service") {
                layerUrl = `${normalizedUrl}MapServer/${selectedLayer.id}`;
              } else if (layerType === "Image Service") {
                layerUrl = `${normalizedUrl}ImageServer/${selectedLayer.id}`;
              }
            }
          }
        } else {
          if (!hasServiceType) {
            if (layerType === "Feature Service") {
              layerUrl = `${normalizedUrl}FeatureServer`;
            } else if (layerType === "Map Service") {
              layerUrl = `${normalizedUrl}MapServer`;
            } else if (layerType === "Image Service") {
              layerUrl = `${normalizedUrl}ImageServer`;
            } else if (layerType === "Vector Tile Service") {
              layerUrl = `${normalizedUrl}VectorTileServer`;
            }
          }
        }

        const layerId = `web-layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const layerToAdd: AppliedLayer = {
          id: layerId,
          title: layerName || sanitizeLayerName(serviceInfo.name),
          url: layerUrl,
          type: layerType,
          layerType: layerType,
          visibility: true,
          popupEnabled: true,
          labelsVisible: true,
          isAddedFromWebMap: true,
          opacity: 1,
        };

        return layerToAdd;
      }
    } catch (error) {
      console.error("Error creating layer:", error);
      return null;
    }
  };

  const handleAddToMap = async () => {
    setIsLoading(true);
    try {
      const layer = await createLayerFromUrl();
      if (layer) {
        // Call handleAddLayer and wait for it to complete
        await handleAddLayer(layer);

        setUrl("");
        setServiceInfo(null);
        setSelectedLayers([]);
        setLayerName("");
        setIsAddLayersMode(false);
      } else {
        toastError("Unexpected error occurred. Please try again.");
      }
    } catch (error) {
      console.error("Error adding layer:", error);
      toastError("Unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative p-3 overflow-y-auto scrollbar-hide">
      {isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center z-50 flex-col gap-2"
          style={{
            background: "rgba(2, 6, 23, 0.48)",
            backdropFilter: "blur(2px)",
          }}
        >
          <Loader2 className="h-5 w-5 animate-spin text-white" />
          <div
            className="text-center"
            style={{
              color: "var(--white-alpha-white, #FFF)",
              fontFeatureSettings: "'ss01' on, 'ss04' on, 'cv01' on",
              textShadow: "0px 1px 2px rgba(0, 0, 0, 0.25)",
              fontFamily: "Inter",
              fontSize: "14px",
              fontStyle: "normal",
              fontWeight: "500",
              lineHeight: "20px",
            }}
          >
            Creating layer
          </div>
        </div>
      )}
      <div className="mb-4">
        <p className="text-[#1E293B] text-[14px] font-medium leading-[20px] font-feature-settings-[ss01_on,ss04_on,cv01_on]">
          Add layers with URL
        </p>
        <p className="text-[#475569] text-[12px] font-normal mb-2 leading-[16px] font-feature-settings-[ss01_on,ss04_on,cv01_on] font-inter">
          Please enter the URL to add layers
        </p>
        <div className="space-y-2">
          <div className="relative">
            <input
              type="url"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://"
              className="bg-white w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading || isRetrievingInfo}
            />
          </div>
          <p className="text-[#475569] text-[12px] font-normal mt-1 leading-[16px] font-feature-settings-[ss01_on,ss04_on,cv01_on] font-inter flex items-center gap-1">
            <Info className="h-3 w-3 text-[#475569]" /> Supported: ArcGIS Server
            Web Service
          </p>
          <button
            onClick={handleRetrieveLayerInfo}
            disabled={
              isLoading || isRetrievingInfo || !url.trim() || !validateUrl(url)
            }
            className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              isLoading || isRetrievingInfo || !url.trim() || !validateUrl(url)
                ? "bg-[#F7F7F7] text-[#D1D1D1] cursor-not-allowed"
                : "bg-[#FA7319] text-white hover:bg-orange-600"
            }`}
          >
            {isRetrievingInfo ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Retrieving Layer Information...
              </div>
            ) : (
              "Retrieve Layer Information"
            )}
          </button>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-[#1E293B] mb-1 text-[14px] font-medium leading-[20px] font-feature-settings-[ss01_on,ss04_on,cv01_on]">
          Select layers type
        </p>
        <div className="grid grid-cols-1 gap-2">
          {layerTypes.map((layerType) => (
            <div key={layerType.id}>
              <button
                onClick={() => {
                  if (layerType.active) {
                    setSelectedLayerType(layerType.id);
                    toggleLayerType(layerType.id);
                  }
                }}
                className={`w-full flex items-center justify-between transition-all ${
                  layerType.active
                    ? selectedLayerType === layerType.id
                      ? "bg-blue-50 border-blue-300 shadow-sm"
                      : "bg-white hover:bg-gray-50"
                    : "bg-gray-50 cursor-not-allowed"
                }`}
                style={{
                  display: "flex",
                  padding: "12px",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "4px",
                  borderRadius: "4px",
                  background: "var(--white-alpha-white, #FFF)",
                  alignSelf: "stretch",
                }}
                disabled={!layerType.active}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-full border-2 flex items-center justify-center ${
                        selectedLayerType === layerType.id && layerType.active
                          ? "border-[#FA7319] bg-[#FA7319]"
                          : "border-gray-300"
                      }`}
                      style={{
                        width: "16px",
                        height: "16px",
                      }}
                    >
                      {selectedLayerType === layerType.id &&
                        layerType.active && (
                          <div
                            className="bg-white rounded-full"
                            style={{
                              width: "6px",
                              height: "6px",
                            }}
                          />
                        )}
                    </div>
                    <div
                      className="text-sm font-medium"
                      style={{
                        color: "var(--New-Gray-New-Gray-800, #1E293B)",
                        fontSize: "12px",
                        fontStyle: "normal",
                        fontWeight: "400",
                        lineHeight: "16px",
                      }}
                    >
                      {layerType.name}
                    </div>
                  </div>
                  {layerType.active && (
                    <div className="flex items-center gap-2">
                      {expandedLayerTypes[layerType.id] ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  )}
                </div>

                {expandedLayerTypes[layerType.id] && layerType.active && (
                  <div className="w-full pt-2 text-xs text-gray-600">
                    {layerType.id === "arcgis_server" && (
                      <div className="space-y-1">
                        <p className="text-left leading-relaxed">
                          • Feature Services - Point, line, and polygon features
                          with attributes
                        </p>
                        <p className="text-left leading-relaxed">
                          • Map Services - Raster and vector map layers
                        </p>
                        <p className="text-left leading-relaxed">
                          • Image Services - Satellite and aerial imagery
                        </p>
                        <p className="text-left leading-relaxed">
                          • Vector Tile Services - Styled vector tiles
                        </p>
                      </div>
                    )}
                    {layerType.id === "geojson" && (
                      <p className="text-left leading-relaxed">
                        Coming soon - Support for GeoJSON web services
                      </p>
                    )}
                    {layerType.id === "kml" && (
                      <p className="text-left leading-relaxed">
                        Coming soon - Support for KML/KMZ web services
                      </p>
                    )}
                    {layerType.id === "ogc_wms" && (
                      <p className="text-left leading-relaxed">
                        Coming soon - Support for OGC Web Map Services
                      </p>
                    )}
                    {layerType.id === "ogc_wfs" && (
                      <p className="text-left leading-relaxed">
                        Coming soon - Support for OGC Web Feature Services
                      </p>
                    )}
                  </div>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {serviceInfo && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md max-h-[200px] overflow-y-auto">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            Service Information
          </h4>
          <div className="text-xs text-blue-800 space-y-1">
            <p>
              <strong>Name:</strong> {serviceInfo.name}
            </p>
            <p>
              <strong>Type:</strong> {serviceInfo.type}
            </p>
            {serviceInfo.description && (
              <p>
                <strong>Description:</strong>{" "}
                <div
                  className="mt-1 text-xs text-blue-800"
                  dangerouslySetInnerHTML={{ __html: serviceInfo.description }}
                />
              </p>
            )}
            {serviceInfo.layers && serviceInfo.layers.length > 1 && (
              <p>
                <strong>Layers:</strong> {serviceInfo.layers.length} available
              </p>
            )}
            {serviceInfo.layers && serviceInfo.layers.length === 1 && (
              <p>
                <strong>Layer:</strong> {serviceInfo.layers[0].name}
              </p>
            )}
          </div>
        </div>
      )}

      {serviceInfo?.layers &&
        serviceInfo.layers.length > 1 &&
        !/\/(\d+)\/?$/.test(url.trim()) && (
          <div className="mb-4">
            <div className="mb-2">
              <label className="text-[13px] font-medium text-[#1E293B]">
                Group Layers
              </label>
              <div className="text-xs text-gray-500 mt-1">
                All layers will be added as a group layer
              </div>
            </div>

            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md bg-gray-50">
              {serviceInfo.layers.map((layer) => (
                <div
                  key={layer.id}
                  className="flex items-center px-3 py-2 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {layer.name}
                    </div>
                    <div className="text-xs text-gray-500">{layer.type}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {serviceInfo?.layers &&
        serviceInfo.layers.length === 1 &&
        /\/(\d+)\/?$/.test(url.trim()) && (
          <div className="mb-4">
            <div className="mb-2">
              <label className="text-[13px] font-medium text-[#1E293B]">
                Selected Layer
              </label>
              <div className="text-xs text-gray-500 mt-1">
                This specific layer will be added to the map
              </div>
            </div>

            <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {serviceInfo.layers[0].name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {serviceInfo.layers[0].type}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      <div className="mb-4">
        <label className="block text-[13px] font-medium text-[#1E293B] mb-2">
          Layer Name
        </label>
        <input
          type="text"
          value={layerName}
          onChange={(e) => setLayerName(e.target.value)}
          placeholder="Enter a name for this layer"
          className="bg-white w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <button
        onClick={handleAddToMap}
        disabled={isLoading || !url.trim() || !serviceInfo}
        className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${
          isLoading || !url.trim() || !serviceInfo
            ? "bg-[#F7F7F7] text-[#D1D1D1] cursor-not-allowed"
            : "bg-[#FA7319] text-white hover:bg-orange-600"
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {serviceInfo?.type === "Map Service"
              ? "Adding Map Service..."
              : "Adding Layer..."}
          </div>
        ) : (
          "Add to Map"
        )}
      </button>

      {url.trim() && !serviceInfo && !isRetrievingInfo && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-xs text-yellow-800">
            Click "Retrieve Layer Information" to fetch service details after
            entering a valid URL.
          </p>
        </div>
      )}
    </div>
  );
};

export default AddWebLayers;
