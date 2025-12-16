import { OperationTypes } from "./operations";

export interface LayerType {
  title: string;
  visible: boolean;
  id: string;
  sublayers?: any[];
}

export interface LocationType {
  longitude: number;
  latitude: number;
  address: string;
  score: number;
}

export interface FilterMessage {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp?: Date;
  operations?: OperationTypes[];
}

export interface ExtentType {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
  spatialReference?: {
    wkid: number;
    latestWkid?: number;
  };
}
