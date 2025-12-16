import esriConfig from "@arcgis/core/config";
import { Extent } from "@arcgis/core/geometry";
import Point from "@arcgis/core/geometry/Point";
import MapView from "@arcgis/core/views/MapView";
import WebMap from "@arcgis/core/WebMap";
import Legend from "@arcgis/core/widgets/Legend";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getWebMap, reverseGeocode } from "../api";
import LayerDetailsPopover from "../components/LayerDetailsPopover";
import { InitialLoadingCircle } from "../components/Loaders/MapLoaders";
import MapLoadingOverlay from "../components/MapLoadingOverlay";
import { DEFAULT_PIN_NOTE_TITLE } from "../constants/pins";
import { mapConstants } from "../constants/mapConstants";
import { useMapLayers } from "../hooks/useMapLayers";
import { getMarker, getMarkerPoint, isDifferentEnough } from "../lib/mapHelper";
import { MapTools } from "../ui-new/components/map";
import PinNotePopover from "../components/PinNotePopover";
import { AppliedLayer, MapOperation, WebMapData } from "../schema";
import { useMapStore } from "../store/useMapStore";
import type { PinType } from "../types/operations";
import {
  initializeMapActionsController,
  getMapActionsController,
} from "../utils/map-actions-controller";
import { usePinSocketOperations } from "../hooks/usePinSocketOperations";

const API_KEY = import.meta.env.VITE_ARCGIS_API_KEY;
const DEFAULT_WEBMAP_ID = import.meta.env.VITE_DEFAULT_WEBMAP_ID;

const isGraphicHitResult = (
  result: __esri.HitTestResult["results"][number],
): result is __esri.HitTestResult["results"][number] & {
  graphic: __esri.Graphic;
} => {
  return (
    typeof (result as { graphic?: __esri.Graphic }).graphic !== "undefined"
  );
};

