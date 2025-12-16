import { Point } from "@arcgis/core/geometry";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
import Color from "@arcgis/core/Color";
import PopupTemplate from "@arcgis/core/PopupTemplate";
import Graphic from "@arcgis/core/Graphic";
import { LAYERS_TYPE } from "../constants/urlConts";

interface MarkerPointParams {
  x: number;
  y: number;
  wkid: number;
}
export function isDifferentEnough(
  pt1: __esri.Point,
  pt2: __esri.Point,
  tolerance = 0.00001,
) {
  const dx = Math.abs(pt1.x - pt2.x);
  const dy = Math.abs(pt1.y - pt2.y);
  return dx > tolerance || dy > tolerance;
}

export const getMarker = (
  point: Point,
  addressText: string,
  x: number,
  y: number,
  popupEnabled = false,
  color = [226, 119, 40],
): Graphic => {
  const symbol: SimpleMarkerSymbol = new SimpleMarkerSymbol({
    style: "circle",
    color: new Color(color),
    outline: {
      color: new Color([255, 255, 255]),
      width: 2,
    },
  });

  const popupTemplate = new PopupTemplate({
    title: addressText,
    content: `
      <b>Coordinates:</b> ${x.toFixed(4)}, ${y.toFixed(4)}<br>
      <b>Address:</b> ${addressText}
    `,
  });

  return new Graphic({
    geometry: point,
    symbol: symbol,
    popupTemplate: popupEnabled ? popupTemplate : undefined,
  });
};

export const getMarkerPoint = ({ x, y, wkid }: MarkerPointParams): Point => {
  return new Point({
    x: x,
    y: y,
    spatialReference: {
      wkid: wkid,
    },
  });
};

export const getImageIcon = (icon: string, keyword: string[]) => {
  if (icon === "Image Service" && keyword.includes("Tiled Imagery")) {
    return "tiledimagerylayer16.svg";
  } else {
    return LAYERS_TYPE.find((layer) => layer.name === icon)?.icon;
  }
};

export const getLayerName = (name: string, keyword: string[]) => {
  if (name === "Image Service" && keyword.includes("Tiled Imagery")) {
    return "Tiled imagery layer";
  }
  return name;
};
