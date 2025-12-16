import type { MapBlockType } from "../../../../types/artifacts";
import { Point, SpatialReference } from "@arcgis/core/geometry";
import Graphic from "@arcgis/core/Graphic";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Map from "@arcgis/core/Map.js";
import MapView from "@arcgis/core/views/MapView.js";
import { useEffect, useRef } from "react";

interface MapBlockProps {
  block: MapBlockType;
}

export const MapBlock = ({ block }: MapBlockProps) => {
  console.log("map block", block);

  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mapRef.current) {
      const featureLayers = block.payload.layers.map((layerInfo) => {
        return new FeatureLayer({
          portalItem: {
            id: layerInfo.layer_id,
          },
        });
      });

      const graphicsLayer = new GraphicsLayer({ title: "Buffer Graphics" });

      const centerPoint = new Point({
        x: block.payload.initial_map_state.longitude,
        y: block.payload.initial_map_state.latitude,
        spatialReference: SpatialReference.WGS84,
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

      graphicsLayer.graphics.addMany([centerPointGraphic]);

      const map = new Map({
        basemap: block.payload.base_style,
        layers: [...featureLayers, graphicsLayer],
      });

      const view = new MapView({
        container: mapRef.current,
        map: map,
        center: [
          block.payload.initial_map_state.longitude,
          block.payload.initial_map_state.latitude,
        ],
        zoom: block.payload.initial_map_state.zoom,
      });

      view.when(async () => {
        console.log("Map view loaded successfully");
        console.log("Number of layers:", map.layers.length);

        map.layers.forEach((layer, index) => {
          console.log(`Layer ${index} loaded:`, layer.title);
          layer.visible = true;
        });
      });

      return () => {
        if (view) {
          view.destroy();
        }
      };
    }
  }, [block]);

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      <div ref={mapRef} className="w-full h-full"></div>
    </div>
  );
};
