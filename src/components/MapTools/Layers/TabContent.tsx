import { Bookmark, ChevronRight, Funnel, Search, X } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import useDebounce from "../../../hooks/useDebounce";
import { useState, useRef, useEffect } from "react";
import {
  getLayersContent,
  getArcGisData,
  getLivingAtlasLayers,
  LayerData,
} from "../../../api";
import { API_ENDPOINTS } from "../../../constants/urlConts";
import { getImageIcon, getLayerName } from "../../../lib/mapHelper";
import IconButtonPopover from "../../IconButtonPopover";
import LayerFilterPopover from "./LayerFilterPopover";
import SortOptionsPopover from "./SortOptionsPopover";
import PaginationComponent from "../../PaginationComponent";
import AddFileLayers from "./AddFileLayers";
import AddWebLayers from "./AddWebLayers";
import { useMapStore } from "../../../store/useMapStore";
import { useLayerDetailsStore } from "../../../store/useLayerDetailsStore";
import { useFavorites } from "../../../hooks/useFavorites";
import SortIcon from "../../svg/SortIcon";

interface TabContentProps {
  selectedTab: string;
  onAddLayer?: (layer: LayerData["results"][0]) => Promise<void>;
  onRemoveLayer?: (layerId: string) => void;
  isLayerAdded?: (layerId: string) => boolean;
  addingLayerId?: string | null;
  onBack?: () => void;
}

