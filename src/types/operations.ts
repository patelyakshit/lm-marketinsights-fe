import { PlacestoryBlock } from "./artifacts";
import { ExtentType, LayerType, LocationType } from "./index";

// GeoJSON type definitions for trade area polygons
export interface GeoJSONGeometry {
  type: "Point" | "MultiPoint" | "LineString" | "MultiLineString" | "Polygon" | "MultiPolygon" | "GeometryCollection";
  coordinates: number[] | number[][] | number[][][] | number[][][][];
}

export interface GeoJSONFeature {
  type: "Feature";
  geometry: GeoJSONGeometry;
  properties: Record<string, unknown>;
}

export interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

export interface ZoomToFeaturesPayload {
  layerId: string;
  layerName: string;
  target: "FILTERED" | "FULL_EXTENT";
}

export interface ZoomToFeaturesOperation {
  type: "ZOOM_TO_FEATURES";
  payload: ZoomToFeaturesPayload;
}

export interface ApplyFilterPayload {
  layerId: string;
  whereClause: string;
  spatialLock: boolean;
}

export interface ApplyFilterOperation {
  type: "APPLY_FILTER";
  payload: ApplyFilterPayload;
}

export interface ToggleLayerVisibilityPayload {
  layerId: string;
  layerName: string;
  visible: boolean;
}

export interface ToggleLayerVisibilityOperation {
  type: "TOGGLE_LAYER_VISIBILITY";
  payload: ToggleLayerVisibilityPayload;
}

export interface ToggleSublayerVisibilityOperation {
  type: "TOGGLE_SUBLAYER_VISIBILITY";
  payload: ToggleSublayerVisibilityPayload;
}

export interface ToggleSublayerVisibilityPayload {
  layerId: string;
  sublayerId: string;
  visible: boolean;
}

export interface ZoomToLocationPayload {
  extent: ExtentType;
}

export interface ZoomToLocationOperation {
  type: "ZOOM_TO_LOCATION";
  payload: ZoomToLocationPayload;
}

export type PanMapDirectionType =
  | "up"
  | "down"
  | "left"
  | "right"
  | "north"
  | "south"
  | "east"
  | "west";
export interface PanMapPayload {
  distance: number;
  direction: string;
}

export interface PanMapOperation {
  type: "PAN_MAP";
  payload: PanMapPayload;
}

export interface ZoomMapOperation {
  type: "ZOOM_MAP";
  payload: ZoomMapPayload;
}

export interface ZoomMapPayload {
  zoom_action: "zoom_in" | "zoom_out";
  zoom_percentage: number;
}

export interface ToggleLabelsOperation {
  type: "TOGGLE_LABELS";
  payload: ToggleLabelsPayload;
}

export interface ToggleLabelsPayload {
  layerId: string;
  layerName: string;
  enabled: boolean;
  labelField?: string;
}

export interface ToggleSublayerLabelsOperation {
  type: "TOGGLE_SUBLAYER_LABELS";
  payload: ToggleSublayerLabelsPayload;
}

export interface ToggleSublayerLabelsPayload {
  layerId: string;
  sublayerId: string;
  enabled: boolean;
  labelField?: string;
}

export interface AddPinOperation {
  type: "ADD_PIN";
  payload: AddPinPayload;
}

export interface AddPinPayload {
  pins: PinType[];
}

export interface PinType {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
  color?: string;
  title?: string;
  note: string;
}
export interface RemovePinOperation {
  type: "REMOVE_PIN";
  payload: RemovePinPayload;
}

export interface RemovePinPayload {
  pinIds: string[];
}

export interface ResetLayersOperation {
  type: "RESET_LAYERS";
  payload: ResetLayersPayload;
}

export interface ResetLayersPayload {
  layerIds: string[];
}

export interface SuggestLayersOperation {
  type: "SUGGEST_LAYERS";
  payload: SuggestLayersPayload;
}

export interface SuggestLayersPayload {
  layers: LayerType[];
}

export interface SuggestLocationOperation {
  type: "SUGGEST_LOCATION";
  payload: SuggestLocationPayload;
}
export interface SuggestLocationPayload {
  location: LocationType;
}

export interface SuggestLabelsOperation {
  type: "SUGGEST_LABELS";
  payload: SuggestLabelsPayload;
}

export interface SuggestLabelsPayload {
  labels: string[];
}

export interface SuggestPinOperation {
  type: "SUGGEST_PIN";
  payload: SuggestPinPayload;
}