const MapViewComponent = () => {
  const [view, setView] = useState<MapView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [legend] = useState<Legend | null>(null);
  const { setLayers, setMapKeyWidget, setMapView, setMapReady, isMapReady } =
    useMapStore();
  const [history, setHistory] = useState<
    Array<{ center: __esri.Point; zoom: number }>
  >([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const ignoreNextViewChange = useRef(false);
  const currentStepRef = useRef(currentStep);
  // const [mapState, setMapState] = useState({ latitude: 0, longitude: 0 });
  const [isCurrentGeo, setCurrentGeo] = useState(false);
  const {
    pins,
    removeAllPins: removeAllPinsFromStore,
    removePin: removePinFromStore,
    updatePinNote,
  } = useMapStore();
  const pinCount = pins.length;
  const { sendAddPinMessage, sendRemovePinMessage, sendRemoveAllPinsMessage } =
    usePinSocketOperations();
  const [activePinId, setActivePinId] = useState<string | null>(null);
  const [pinNoteDraft, setPinNoteDraft] = useState("");
  const [pinTitleDraft, setPinTitleDraft] = useState(DEFAULT_PIN_NOTE_TITLE);
  const [pinScreenPosition, setPinScreenPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isPinNoteEditing, setIsPinNoteEditing] = useState(false);
  const pinsRef = useRef<PinType[]>([]);
  const activePin = useMemo(() => {
    if (!activePinId) return null;
    return pins.find((pin) => pin.id === activePinId) ?? null;
  }, [pins, activePinId]);

  const updatePinScreenPosition = useCallback(
    (pin: PinType | null) => {
      if (!view || !pin) {
        setPinScreenPosition(null);
        return;
      }

      const point = new Point({
        longitude: pin.longitude,
        latitude: pin.latitude,
        spatialReference: { wkid: 4326 },
      });

      const screenPoint = view.toScreen(point);
      if (screenPoint) {
        setPinScreenPosition({ x: screenPoint.x, y: screenPoint.y });
      } else {
        setPinScreenPosition(null);
      }
    },
    [view],
  );

  const mapDiv = useRef<HTMLDivElement | null>(null);

  const {
    data: webMapData,
    isLoading: isWebMapLoading,
    isError,
  } = useQuery<WebMapData>({
    queryKey: ["webMap"],
    queryFn: getWebMap,
    staleTime: 60000,
  });

  const { isMapLoading } = useMapLayers({
    view,
  });

  const handleMapOperation = (operation: MapOperation) => {
    if (!view) return;

    switch (operation) {
      case "UNDO":
        if (history.length > 0) handleUndo();
        break;
      case "REDO":
        if (history.length > 0) handleRedo();
        break;
      case "LOCATION":
        handleCurrentLocation();
        break;
      case "HOME":
        handleHome();
        break;
      case "ZOOM_IN":
        handleZoomIn();
        break;
      case "ZOOM_OUT":
        handleZoomOut();
        break;
      default:
        break;
    }
  };

  const handlePinNoteSave = useCallback(
    ({ note: rawNote, title: rawTitle }: { note: string; title: string }) => {
      if (!activePin) return;

      const trimmedNote = rawNote.trim();
      const trimmedTitle =
        rawTitle.trim().length > 0 ? rawTitle.trim() : DEFAULT_PIN_NOTE_TITLE;
      const existingNote = (activePin.note || "").trim();
      const existingTitle =
        activePin.title && activePin.title.trim().length > 0
          ? activePin.title.trim()
          : DEFAULT_PIN_NOTE_TITLE;

      if (existingNote !== trimmedNote || existingTitle !== trimmedTitle) {
        updatePinNote(activePin.id, {
          note: trimmedNote,
          title: trimmedTitle,
        });
      }

      setPinNoteDraft(trimmedNote);
      setPinTitleDraft(trimmedTitle);
      setIsPinNoteEditing(false);
    },
    [activePin, updatePinNote],
  );

  const handleRemoveActivePin = useCallback(async () => {
    if (!activePin) return;

    // Calculate remaining pins after removal
    const remainingPins = pins.filter((p) => p.id !== activePin.id);

    // Send socket message with updated context before removing
    await sendRemovePinMessage([activePin.id], remainingPins);

    removePinFromStore(activePin.id);
    setActivePinId(null);
  }, [activePin, pins, removePinFromStore, sendRemovePinMessage]);

  useEffect(() => {
    if (view && legend) {
      try {
        legend.render();
      } catch (error) {
        console.error("Error rendering legend:", error);
      }
    }
  }, [view, legend]);

  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  useEffect(() => {
    pinsRef.current = pins;
  }, [pins]);

  // Watch for new pins and send socket messages
  const prevPinsRef = useRef<PinType[]>([]);
  useEffect(() => {
    const prevPins = prevPinsRef.current;
    const currentPins = pins;

    // Find newly added pins
    const newPins = currentPins.filter(
      (pin) => !prevPins.find((p) => p.id === pin.id),
    );

    // Send socket message for each newly added pin (only if from user interaction)
    newPins.forEach((pin) => {
      // Only send if pin was added from pin & note tools (not from socket operations)
      // Check the _source property (internal flag)
      const pinWithSource = pin as PinType & { _source?: "user" | "socket" };
      if (pinWithSource._source !== "socket") {
        // Pass the current pins array to ensure up-to-date context
        sendAddPinMessage(pin, currentPins);
      }
    });

    prevPinsRef.current = currentPins;
  }, [pins, sendAddPinMessage]);

  useEffect(() => {
    if (activePin) {
      const rawNote = activePin.note || "";
      const trimmedNote = rawNote.trim();
      const rawTitle = activePin.title || "";
      const trimmedTitle = rawTitle.trim();
      const currentTitle =
        trimmedTitle.length > 0 ? trimmedTitle : DEFAULT_PIN_NOTE_TITLE;
      const shouldAutoEdit =
        trimmedNote.length === 0 &&
        (trimmedTitle.length === 0 || trimmedTitle === DEFAULT_PIN_NOTE_TITLE);

      setPinNoteDraft(rawNote);
      setPinTitleDraft(currentTitle);
      setIsPinNoteEditing(shouldAutoEdit);
      updatePinScreenPosition(activePin);
    } else {
      setPinNoteDraft("");
      setPinTitleDraft(DEFAULT_PIN_NOTE_TITLE);
      setIsPinNoteEditing(false);
      setPinScreenPosition(null);
    }
  }, [activePin, updatePinScreenPosition]);

  useEffect(() => {
    if (!view || !activePin) return;

    const updatePosition = () => updatePinScreenPosition(activePin);

    updatePosition();
    const extentWatcher = view.watch("extent", updatePosition);
    const stationaryWatcher = view.watch("stationary", updatePosition);
    const zoomWatcher = view.watch("zoom", updatePosition);

    return () => {
      extentWatcher?.remove();
      stationaryWatcher?.remove();
      zoomWatcher?.remove();
    };
  }, [view, activePin, updatePinScreenPosition]);

  useEffect(() => {
    if (activePinId && !pins.some((pin) => pin.id === activePinId)) {
      setActivePinId(null);
    }
  }, [pins, activePinId]);

  useEffect(() => {
    const layersData = webMapData?.operationalLayers;
    if (layersData) {
      const visibilityLayers: AppliedLayer[] = layersData.map((layer: any) => ({
        id: layer.id,
        title: layer.title,
        layerType: layer.layerType || layer.type,
        url: layer.url,
        visibility: layer.visibility ?? true,
        popupEnabled: layer.popupEnabled ?? true,
        labelsVisible: layer.labelsVisible ?? true,
        itemId: layer.itemId,
        isAddedFromWebMap: true,
        minScale: layer.minScale,
        opacity: layer.opacity ?? 1,
        layers: layer.layers?.map((child: any) => ({
          id: child.id,
          itemId: child.itemId,
          title: child.title,
          layerType: child.layerType || child.type,
          url: child.url,
          isAddedFromWebMap: true,
          visibility: child.visibility ?? false,
          sublayerId: child.sublayerId,
          popupEnabled: child.popupEnabled ?? true,
          labelsVisible: child.labelsVisible ?? true,
          minScale: child.minScale,
          opacity: child.opacity ?? 1,
        })),
      }));

      // Restore user-added layers from localStorage
      import("../utils/layerStorage").then(({ getUserLayers, storedLayersToApplied }) => {
        const savedLayers = getUserLayers();
        if (savedLayers.length > 0) {
          const restoredLayers = storedLayersToApplied(savedLayers);
          // Filter out any layers that are already in webMapData (by URL)
          const webMapUrls = new Set(visibilityLayers.map(l => l.url).filter(Boolean));
          const uniqueRestoredLayers = restoredLayers.filter(l => !webMapUrls.has(l.url));

          if (uniqueRestoredLayers.length > 0) {
            console.log(`[MapView] Restoring ${uniqueRestoredLayers.length} user-added layers from localStorage`);
            setLayers([...visibilityLayers, ...uniqueRestoredLayers]);
            return;
          }
        }
        setLayers(visibilityLayers);
      });
    }
  }, [webMapData, setLayers]);

  useEffect(() => {
    if (!API_KEY) {
      setError(
        "ArcGIS API key is missing. Please set VITE_ARCGIS_API_KEY in your .env file.",
      );
      return;
    }
    if (!DEFAULT_WEBMAP_ID) {
      setError(
        "Default WebMap ID is missing. Please set VITE_DEFAULT_WEBMAP_ID in your .env file.",
      );
      return;
    }
    if (!mapDiv.current || isWebMapLoading || !webMapData) return;
    if (isError) {
      setError(
        "Failed to load web map data. Please check your API and network.",
      );
      return;
    }
    setError(null);
    esriConfig.apiKey = API_KEY;

    const defaultMap = new WebMap({
      portalItem: {
        id: DEFAULT_WEBMAP_ID,
      },
    });

    const newView = new MapView({
      container: mapDiv.current,
      map: defaultMap,
      extent: webMapData.initialState?.viewpoint?.targetGeometry
        ? new Extent(webMapData.initialState.viewpoint.targetGeometry)
        : new Extent(mapConstants.HOME_EXTENT),
      constraints: {
        minZoom: mapConstants.MIN_ZOOM,
        maxZoom: mapConstants.MAX_ZOOM,
      },
      ui: { components: [] },
      popup: {
        dockEnabled: true,
        dockOptions: {
          buttonEnabled: false,
          breakpoint: false,
        },
        visibleElements: {
          featureNavigation: true,
          closeButton: true,
        },
      },
    });
    const legend = new Legend({
      view: newView,
    });

    newView.when(
      () => {
        newView.ui.add(legend, "bottom-left");
        newView.ui.remove(legend);
        setMapKeyWidget(legend);
        setMapView(newView);
        setMapReady(true);
        console.log(
          "MapView initialized at",
          new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        );
      },
      (err: any) => {
        console.error("MapView failed to load:", err);
        setError("Failed to initialize map view. Please try again.");
      },
    );
    newView.watch("stationary", (isStationary) => {
      if (isStationary) {
        handleViewChange(newView);
      }
    });

    setView(newView);

    return () => {
      newView.destroy();
      setMapKeyWidget(null);
      setMapView(null);
    };
  }, [isWebMapLoading, isError, setMapKeyWidget, setMapView]);

  useEffect(() => {
    if (view) {
      initializeMapActionsController(view!);
    }
  }, [view]);

  useEffect(() => {
    if (!view) return;

    const handleClick = async (event: __esri.ViewClickEvent) => {
      const controller = getMapActionsController();
      if (controller?.isPinPlacementActive?.()) {
        return;
      }

      try {
        const hit = await view.hitTest(event);
        const target = hit.results.find((result) => {
          if (!isGraphicHitResult(result)) {
            return false;
          }

          const graphicId = result.graphic?.attributes?.id;
          if (!graphicId) {
            return false;
          }

          return pinsRef.current.some((pin) => pin.id === String(graphicId));
        });

        if (
          target &&
          isGraphicHitResult(target) &&
          target.graphic?.attributes?.id
        ) {
          setActivePinId(String(target.graphic.attributes.id));
        } else {
          setActivePinId(null);
        }
      } catch (clickError) {
        console.error("Error handling pin selection:", clickError);
      }
    };

    const clickHandle = view.on("click", handleClick);

    return () => {
      clickHandle.remove();
    };
  }, [view]);

  const handleViewChange = (mapView: MapView) => {
    if (ignoreNextViewChange.current) {
      ignoreNextViewChange.current = false;
      return;
    }
    const center = mapView.center.clone();
    const zoom = mapView.zoom;

    setHistory((prev) => {
      if (prev.length === 0) {
        return [{ center, zoom }];
      }

      const last = prev[prev.length - 1];
      if (!isDifferentEnough(last.center, center) && last.zoom === zoom) {
        return prev;
      }

      const newHistory = prev.slice(0, currentStepRef.current + 1);
      newHistory.push({ center, zoom });
      if (newHistory.length > 50) {
        newHistory.shift();
      }

      return newHistory;
    });

    setCurrentStep((prev) => Math.min(prev + 1, 49));
  };

  const handleUndo = () => {
    if (!view || currentStep <= 0) {
      return;
    }

    const prevState = history[currentStep - 1];
    ignoreNextViewChange.current = true;

    view.goTo({
      center: prevState.center,
      zoom: prevState.zoom,
    });

    setCurrentStep((s) => s - 1);
  };

  const handleRedo = () => {
    if (!view || currentStep >= history.length - 1) {
      return;
    }

    const nextState = history[currentStep + 1];
    ignoreNextViewChange.current = true;

    view.goTo({
      center: nextState.center,
      zoom: nextState.zoom,
    });

    setCurrentStep((s) => s + 1);
  };

  const handleCurrentLocation = () => {
    if (isCurrentGeo) {
      setCurrentGeo(false);
      view?.graphics.removeAll();
      if (view?.center) {
        const currentCenter = view.center.clone();
        if (
          currentCenter?.latitude != null &&
          currentCenter?.longitude != null
        ) {
          currentCenter.latitude += 0.0001;
          currentCenter.longitude += 0.0001;
        }
        view.goTo(currentCenter);
      }
      return;
    }
    if (!view) return;
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentGeo(true);
          // setMapState({ latitude: latitude, longitude: longitude });
          const data: any = await reverseGeocode(latitude, longitude);
          try {
            const point = getMarkerPoint({
              x: longitude,
              y: latitude,
              wkid: 4326,
            });
            const marker = getMarker(
              point,
              data?.address?.Match_addr,
              longitude,
              latitude,
              false,
              [0, 0, 255],
            );
            view.graphics.removeAll();
            view.graphics.add(marker);
            view
              .goTo({
                center: [longitude, latitude],
                zoom: 11,
              })
              .then(() => {});
          } catch (error) {
            console.error(error);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          alert("Unable to get your location. Please check permissions.");
        },
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const handleHome = () => {
    if (!view) return;

    const homeExtent = webMapData?.initialState?.viewpoint?.targetGeometry
      ? new Extent(webMapData.initialState.viewpoint.targetGeometry)
      : new Extent(mapConstants.HOME_EXTENT);

    view.goTo(homeExtent);
  };

  const handleZoomIn = () => {
    if (view && canZoomIn) {
      view.goTo({
        zoom: view.zoom + 1,
      });
    }
  };

  const handleZoomOut = () => {
    if (view && canZoomOut) {
      view.goTo({
        zoom: view.zoom - 1,
      });
    }
  };

  // Pin management handlers
  const handleAddPin = () => {
    if (!view) return;

    try {
      const controller = getMapActionsController();
      controller.setPinMode();
    } catch (error) {
      console.error("Error setting pin mode:", error);
    }
  };

  const handleViewAllPins = async () => {
    if (!view || pins.length === 0) {
      return;
    }

    const validPins = pins.filter(
      (pin) =>
        typeof pin.longitude === "number" && typeof pin.latitude === "number",
    );

    if (validPins.length === 0) {
      return;
    }

    try {
      if (validPins.length === 1) {
        const [pin] = validPins;
        const targetZoom = Math.min(
          mapConstants.MAX_ZOOM,
          Math.max(
            view.zoom ?? mapConstants.FIND_PLACE_ZOOM,
            mapConstants.FIND_PLACE_ZOOM,
          ),
        );

        await view.goTo(
          {
            center: [pin.longitude, pin.latitude],
            zoom: targetZoom,
          },
          { duration: 800 },
        );
        return;
      }

      const longitudes = validPins.map((pin) => pin.longitude);
      const latitudes = validPins.map((pin) => pin.latitude);

      const extent = new Extent({
        xmin: Math.min(...longitudes),
        xmax: Math.max(...longitudes),
        ymin: Math.min(...latitudes),
        ymax: Math.max(...latitudes),
        spatialReference: { wkid: 4326 },
      });

      const widthPadding = extent.width === 0 ? 0.01 : extent.width * 0.1;
      const heightPadding = extent.height === 0 ? 0.01 : extent.height * 0.1;

      const paddedExtent = new Extent({
        xmin: extent.xmin - widthPadding,
        xmax: extent.xmax + widthPadding,
        ymin: extent.ymin - heightPadding,
        ymax: extent.ymax + heightPadding,
        spatialReference: extent.spatialReference,
      });

      await view.goTo(paddedExtent, { duration: 800, easing: "ease-in-out" });
    } catch (error) {
      console.error("Error zooming to pins:", error);
    }
  };

  const handleRemoveAllPins = async () => {
    if (pins.length === 0) {
      return;
    }

    removeAllPinsFromStore();
    await sendRemoveAllPinsMessage();
  };

  const canUndo = currentStep > 0;
  const canRedo = currentStep < history.length - 1;
  const currentZoom = view?.zoom ?? mapConstants.INITIAL_ZOOM;
  const canZoomIn = currentZoom < mapConstants.MAX_ZOOM;
  const canZoomOut = currentZoom > mapConstants.MIN_ZOOM;

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-[400px] text-red-600 bg-red-50 border border-red-200 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden rounded-[8px] bg-white border-[#E2E8F0]">
      <div className="relative w-full h-full overflow-hidden">
        <div
          ref={mapDiv}
          className="w-full h-full rounded-[8px] overflow-hidden"
        />
        <MapLoadingOverlay
          isLoading={!isMapReady || isWebMapLoading || isMapLoading}
          message={!isMapReady ? "Initializing map..." : "Loading layers..."}
        />
        <LayerDetailsPopover />
        {activePin && pinScreenPosition && (
          <PinNotePopover
            position={pinScreenPosition}
            title={pinTitleDraft}
            note={pinNoteDraft}
            isEditing={isPinNoteEditing}
            onTitleChange={setPinTitleDraft}
            onNoteChange={setPinNoteDraft}
            onNoteSave={handlePinNoteSave}
            onRequestEdit={() => setIsPinNoteEditing(true)}
            onRequestRemove={handleRemoveActivePin}
            onDismiss={() => setActivePinId(null)}
          />
        )}
      </div>
      <MapTools
        onOperation={handleMapOperation}
        canUndo={canUndo}
        canRedo={canRedo}
        canZoomIn={canZoomIn}
        canZoomOut={canZoomOut}
        isCurrentGeo={isCurrentGeo}
        view={view}
        onAddPin={handleAddPin}
        onViewAllPins={handleViewAllPins}
        onRemoveAllPins={handleRemoveAllPins}
        pinCount={pinCount}
      />
      {(isWebMapLoading || isMapLoading) && <InitialLoadingCircle />}
    </div>
  );
};

export default MapViewComponent;