const TabContent = ({
  selectedTab,
  onAddLayer,
  onRemoveLayer,
  isLayerAdded,
  addingLayerId,
  onBack,
}: TabContentProps) => {
  // Separate state for Curated and ArcGIS tabs
  const [curatedState, setCuratedState] = useState({
    search: "",
    showSearch: false,
    selectedLayerOption: "",
    layerFilters: [] as string[],
    sortBy: "Relevance",
    page: 1,
  });

  const [arcGisState, setArcGisState] = useState({
    search: "",
    showSearch: false,
    layerFilters: [] as string[],
    sortBy: "Relevance",
    page: 1,
  });

  // Current active state based on selectedTab
  const isCurrentlyCurated = selectedTab === "Curated";
  const isCurrentlyArcGIS = selectedTab === "ArcGIS";

  const search = isCurrentlyCurated
    ? curatedState.search
    : isCurrentlyArcGIS
      ? arcGisState.search
      : "";
  const showSearch = isCurrentlyCurated
    ? curatedState.showSearch
    : isCurrentlyArcGIS
      ? arcGisState.showSearch
      : false;
  const selectedLayerOption = isCurrentlyCurated
    ? curatedState.selectedLayerOption
    : "";
  const layerFilters = isCurrentlyCurated
    ? curatedState.layerFilters
    : isCurrentlyArcGIS
      ? arcGisState.layerFilters
      : [];
  const sortBy = isCurrentlyCurated
    ? curatedState.sortBy
    : isCurrentlyArcGIS
      ? arcGisState.sortBy
      : "Relevance";
  const page = isCurrentlyCurated
    ? curatedState.page
    : isCurrentlyArcGIS
      ? arcGisState.page
      : 1;

  const { openLayerDetails } = useLayerDetailsStore();
  const [arcGisOption, setArcGisOption] = useState<string>("living_atlas");
  const debouncedQuery = useDebounce(search, 300);
  const searchRef = useRef<HTMLDivElement>(null);
  const previousTabRef = useRef<string>(selectedTab);
  const { mapView, addLayer } = useMapStore();
  const {
    favorites,
    searchQuery,
    setSearchQuery,
    toggleFavorite,
    removeFavorite,
    isFavorite,
  } = useFavorites();

  const parGoLayersGroupID = import.meta.env.VITE_CURATED_LAYERS_ID;
  const arcGisLivingAtlasId = import.meta.env.VITE_ARCGIS_LIVING_ATLAS_ID;
  const queryClient = useQueryClient();

  // Helper functions to update state based on current tab
  const setSearch = (value: string) => {
    if (isCurrentlyCurated) {
      setCuratedState((prev) => ({ ...prev, search: value }));
    } else if (isCurrentlyArcGIS) {
      setArcGisState((prev) => ({ ...prev, search: value }));
    }
  };

  const setShowSearch = (value: boolean) => {
    if (isCurrentlyCurated) {
      setCuratedState((prev) => ({ ...prev, showSearch: value }));
    } else if (isCurrentlyArcGIS) {
      setArcGisState((prev) => ({ ...prev, showSearch: value }));
    }
  };

  const setSelectedLayerOption = (value: string) => {
    if (isCurrentlyCurated) {
      setCuratedState((prev) => ({ ...prev, selectedLayerOption: value }));
    }
  };

  const setLayerFilters = (value: string[]) => {
    if (isCurrentlyCurated) {
      setCuratedState((prev) => ({ ...prev, layerFilters: value }));
    } else if (isCurrentlyArcGIS) {
      setArcGisState((prev) => ({ ...prev, layerFilters: value }));
    }
  };

  const setSortBy = (value: string) => {
    if (isCurrentlyCurated) {
      setCuratedState((prev) => ({ ...prev, sortBy: value }));
    } else if (isCurrentlyArcGIS) {
      setArcGisState((prev) => ({ ...prev, sortBy: value }));
    }
  };

  const setPage = (value: number) => {
    if (isCurrentlyCurated) {
      setCuratedState((prev) => ({ ...prev, page: value }));
    } else if (isCurrentlyArcGIS) {
      setArcGisState((prev) => ({ ...prev, page: value }));
    }
  };

  const handleLayerFilterChange = (selectedLayers: string[]) => {
    setLayerFilters(selectedLayers);
    setPage(1);
  };

  const handleSortChange = (sortOption: string) => {
    setSortBy(sortOption);
    setPage(1);
  };

  const handleArcGisOptionChange = (option: string) => {
    setArcGisOption(option);
    setPage(1);
    queryClient.invalidateQueries({ queryKey: ["arcGisLayers"] });
    queryClient.invalidateQueries({ queryKey: ["livingAtlasLayers"] });
  };

  const handleAddFileLayer = async (layer: any) => {
    if (onAddLayer) {
      await onAddLayer(layer);
    } else {
      addLayer(layer);
    }
  };

  // Track previous tab but don't clear state - let each tab persist its own filters
  useEffect(() => {
    previousTabRef.current = selectedTab;
  }, [selectedTab]);

  const { data: parGoLayers, isLoading: parGoLayersLoading } =
    useQuery<LayerData>({
      queryKey: [
        "parGoLayers",
        parGoLayersGroupID,
        debouncedQuery,
        selectedLayerOption,
        layerFilters,
        sortBy,
        page,
      ],
      enabled: selectedTab === "Curated",
      queryFn: () =>
        getLayersContent(
          parGoLayersGroupID,
          debouncedQuery,
          selectedLayerOption === "all" ? "" : selectedLayerOption,
          page,
          layerFilters,
          sortBy,
        ),
    });

  const { data: arcGisLayers, isLoading: arcGisLoading } = useQuery<LayerData>({
    queryKey: [
      "arcGisLayers",
      debouncedQuery,
      layerFilters,
      sortBy,
      page,
      arcGisOption,
    ],
    enabled: selectedTab === "ArcGIS" && arcGisOption === "arc_gis_online",
    queryFn: () => getArcGisData(debouncedQuery, page, layerFilters, sortBy),
  });

  const { data: livingAtlasLayers, isLoading: livingAtlasLoading } =
    useQuery<LayerData>({
      queryKey: [
        "livingAtlasLayers",
        arcGisLivingAtlasId,
        debouncedQuery,
        layerFilters,
        sortBy,
        page,
        arcGisOption,
      ],
      enabled: selectedTab === "ArcGIS" && arcGisOption === "living_atlas",
      queryFn: () =>
        getLivingAtlasLayers(
          arcGisLivingAtlasId,
          debouncedQuery,
          "",
          page,
          layerFilters,
          sortBy,
        ),
    });

  if (selectedTab === "Curated" && !parGoLayersGroupID) {
    return (
      <div className="px-2 py-4">
        <div className="text-center text-sm text-red-500">
          Error: VITE_CURATED_LAYERS_ID environment variable is not set. Please
          check your environment configuration.
        </div>
      </div>
    );
  }

  if (selectedTab === "ArcGIS" && !arcGisLivingAtlasId) {
    return (
      <div className="px-2 py-4">
        <div className="text-center text-sm text-red-500">
          Error: VITE_ARCGIS_LIVING_ATLAS_ID environment variable is not set.
          Please check your environment configuration.
        </div>
      </div>
    );
  }

  if (selectedTab === "Curated" || selectedTab === "ArcGIS") {
    const dataToDisplay =
      selectedTab === "Curated"
        ? parGoLayers
        : arcGisOption === "living_atlas"
          ? livingAtlasLayers
          : arcGisLayers;

    const isLoading =
      selectedTab === "Curated"
        ? parGoLayersLoading
        : arcGisOption === "living_atlas"
          ? livingAtlasLoading
          : arcGisLoading;

    return (
      <div className="w-full tab-content-container flex flex-col h-full">
        {/* Sticky Toolbar - matching Figma design */}
        <div
          className="sticky top-0 z-20 bg-white p-2 flex flex-col gap-2"
          style={{ borderBottom: "1px solid #eceae9" }}
        >
          <div className="flex flex-row gap-2 items-center">
            {/* Dropdown Select */}
            {selectedTab === "Curated" ? (
              <Select
                value={selectedLayerOption}
                onValueChange={setSelectedLayerOption}
              >
                <SelectTrigger
                  className="flex-1 border border-[#eceae9] rounded-[4px] px-2 py-1.5 gap-1 focus:outline-none focus:ring-0 focus:border-[#eceae9] shadow-none"
                  style={{
                    fontFamily: "Switzer, sans-serif",
                    fontSize: "14px",
                    lineHeight: "20px",
                    color: "#545251",
                  }}
                >
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-[#eceae9] rounded-[4px] shadow-none">
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="environment">Environment</SelectItem>
                  <SelectItem value="landscape">Landscape</SelectItem>
                  <SelectItem value="federal">Federal</SelectItem>
                  <SelectItem value="transportation">Transportation</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="zoning_planning">
                    Zoning & Planning
                  </SelectItem>
                  <SelectItem value="hydrology">Hydrology</SelectItem>
                  <SelectItem value="cultural_historical">
                    Cultural & Historical
                  </SelectItem>
                  <SelectItem value="demographics">Demographics</SelectItem>
                  <SelectItem value="economic">Economic</SelectItem>
                  <SelectItem value="building_construction">
                    Building & Construction
                  </SelectItem>
                  <SelectItem value="risk_hazards">Risk & Hazards</SelectItem>
                  <SelectItem value="land_use">Land Use</SelectItem>
                  <SelectItem value="infrastructure">Infrastructure</SelectItem>
                  <SelectItem value="boundaries">Boundaries</SelectItem>
                  <SelectItem value="imagery">Imagery</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Select
                value={arcGisOption}
                onValueChange={handleArcGisOptionChange}
              >
                <SelectTrigger
                  className="flex-1 border border-[#eceae9] rounded-[4px] px-2 py-1.5 gap-1 focus:outline-none focus:ring-0 focus:border-[#eceae9] shadow-none"
                  style={{
                    fontFamily: "Switzer, sans-serif",
                    fontSize: "14px",
                    lineHeight: "20px",
                    color: "#545251",
                  }}
                >
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-[#eceae9] rounded-[4px] shadow-none">
                  <SelectItem value="living_atlas">Living Atlas</SelectItem>
                  <SelectItem value="arc_gis_online">ArcGIS Online</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Button Group - Search, Filter, Sort */}
            <div
              className="shrink-0 border border-[#eceae9] rounded-[4px] p-1 flex flex-row gap-1 items-center"
              ref={searchRef}
            >
              {/* Search Button */}
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-1 rounded-[2px] hover:bg-[#f3f2f2] transition-colors"
              >
                <Search strokeWidth={1.5} className="w-4 h-4 text-[#545251]" />
              </button>

              {/* Divider */}
              <div className="w-px h-4 bg-[#eceae9]" />

              {/* Filter Button */}
              <div className="relative">
                <IconButtonPopover
                  buttonSize="icon"
                  className="p-1 rounded-[2px] hover:bg-[#f3f2f2] h-auto w-auto"
                  PopoverComponent={() => (
                    <LayerFilterPopover
                      onFilterChange={handleLayerFilterChange}
                      currentFilters={layerFilters}
                    />
                  )}
                  tooltipText="Filter Layers"
                  ButtonContent={
                    <Funnel
                      strokeWidth={1.5}
                      className="w-4 h-4 text-[#545251]"
                    />
                  }
                />
                {layerFilters.length > 0 && (
                  <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
                )}
              </div>

              {/* Sort Button */}
              <div className="relative">
                <IconButtonPopover
                  buttonSize="icon"
                  className="p-1 rounded-[2px] hover:bg-[#f3f2f2] h-auto w-auto"
                  PopoverComponent={() => (
                    <SortOptionsPopover
                      onSortChange={handleSortChange}
                      currentSort={sortBy}
                    />
                  )}
                  tooltipText="Sort Layers"
                  ButtonContent={<SortIcon />}
                />
                {sortBy !== "Relevance" && (
                  <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
                )}
              </div>
            </div>
          </div>

          {/* Search Input - appears below toolbar when active */}
          {showSearch && (
            <div className="bg-white border border-[#eceae9] rounded-[4px] px-2 h-8 flex items-center gap-2">
              <Search
                strokeWidth={1.5}
                className="w-4 h-4 text-[#545251] shrink-0"
              />
              <input
                type="text"
                placeholder="Search layers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 text-sm border-none outline-none bg-transparent"
                style={{
                  fontFamily: "Switzer, sans-serif",
                  fontSize: "14px",
                  color: "#545251",
                }}
                autoFocus
              />
              <X
                strokeWidth={1.5}
                className="w-4 h-4 text-[#545251] cursor-pointer shrink-0 hover:text-[#1d1916]"
                onClick={() => {
                  setSearch("");
                  setShowSearch(false);
                }}
              />
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-2">
          {/* Layers List */}
          <div className="mt-2">
            {isLoading ? (
              <div className="text-center py-4 text-sm text-gray-500">
                Loading layers...
              </div>
            ) : dataToDisplay?.results && dataToDisplay.results.length > 0 ? (
              dataToDisplay.results.map((layer) => (
                <div
                  key={layer.id}
                  className="bg-[#f3f2f2] p-[2px] rounded-[6px] mb-2"
                >
                  <div className="bg-white border border-[#eceae9] rounded-[4px] p-3 flex flex-row gap-2 items-start justify-between">
                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                      <div className="flex flex-col gap-1.5">
                        <p
                          className="text-[14px] leading-[20px]"
                          style={{
                            fontFamily: "Switzer, sans-serif",
                            fontWeight: 500,
                            color: "#1d1916",
                          }}
                        >
                          {layer.title}
                        </p>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <img
                              className="w-4 h-4 shrink-0"
                              src={`${API_ENDPOINTS.LAYERS_ICON_BASE_URL}/${getImageIcon(layer.type, layer?.typeKeywords || [])}`}
                            />
                            <p
                              className="text-[12px] leading-[16px]"
                              style={{
                                fontFamily: "Switzer, sans-serif",
                                color: "#545251",
                              }}
                            >
                              {getLayerName(
                                layer.type,
                                layer?.typeKeywords || [],
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <img
                              src={`${API_ENDPOINTS.ARCGIS_BASEURL}/community/users/${layer.owner}/info/blob.png`}
                              alt={layer.owner}
                              className="w-4 h-4 rounded-full shrink-0"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = `${API_ENDPOINTS.ARCGIS_BASEURL}/${API_ENDPOINTS.ESRI_LOGO}`;
                              }}
                              loading="lazy"
                            />
                            <p
                              className="text-[12px] leading-[16px]"
                              style={{
                                fontFamily: "Switzer, sans-serif",
                                color: "#545251",
                              }}
                            >
                              {layer.owner
                                ? layer.owner
                                    .replace(/_/g, " ")
                                    .replace(/\b\w/g, (char: string) =>
                                      char.toUpperCase(),
                                    )
                                : "NA"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <p
                        className="text-[10px] leading-[14px]"
                        style={{
                          fontFamily: "Switzer, sans-serif",
                          color: "#a6a3a0",
                        }}
                      >
                        Last Updated:{" "}
                        {layer.modified
                          ? new Date(layer.modified).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "N/A"}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <img
                        src={`${API_ENDPOINTS.ARCGIS_BASEURL}/content/items/${layer?.id}/info/${layer?.thumbnail}?w=400&token=${import.meta.env.VITE_ARCGIS_API_KEY}`}
                        alt={layer.title}
                        className="w-[105px] h-[62px] rounded-[4px] object-cover bg-[#eceae9]"
                      />
                      <div className="flex flex-row items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(layer);
                          }}
                          className="h-7 w-7 bg-[#f3f2f2] rounded-[4px] flex items-center justify-center hover:bg-[#eceae9] transition-colors"
                        >
                          <Bookmark
                            className={`h-4 w-4 ${
                              isFavorite(layer.id)
                                ? "text-[#FA7319] fill-[#FA7319]"
                                : "text-[#545251]"
                            }`}
                          />
                        </button>
                        <button
                          onClick={() => {
                            if (isLayerAdded && isLayerAdded(layer.id)) {
                              onRemoveLayer?.(layer.id);
                            } else {
                              onAddLayer?.(layer);
                            }
                          }}
                          disabled={addingLayerId === layer.id}
                          className={`flex-1 h-7 px-2 py-1.5 rounded-[4px] text-[14px] leading-[16px] transition-colors ${
                            isLayerAdded && isLayerAdded(layer.id)
                              ? "bg-red-100 border border-red-300 text-red-600 hover:bg-red-200"
                              : "bg-white border border-[#d5d3d2] text-[#1d1916] hover:bg-[#f8f7f7]"
                          } ${addingLayerId === layer.id ? "opacity-50 cursor-not-allowed" : ""}`}
                          style={{ fontFamily: "Switzer, sans-serif" }}
                        >
                          {addingLayerId === layer.id
                            ? "..."
                            : isLayerAdded && isLayerAdded(layer.id)
                              ? "Remove"
                              : "Add"}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div
                    className="px-2 py-1.5 flex flex-row justify-between items-center cursor-pointer hover:bg-[#eceae9] rounded-b-[4px] transition-colors"
                    onClick={() => openLayerDetails(layer.id)}
                  >
                    <p
                      className="text-[12px] leading-[16px]"
                      style={{
                        fontFamily: "Switzer, sans-serif",
                        fontWeight: 500,
                        color: "#545251",
                      }}
                    >
                      View details
                    </p>
                    <ChevronRight className="h-4 w-4 text-[#545251]" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-sm text-gray-500">
                {search
                  ? "No layers found matching your search."
                  : "No layers available."}
              </div>
            )}
          </div>

          {Number(dataToDisplay?.total ?? 0) / 100 > 1 && (
            <PaginationComponent
              currentPage={page}
              totalPages={Math.ceil(Number(dataToDisplay?.total ?? 0) / 100)}
              onPageChange={setPage}
            />
          )}
        </div>
      </div>
    );
  }

  // File tab content
  if (selectedTab === "File") {
    return (
      <div className="w-full tab-content-container">
        <AddFileLayers
          view={mapView}
          handleAddLayer={handleAddFileLayer}
          setIsAddLayersMode={onBack || (() => {})}
        />
      </div>
    );
  }

  // Web tab content
  if (selectedTab === "Web") {
    return (
      <div className="w-full tab-content-container">
        <AddWebLayers
          handleAddLayer={handleAddFileLayer}
          setIsAddLayersMode={onBack || (() => {})}
        />
      </div>
    );
  }

  // Favourite tab content
  if (selectedTab === "favorite") {
    return (
      <div className="w-full tab-content-container flex flex-col h-full">
        {/* Sticky Search Bar - matching Figma design */}
        <div
          className="sticky top-0 z-20 bg-white p-2"
          style={{ borderBottom: "1px solid #eceae9" }}
        >
          <div className="bg-white border border-[#eceae9] rounded-[4px] px-2 h-8 flex items-center gap-2">
            <Search
              strokeWidth={1.5}
              className="w-4 h-4 text-[#545251] shrink-0"
            />
            <input
              type="text"
              placeholder="Search favorites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 text-[14px] border-none outline-none bg-transparent"
              style={{ fontFamily: "Switzer, sans-serif", color: "#545251" }}
            />
            {searchQuery && (
              <X
                strokeWidth={1.5}
                className="w-4 h-4 text-[#545251] cursor-pointer shrink-0 hover:text-[#1d1916]"
                onClick={() => {
                  setSearchQuery("");
                }}
              />
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-2">
          {/* Favorites List */}
          <div className="mt-2">
            {favorites.length > 0 ? (
              favorites.map((layer) => (
                <div
                  key={layer.id}
                  className="bg-[#f3f2f2] p-[2px] rounded-[6px] mb-2"
                >
                  <div className="bg-white border border-[#eceae9] rounded-[4px] p-3 flex flex-row gap-2 items-start justify-between">
                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                      <div className="flex flex-col gap-1.5">
                        <p
                          className="text-[14px] leading-[20px]"
                          style={{
                            fontFamily: "Switzer, sans-serif",
                            fontWeight: 500,
                            color: "#1d1916",
                          }}
                        >
                          {layer.title}
                        </p>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <img
                              className="w-4 h-4 shrink-0"
                              src={`${API_ENDPOINTS.LAYERS_ICON_BASE_URL}/${getImageIcon(layer.type, layer?.typeKeywords || [])}`}
                            />
                            <p
                              className="text-[12px] leading-[16px]"
                              style={{
                                fontFamily: "Switzer, sans-serif",
                                color: "#545251",
                              }}
                            >
                              {getLayerName(
                                layer.type,
                                layer?.typeKeywords || [],
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <img
                              src={`${API_ENDPOINTS.ARCGIS_BASEURL}/community/users/${layer.owner}/info/blob.png`}
                              alt={layer.owner}
                              className="w-4 h-4 rounded-full shrink-0"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = `${API_ENDPOINTS.ARCGIS_BASEURL}/${API_ENDPOINTS.ESRI_LOGO}`;
                              }}
                              loading="lazy"
                            />
                            <p
                              className="text-[12px] leading-[16px]"
                              style={{
                                fontFamily: "Switzer, sans-serif",
                                color: "#545251",
                              }}
                            >
                              {layer.owner
                                ? layer.owner
                                    .replace(/_/g, " ")
                                    .replace(/\b\w/g, (char: string) =>
                                      char.toUpperCase(),
                                    )
                                : "NA"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <p
                        className="text-[10px] leading-[14px]"
                        style={{
                          fontFamily: "Switzer, sans-serif",
                          color: "#a6a3a0",
                        }}
                      >
                        Last Updated:{" "}
                        {layer.modified
                          ? new Date(layer.modified).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "N/A"}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <img
                        src={`${API_ENDPOINTS.ARCGIS_BASEURL}/content/items/${(layer as any)?.itemId || layer?.id}/info/${layer?.thumbnail}?w=400&token=${import.meta.env.VITE_ARCGIS_API_KEY}`}
                        alt={layer.title}
                        className="w-[105px] h-[62px] rounded-[4px] object-cover bg-[#eceae9]"
                      />
                      <div className="flex flex-row items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFavorite(layer.id);
                          }}
                          className="h-7 w-7 bg-[#f3f2f2] rounded-[4px] flex items-center justify-center hover:bg-[#eceae9] transition-colors"
                        >
                          <Bookmark className="h-4 w-4 text-[#FA7319] fill-[#FA7319]" />
                        </button>
                        <button
                          onClick={() => {
                            if (isLayerAdded && isLayerAdded(layer.id)) {
                              onRemoveLayer?.(layer.id);
                            } else {
                              onAddLayer?.(layer);
                            }
                          }}
                          disabled={addingLayerId === layer.id}
                          className={`flex-1 h-7 px-2 py-1.5 rounded-[4px] text-[14px] leading-[16px] transition-colors ${
                            isLayerAdded && isLayerAdded(layer.id)
                              ? "bg-red-100 border border-red-300 text-red-600 hover:bg-red-200"
                              : "bg-white border border-[#d5d3d2] text-[#1d1916] hover:bg-[#f8f7f7]"
                          } ${addingLayerId === layer.id ? "opacity-50 cursor-not-allowed" : ""}`}
                          style={{ fontFamily: "Switzer, sans-serif" }}
                        >
                          {addingLayerId === layer.id
                            ? "..."
                            : isLayerAdded && isLayerAdded(layer.id)
                              ? "Remove"
                              : "Add"}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div
                    className="px-2 py-1.5 flex flex-row justify-between items-center cursor-pointer hover:bg-[#eceae9] rounded-b-[4px] transition-colors"
                    onClick={() => openLayerDetails(layer.id)}
                  >
                    <p
                      className="text-[12px] leading-[16px]"
                      style={{
                        fontFamily: "Switzer, sans-serif",
                        fontWeight: 500,
                        color: "#545251",
                      }}
                    >
                      View details
                    </p>
                    <ChevronRight className="h-4 w-4 text-[#545251]" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                <p className="mt-2 text-sm text-gray-600">
                  {searchQuery
                    ? "No favorites found matching your search."
                    : "No favorite yet"}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {searchQuery
                    ? "Try a different search term."
                    : "Items you favorite will appear here"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default TabContent;