export interface SuggestPinPayload {
  pins: PinType[];
}

export interface PlotGeoJSONPayload {
  // For URL-based GeoJSON (original behavior)
  filename?: string;
  download_url?: string;
  media_url?: string;
  // For inline GeoJSON (trade area polygons)
  geojson?: GeoJSONGeometry | GeoJSONFeature | GeoJSONFeatureCollection;
  style?: {
    fillColor?: [number, number, number, number]; // RGBA
    strokeColor?: [number, number, number, number]; // RGBA
    strokeWidth?: number;
  };
  label?: string;
  id?: string;
}

export interface PlotGeoJSONOperation {
  type: "PLOT_GEOJSON";
  payload: PlotGeoJSONPayload;
}

export interface PlaceStoryStatusOperation {
  type: "PLACESTORY_STATUS";
  payload: PlaceStoryStatusPayload;
}

export interface PlaceStoryStatusPayload {
  details?: string | null;
  label?: string | null;
  session_id: string;
  status: PlaceStoryStatusState;
  step_id?: string | null;
  ts?: string | number | null;
}

export type PlaceStoryStatusState =
  | "pending"
  | "in_progress"
  | "success"
  | "done"
  | "error";

export interface PlaceStoryGeneratedOperation {
  type: "PLACESTORY_GENERATED";
  payload: PlaceStoryGeneratedPayload;
}

export interface PlaceStoryGeneratedPayload {
  placestory_title: string;
  placestory_blocks: PlacestoryBlock[];
}

// Marketing Post Operation Types
export interface MarketingPostPayload {
  id?: string;
  platform: string;
  headline: string;
  caption: string;
  hashtags: string[];
  imageUrl?: string;
  businessName?: string;
  segmentName?: string;
}

export interface MarketingPostGeneratedOperation {
  type: "MARKETING_POST_GENERATED";
  payload: MarketingPostPayload;
}

export interface MarketingPostsGeneratedOperation {
  type: "MARKETING_POSTS_GENERATED";
  payload: {
    posts: MarketingPostPayload[];
    businessName?: string;
    businessType?: string;
  };
}

// Sent when marketing generation starts - opens Studio with skeleton loaders
export interface MarketingGenerationStartedOperation {
  type: "MARKETING_GENERATION_STARTED";
  payload: {
    posts: MarketingPostPayload[]; // Posts without images yet
    businessName?: string;
    businessType?: string;
    message?: string;
  };
}

export interface OpenStudioViewOperation {
  type: "OPEN_STUDIO_VIEW";
  payload: Record<string, never>;
}

// Lifestyle Report Operation Types
export interface LifestyleSegment {
  code: string;
  name: string;
  percentage: number;
  householdCount: number;
  lifemodeGroup: string;
  urbanization: string;
  medianAge?: number;
  medianIncome?: number;
  medianNetWorth?: number;
  homeownershipRate?: number;
  description: string;
  characteristics: string[];
  color: string;
  insight: string;
}

export interface LifestyleReportPayload {
  address: string;
  latitude: number;
  longitude: number;
  totalHouseholds: number;
  segments: LifestyleSegment[];
  businessInsight: string;
  generatedAt: string;
  bufferMiles?: number;
  driveTimeMinutes?: number;
}

export interface LifestyleReportGeneratedOperation {
  type: "LIFESTYLE_REPORT_GENERATED";
  payload: LifestyleReportPayload;
}

export type AllOperations =
  | ZoomToFeaturesOperation
  | ApplyFilterOperation
  | ToggleLayerVisibilityOperation
  | ToggleSublayerVisibilityOperation
  | ZoomToLocationOperation
  | ZoomMapOperation
  | PanMapOperation
  | ToggleLabelsOperation
  | ToggleSublayerLabelsOperation
  | AddPinOperation
  | RemovePinOperation
  | ResetLayersOperation
  | SuggestLayersOperation
  | SuggestLocationOperation
  | SuggestLabelsOperation
  | SuggestPinOperation
  | PlotGeoJSONOperation
  | PlaceStoryStatusOperation
  | PlaceStoryGeneratedOperation
  | MarketingPostGeneratedOperation
  | MarketingPostsGeneratedOperation
  | MarketingGenerationStartedOperation
  | OpenStudioViewOperation
  | LifestyleReportGeneratedOperation;

export type NewOperationType = AllOperations;

export type OperationTypes = AllOperations["type"];

export type OperationPayloads = {
  [K in AllOperations as K["type"]]: K["payload"];
};
