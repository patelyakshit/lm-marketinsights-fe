import type {
  SidecarBlockType,
  SidecarCardType,
  TextBlockType,
} from "../../../../types/artifacts";
import type { Geometry } from "@arcgis/core/geometry";
import * as geodesicBufferOperator from "@arcgis/core/geometry/operators/geodesicBufferOperator.js";
import Point from "@arcgis/core/geometry/Point.js";
import SpatialReference from "@arcgis/core/geometry/SpatialReference.js";
import Graphic from "@arcgis/core/Graphic";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Map from "@arcgis/core/Map.js";
import MapView from "@arcgis/core/views/MapView.js";
import { useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import { TextBlock } from "./TextBlock";

interface SidecarBlockProps {
  block: SidecarBlockType;
}

export const SidecarBlock = ({ block }: SidecarBlockProps) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapViewRef = useRef<MapView | null>(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [mapReady, setMapReady] = useState(false);

  console.log("🎬 SidecarBlock rendering", {
    mapRef: mapRef.current,
    mapViewRef: mapViewRef.current,
  });

  const onInView = (index: number) => {
    console.log("👁️ callback called for index", index);
    setActiveCardIndex(index);
  };

  useEffect(() => {
    if (!mapRef.current) {
      console.warn("❌ mapRef.current is null, waiting...");
      return;
    }

    if (mapViewRef.current) {
      console.log("⏭️ Map already initialized, skipping");
      return;
    }

    try {
      const featureLayers = block.payload.map_config.layers.map((layerInfo) => {
        return new FeatureLayer({
          portalItem: {
            id: layerInfo.layer_id,
          },
          visible: layerInfo.visible,
        });
      });

      let buffer2Geometry: Geometry | null = null;
      const graphicsLayer = new GraphicsLayer({ title: "Buffer Graphics" });

      const map = new Map({
        basemap: block.payload.map_config.base_style,
        layers: [...featureLayers, graphicsLayer],
      });

      const view = new MapView({
        container: mapRef.current,
        map: map,
        center: [
          block.payload.map_config.initial_map_state.longitude,
          block.payload.map_config.initial_map_state.latitude,
        ],
        zoom: block.payload.map_config.initial_map_state.zoom,
      });

      const createBuffer = async () => {
        // Load the operator if not already loaded
        if (!geodesicBufferOperator.isLoaded()) {
          await geodesicBufferOperator.load();
        }

        const centerPoint = new Point({
          x: block.payload.map_config.initial_map_state.longitude,
          y: block.payload.map_config.initial_map_state.latitude,
          spatialReference: SpatialReference.WGS84,
        });

        // Use the new operator to create buffers
        const buffer = geodesicBufferOperator.execute(centerPoint, 1, {
          unit: "miles",
        });

        const buffer2 = geodesicBufferOperator.execute(centerPoint, 2, {
          unit: "miles",
        });

        buffer2Geometry = buffer2 as Geometry;

        const bufferGraphic = new Graphic({
          geometry: buffer,
          symbol: {
            type: "simple-fill",
            color: [227, 139, 79, 0.5],
            outline: {
              color: [255, 255, 255, 255],
              width: 2,
            },
          },
        });

        const bufferGraphic2 = new Graphic({
          geometry: buffer2,
          symbol: {
            type: "simple-fill",
            color: [227, 139, 79, 0.5],
            outline: {
              color: [255, 255, 255, 255],
              width: 2,
            },
          },
        });

        const centerPointGraphic = new Graphic({
          geometry: centerPoint,
          symbol: {
            type: "simple-marker",
            style: "circle",
            color: [227, 139, 79, 1],
            size: 12,
            outline: {
              color: [255, 255, 255, 1],
              width: 2,
            },
          },
        });

        const label1Mile = new Graphic({
          geometry: new Point({
            x: block.payload.map_config.initial_map_state.longitude + 0.01,
            y: block.payload.map_config.initial_map_state.latitude + 0.005,
            spatialReference: SpatialReference.WGS84,
          }),
          symbol: {
            type: "text",
            text: "1 mile",
            color: [255, 255, 255, 1],
            font: {
              size: 14,
              weight: "bold",
            },
            haloColor: [0, 0, 0, 0.8],
            haloSize: 2,
          },
        });

        const label2Mile = new Graphic({
          geometry: new Point({
            x: block.payload.map_config.initial_map_state.longitude + 0.02,
            y: block.payload.map_config.initial_map_state.latitude + 0.01,
            spatialReference: SpatialReference.WGS84,
          }),
          symbol: {
            type: "text",
            text: "2 miles",
            color: [255, 255, 255, 1],
            font: {
              size: 14,
              weight: "bold",
            },
            haloColor: [0, 0, 0, 0.8],
            haloSize: 2,
          },
        });

        graphicsLayer.add(label1Mile);
        graphicsLayer.add(label2Mile);
        graphicsLayer.add(bufferGraphic);
        graphicsLayer.add(bufferGraphic2);
        graphicsLayer.add(centerPointGraphic);
      };

      view.when(() => {
        console.log("✅ Sidecar map loaded successfully");
        console.log("📊 Number of layers:", map.layers.length);

        map.layers.forEach((layer, index) => {
          console.log(`📌 Sidecar Layer ${index}:`, {
            title: layer.title,
            id: layer.id,
            portalItemId: (layer as any).portalItem?.id,
          });
        });

        setMapReady(true);
        createBuffer();

        view.goTo({
          target: buffer2Geometry,
          // zoom: 14,
          duration: 1000,
        });
      });

      mapViewRef.current = view;

      return () => {
        console.log("🧹 Cleaning up map");
        if (view) {
          view.destroy();
        }
        mapViewRef.current = null;
      };
    } catch (error) {
      console.error("❌ Error initializing map:", error);
    }
  }, [block.payload.map_config]);

  useEffect(() => {
    const view = mapViewRef.current;
    const card = block.payload.cards[activeCardIndex];

    console.log("Active card", card);

    if (!view || !view.map || !card) {
      return;
    }

    const command = card.map_command;
    if (command && command.type === "TOGGLE_LAYER") {
      const visibleId = command.payload.layer_id;

      view.map.layers.forEach((layer: any) => {
        const layerConfig = block.payload.map_config.layers.find(
          (l) => l.layer_id === layer.portalItem?.id,
        );

        if (layerConfig) {
          layer.visible = layerConfig.layer_id === visibleId;
        }
      });
    }
  }, [activeCardIndex, block.payload.cards, block.payload.map_config.layers]);

  return (
    <div className="relative w-full h-[600px] rounded-lg overflow-hidden">
      <div
        ref={mapRef}
        className="absolute inset-0 w-full h-full bg-gray-900"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent pointer-events-none" />

      <div className="absolute left-0 top-0 bottom-0 w-full md:w-1/2 lg:w-2/5 overflow-y-auto p-6 space-y-4">
        {block.payload.cards.map((card, index) => (
          <ObservedCard
            key={card.id}
            card={card}
            index={index}
            onInView={onInView}
            isActive={activeCardIndex === index}
          />
        ))}
      </div>

      <div className="absolute bottom-4 left-6 flex gap-2">
        {block.payload.cards.map((_, index) => (
          <button
            key={index}
            onClick={() => onInView(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              activeCardIndex === index
                ? "bg-neutral-500 w-6"
                : "bg-neutral-400 hover:bg-neutral-500"
            }`}
            aria-label={`Go to card ${index + 1}`}
          />
        ))}
      </div>

      {!mapReady && (
        <div className="absolute top-4 right-4 bg-yellow-500 text-black px-3 py-1 rounded text-sm">
          Map Loading...
        </div>
      )}
    </div>
  );
};

interface ObservedCardProps {
  card: SidecarCardType;
  index: number;
  onInView: (index: number) => void;
  isActive: boolean;
}

const ObservedCard = ({
  card,
  index,
  onInView,
  isActive,
}: ObservedCardProps) => {
  const { ref, inView } = useInView({
    threshold: 0.5,
    triggerOnce: false,
  });

  useEffect(() => {
    if (inView) {
      onInView(index);
    }
  }, [inView, index, onInView]);

  return (
    <div
      ref={ref}
      className={`bg-white/95 backdrop-blur-sm rounded-md p-6 shadow-md transition-all duration-300 ${
        isActive ? "ring-2 ring-neutral-500 scale-[1.02]" : "opacity-70"
      }`}
    >
      <SidecarCard card={card} />
    </div>
  );
};

interface SidecarCardProps {
  card: SidecarCardType;
}

export const SidecarCard = ({ card }: SidecarCardProps) => {
  const renderCard = () => {
    switch (card.type) {
      case "text":
        return <TextBlock block={card as TextBlockType} />;
      default:
        return null;
    }
  };

  return <div className="w-full h-full">{renderCard()}</div>;
};
