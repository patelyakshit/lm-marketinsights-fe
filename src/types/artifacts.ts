export interface URLType {
  blob_url: string;
  container: string;
  filename: string;
  sas_expires_at: string;
  sas_url: string;
  storage_type: string;
  success: boolean;
}

export interface ImageSource {
  url: URLType;
  alt: string;
}

export interface MapState {
  latitude: number;
  longitude: number;
  zoom: number;
}

export interface MapLayer {
  layer_id: string;
  visible: boolean;
}

export type MapBaseStyle =
  | "dark-gray"
  | "light-gray"
  | "streets"
  | "satellite"
  | "hybrid";

export interface TextBlockPayloadType {
  content: string;
}

export interface TextBlockType {
  id: string;
  type: "text";
  payload: TextBlockPayloadType;
}

export interface ImageBlockPayloadType {
  source: {
    url: URLType;
    alt: string;
  };
}

export interface ImageBlockType {
  id: string;
  type: "image";
  payload: ImageBlockPayloadType;
}

export interface CoverBlockPayloadType {
  cover_blocks: (TextBlockType | ImageBlockType)[];
}

export interface CoverBlockType {
  id: string;
  type: "cover";
  payload: CoverBlockPayloadType;
}

export interface MapBlockPayloadType {
  initial_map_state: MapState;
  base_style: MapBaseStyle;
  layers: MapLayer[];
}

export interface MapBlockType {
  id: string;
  type: "map";
  payload: MapBlockPayloadType;
}

export interface NarrativeBlockPayloadType {
  narrative_blocks: (TextBlockType | ImageBlockType | MapBlockType)[];
}

export interface NarrativeBlockType {
  id: string;
  type: "narrative";
  payload: NarrativeBlockPayloadType;
}

export interface MapCommand {
  type: "TOGGLE_LAYER" | "ZOOM_TO_LOCATION" | "APPLY_FILTER";
  payload: Record<string, unknown>;
}

export interface SidecarCardType {
  id: string;
  type: "text";
  payload: TextBlockPayloadType;
  map_command?: MapCommand;
}

export interface SidecarBlockPayloadType {
  map_config: {
    initial_map_state: MapState;
    base_style: MapBaseStyle;
    layers: MapLayer[];
  };
  cards: SidecarCardType[];
}

export interface SidecarBlockType {
  id: string;
  type: "sidecar";
  payload: SidecarBlockPayloadType;
}

export type PlacestoryBlock =
  | CoverBlockType
  | TextBlockType
  | ImageBlockType
  | MapBlockType
  | NarrativeBlockType
  | SidecarBlockType;

export interface PlaceStoryArtifactPayload {
  placestory_title: string;
  placestory_blocks: PlacestoryBlock[];
}

export interface PlaceStoryArtifact {
  type: "PLACESTORY_ARTIFACT";
  payload: PlaceStoryArtifactPayload;
}

export interface PlaceStoryArtifactSkeleton {
  type: "PLACESTORY_SKELETON_ARTIFACT";
  payload: null;
}

export type PlacestoryArtifactType = "PLACESTORY_ARTIFACT";
export type PlacestoryArtifactSkeletonType = "PLACESTORY_SKELETON_ARTIFACT";
export type ArtifactType = PlacestoryArtifactType;
export type Artifact = PlaceStoryArtifact | PlaceStoryArtifactSkeleton;
