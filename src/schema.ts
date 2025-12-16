export interface WebMapData {
  operationalLayers: Array<{
    id: string;
    title: string;
    visibility?: boolean;
  }>;
  initialState: {
    viewpoint: {
      targetGeometry: {
        x: number;
        y: number;
        spatialReference: {
          wkid: number;
        };
      };
    };
  };
}

export interface WebMapLayer {
  id: string;
  title: string;
  type?: string;
  layerType?: string;
  url?: string;
  visibility?: boolean;
  minScale?: number;
  maxScale?: number;
  extent?: any;
  layers?: WebMapLayer[];
  itemId?: string;
  isAddedFromWebMap?: boolean;
  popupEnabled?: boolean;
  labelsVisible?: boolean;
  layerDefinition?: any;
  typeKeywords?: string[];
  isAddedFromArcGisAccount?: boolean;
  opacity?: number;
  sublayerId?: number;
  parentId?: string;
  isChildLayer?: boolean;
  filterConditions?: Array<{
    id: string;
    field: string;
    operator: string;
    value: string | number | boolean;
    isActive: boolean;
  }>;
  isPointLayer?: boolean;
}

export interface FilterCondition {
  id: string;
  field: string;
  operator: string;
  value: string | number | boolean;
  isActive: boolean;
}

export interface AppliedLayer {
  id: string;
  title: string;
  url?: string;
  visibility?: boolean;
  popupEnabled?: boolean;
  layers?: WebMapLayer[];
  parentId?: string;
  isChildLayer?: boolean;
  sublayerId?: number;
  checked?: boolean;
  type?: string;
  layerType?: string;
  typeKeywords?: string[];
  extent?: [[number, number], [number, number]];
  minScale?: number;
  layerDefinition?: {
    minScale?: number;
  };
  itemId?: string;
  isAddedFromWebMap?: boolean;
  labelsVisible?: boolean;
  opacity?: number;
  filterConditions?: FilterCondition[];
  isPointLayer?: boolean;
  isAddedFromFile?: boolean;
  graphics?: any;
  renderer?: any;
}

export type MapOperation =
  | "LOCATION"
  | "HOME"
  | "ZOOM_IN"
  | "ZOOM_OUT"
  | "UNDO"
  | "REDO"
  | "EXPAND"
  | "FULLSCREEN"
  | "SEARCH"
  | "PIN_NOTE"
  | "MEASUREMENT";
