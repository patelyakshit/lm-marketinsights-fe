import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export type ViewMode = "chat" | "split" | "canvas";

// Operations that require the map to be visible
const MAP_VISIBLE_OPERATIONS = new Set([
  "ZOOM_TO_FEATURES",
  "ZOOM_TO_LOCATION",
  "ZOOM_MAP",
  "PAN_MAP",
  "ADD_PIN",
  "REMOVE_PIN",
  "PLOT_GEOJSON",
  "TOGGLE_LAYER_VISIBILITY",
  "TOGGLE_SUBLAYER_VISIBILITY",
  "APPLY_FILTER",
  "TOGGLE_LABELS",
  "TOGGLE_SUBLAYER_LABELS",
  "RESET_LAYERS",
]);

// Keywords that suggest the user's query will involve map operations
// These trigger immediate switch to split view before sending the message
const MAP_INTENT_KEYWORDS = [
  // Layer-related
  "layer", "layers",
  // Location/Navigation
  "zoom", "pan", "map", "navigate",
  "nearby", "near", "around", "within",
  "location", "address", "area", "region",
  "where is", "where are", "show me", "find",
  // Demographics/Enrichment
  "lifestyle", "demographics", "demographic",
  "income", "age", "population", "median",
  "household", "education", "employment",
  "tapestry", "segment", "segmentation",
  // Places/Features
  "store", "stores", "building", "buildings",
  "point", "points", "pin", "marker",
  "feature", "features", "polygon", "boundary",
  // Actions
  "filter", "highlight", "toggle", "enable", "disable",
  "add layer", "remove layer", "turn on", "turn off",
  // Analysis
  "drive time", "drivetime", "radius", "buffer",
  "trade area", "catchment",
];

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  /** Switch to split view if current mode is chat and operation requires map visibility */
  ensureMapVisible: (operationType?: string) => void;
  /** Check if an operation type requires map visibility */
  isMapOperation: (operationType: string) => boolean;
  /** Check if user message contains map-related keywords and switch if needed (instant, before sending) */
  checkMessageIntent: (message: string) => boolean;
  /** Handle AI hint from server (fallback for edge cases) */
  handleMapHint: () => void;
}

const ViewModeContext = createContext<ViewModeContextType | null>(null);

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (!context) {
    throw new Error("useViewMode must be used within ViewModeProvider");
  }
  return context;
}

// Optional hook that doesn't throw - useful for components that may be outside provider
export function useViewModeOptional() {
  return useContext(ViewModeContext);
}

interface ViewModeProviderProps {
  children: ReactNode;
  defaultMode?: ViewMode;
}

export function ViewModeProvider({
  children,
  defaultMode = "chat",
}: ViewModeProviderProps) {
  const [viewMode, setViewModeState] = useState<ViewMode>(defaultMode);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
  }, []);

  const isMapOperation = useCallback((operationType: string): boolean => {
    return MAP_VISIBLE_OPERATIONS.has(operationType);
  }, []);

  const ensureMapVisible = useCallback(
    (operationType?: string) => {
      // If operation type provided, check if it's a map operation
      if (operationType && !isMapOperation(operationType)) {
        return; // Not a map operation, don't switch
      }

      // Only switch from chat mode - split and canvas already show the map
      if (viewMode === "chat") {
        console.log(
          `[ViewMode] Auto-switching to split view${operationType ? ` for ${operationType}` : ""}`
        );
        setViewModeState("split");
      }
    },
    [viewMode, isMapOperation]
  );

  // Check if user's message contains map-related keywords
  // Returns true if keywords detected and view was switched
  const checkMessageIntent = useCallback(
    (message: string): boolean => {
      if (viewMode !== "chat") {
        return false; // Already showing map
      }

      const lowerMessage = message.toLowerCase();

      // Check for keyword matches
      const matchedKeyword = MAP_INTENT_KEYWORDS.find((keyword) =>
        lowerMessage.includes(keyword.toLowerCase())
      );

      if (matchedKeyword) {
        console.log(
          `[ViewMode] Keyword detected: "${matchedKeyword}" - switching to split view`
        );
        setViewModeState("split");
        return true;
      }

      return false;
    },
    [viewMode]
  );

  // Handle AI hint from server - fallback for edge cases
  const handleMapHint = useCallback(() => {
    if (viewMode === "chat") {
      console.log("[ViewMode] AI hint received - switching to split view");
      setViewModeState("split");
    }
  }, [viewMode]);

  return (
    <ViewModeContext.Provider
      value={{
        viewMode,
        setViewMode,
        ensureMapVisible,
        isMapOperation,
        checkMessageIntent,
        handleMapHint,
      }}
    >
      {children}
    </ViewModeContext.Provider>
  );
}

export default ViewModeContext;
