import ky from "ky";
// import { showToastBox } from "./components/ShowToastBox";
import { WebMapData } from "./schema";
import { API_ENDPOINTS, ARCGIS_GEOCODE_BASE_URL } from "./constants/urlConts";

const arcGisAPIKey = import.meta.env.VITE_ARCGIS_API_KEY;
const DEFAULT_WEBMAP_ID = import.meta.env.VITE_DEFAULT_WEBMAP_ID;

export const arcGisMap = ky.create({
  prefixUrl: `${API_ENDPOINTS.ARCGIS_BASEURL}`,
  timeout: 30000,
  hooks: {
    afterResponse: [
      async (_request, _options, response) => {
        if (!response.ok) {
          const data = await response.json();
          errorHandler(response.status, data);
        }
        return response;
      },
    ],
  },
});

export const arcGisGeocode = ky.create({
  prefixUrl: `${ARCGIS_GEOCODE_BASE_URL}`,
  timeout: 30000,
  hooks: {
    afterResponse: [
      async (_request, _options, response) => {
        if (!response.ok) {
          const data = await response.json();
          errorHandler(response.status, data);
        }
        return response;
      },
    ],
  },
});

const errorHandler = (status: number, data: any) => {
  let errorMsg = "";
  switch (status) {
    case 400:
    case 422: {
      const error = new Error("bad_request") as Error & { data: any };
      error.data = data.detail;
      throw error;
    }
    case 401:
    case 403:
      break;
    case 404:
      errorMsg = "Resource not found";
      break;
    case 500:
      errorMsg = "Server Error: Please try again later.";
      break;
    default:
      errorMsg = "";
      break;
  }
  console.log("errorMsg", errorMsg);
  //   errorMsg.trim() ? showToastBox({ messege: errorMsg, isError: true }) : null;
};

export const getWebMap = async (): Promise<WebMapData> => {
  return await arcGisMap
    .get(`content/items/${DEFAULT_WEBMAP_ID}/data`, {
      searchParams: {
        f: "json",
        token: arcGisAPIKey,
      },
    })
    .json();
};

export const reverseGeocode = async (latitude: number, longitude: number) => {
  return await arcGisMap
    .get("reverseGeocode", {
      searchParams: {
        location: `${longitude},${latitude}`,
        f: "json",
      },
    })
    .json();
};

export interface LayerData {
  total: number;
  start: number;
  num: number;
  nextStart: number;
  results: Array<{
    id: string;
    title: string;
    type: string;
    typeKeywords: string[];
    description?: string;
    snippet?: string;
    tags: string[];
    thumbnail?: string;
    extent?: number[][];
    spatialReference?: {
      wkid: number;
    };
    accessInformation?: string;
    licenseInfo?: string;
    culture?: string;
    properties?: any;
    url?: string;
    access?: string;
    size?: number;
    created?: number;
    modified?: number;
    owner?: string;
    ownerFolder?: string;
    numComments?: number;
    numRatings?: number;
    avgRating?: number;
    numViews?: number;
    groupCategories?: string[];
    categories?: string[];
  }>;
}

export const getLayersContent = async (
  layerGroupId: string,
  query: string = "",
  layerOption: string = "",
  page: number = 1,
  layerFilters?: string[],
  sortBy?: string,
): Promise<LayerData> => {
  let typeFilter = "";
  if (layerFilters && layerFilters.length > 0) {
    typeFilter = `type:(${layerFilters.map((type) => `"${type}"`).join(" OR ")})`;
  }

  const { sortParam, sortOrder, dateFilter, sharingFilter } =
    buildSortAndFilters(sortBy);

  let finalQuery = query;
  const filters = [typeFilter, dateFilter, sharingFilter].filter(Boolean);

  if (filters.length > 0) {
    finalQuery = query
      ? `${query} AND ${filters.join(" AND ")}`
      : filters.join(" AND ");
  }

  return await arcGisMap
    .get(`content/groups/${layerGroupId}/search`, {
      searchParams: {
        f: "json",
        token: arcGisAPIKey,
        start: page,
        ...(layerOption && { filter: `tags:("${layerOption}")` }),
        num: 100,
        ...(sortParam && { sortField: sortParam, sortOrder }),
        q: finalQuery,
      },
    })
    .json();
};

const buildSortAndFilters = (sortBy?: string) => {
  let sortParam = "";
  let sortOrder = "";
  let dateFilter = "";
  const sharingFilter = "";

  switch (sortBy) {
    case "Title":
      sortParam = "title";
      sortOrder = "asc";
      break;
    case "Title A-Z":
      sortParam = "title";
      sortOrder = "asc";
      break;
    case "Title Z-A":
      sortParam = "title";
      sortOrder = "desc";
      break;
    case "Owner":
      sortParam = "owner";
      sortOrder = "asc";
      break;
    case "Rating":
      sortParam = "avgRating";
      sortOrder = "desc";
      break;
    case "Views:least":
      sortParam = "numViews";
      sortOrder = "asc";
      break;
    case "Views:most":
      sortParam = "numViews";
      sortOrder = "desc";
      break;
    case "DateModified:today":
      sortParam = "modified";
      sortOrder = "desc";
      dateFilter = "modified:[NOW-1DAY TO NOW]";
      break;
    case "DateModified:yesterday":
      sortParam = "modified";
      sortOrder = "desc";
      dateFilter = "modified:[NOW-2DAY TO NOW-1DAY]";
      break;
    case "DateModified:last7days":
      sortParam = "modified";
      sortOrder = "desc";
      dateFilter = "modified:[NOW-7DAY TO NOW]";
      break;
    case "DateModified:last30days":
      sortParam = "modified";
      sortOrder = "desc";
      dateFilter = "modified:[NOW-30DAY TO NOW]";
      break;
    case "Most Recent":
      sortParam = "modified";
      sortOrder = "desc";
      break;
    case "Oldest":
      sortParam = "modified";
      sortOrder = "asc";
      break;
    case "Most Views":
      sortParam = "numViews";
      sortOrder = "desc";
      break;
    case "Highest Rated":
      sortParam = "avgRating";
      sortOrder = "desc";
      break;
    default:
      break;
  }

  return { sortParam, sortOrder, dateFilter, sharingFilter };
};

export const getArcGisData = async (
  query: string,
  page: number,
  layerFilters?: string[],
  sortBy?: string,
): Promise<LayerData> => {
  let typeFilter = "";
  if (layerFilters && layerFilters.length > 0) {
    typeFilter = `type:(${layerFilters.map((type) => `"${type}"`).join(" OR ")})`;
  } else {
    typeFilter = `type:("Feature Service" OR "Map Image Service" OR "Map Service" OR "Vector Tile Service" OR "Tiled Imagery" OR "Image Service")`;
  }

  const { sortParam, sortOrder, dateFilter, sharingFilter } =
    buildSortAndFilters(sortBy);

  let finalQuery = query;
  const filters = [typeFilter, dateFilter, sharingFilter].filter(Boolean);

  if (filters.length > 0) {
    finalQuery = query
      ? `${query} AND ${filters.join(" AND ")}`
      : filters.join(" AND ");
  }

  return await arcGisMap
    .get("search", {
      searchParams: {
        f: "json",
        token: arcGisAPIKey,
        num: 100,
        start: page,
        ...(sortParam && { sortField: sortParam, sortOrder }),
        q: finalQuery,
      },
    })
    .json();
};

export const getLivingAtlasLayers = async (
  layerGroupId: string,
  query: string = "",
  layerOption: string = "",
  page: number = 1,
  layerFilters?: string[],
  sortBy?: string,
): Promise<LayerData> => {
  let typeFilter = "";
  if (layerFilters && layerFilters.length > 0) {
    typeFilter = `type:(${layerFilters.map((type) => `"${type}"`).join(" OR ")})`;
  } else {
    typeFilter = `type:("Feature Service" OR "Map Image Service" OR "Map Service" OR "Vector Tile Service" OR "Tiled Imagery" OR "Image Service")`;
  }

  const { sortParam, sortOrder, dateFilter, sharingFilter } =
    buildSortAndFilters(sortBy);

  let finalQuery = query;
  const filters = [typeFilter, dateFilter, sharingFilter].filter(Boolean);

  if (filters.length > 0) {
    finalQuery = query
      ? `${query} AND ${filters.join(" AND ")}`
      : filters.join(" AND ");
  }

  return await arcGisMap
    .get(`content/groups/${layerGroupId}/search`, {
      searchParams: {
        f: "json",
        token: arcGisAPIKey,
        start: page,
        ...(layerOption && { filter: `tags:("${layerOption}")` }),
        num: 100,
        ...(sortParam && { sortField: sortParam, sortOrder }),
        q: finalQuery,
      },
    })
    .json();
};

export interface LayerDetails {
  id: string;
  title: string;
  owner: string;
  modified: string;
  thumbnail: string;
  type: string;
  snippet: string;
  access: string;
  accessInformation: string;
  description: string;
  typeKeywords?: string[];
  size?: number;
  avgRating?: number;
  tags?: string[];
  licenseInfo?: string;
  url?: string;
  error?: {
    code: number;
  };
}

export const getLayerDetails = async (
  layerId: string,
): Promise<LayerDetails> => {
  return await arcGisMap
    .get(`content/items/${layerId}`, {
      searchParams: {
        f: "json",
        token: arcGisAPIKey,
      },
    })
    .json();
};

interface GetLocationSuggestionProps {
  address_query: string;
  max_locations_suggestions: number;
}

// Geocoding apis

export const getLocationSuggestions = async (
  props: GetLocationSuggestionProps,
) => {
  if (!arcGisAPIKey) {
    console.log(`variable {arcGisAPIKey} is undefined or either empty`);
    throw new Error("ARCGIS_API_KEY not present!");
  }

  const { address_query, max_locations_suggestions } = props;

  const params: Record<string, string | number | boolean> = {
    f: "json",
    maxLocations: max_locations_suggestions,
    outSR: 102100,
    text: address_query,
    token: arcGisAPIKey as string,
  };

  return await arcGisGeocode
    .get("suggest", {
      searchParams: params,
    })
    .json<GetLocationSuggestionsResponse>();
};

export interface LocationSuggestionType {
  text: string;
  magicKey: string;
  isCollection: boolean;
}

interface GetLocationSuggestionsResponse {
  suggestions: LocationSuggestionType[];
}

export interface GetLocationCandidatesProps {
  query: string;
  magicKey?: string;
  maxLocations?: number;
}

export interface LocationCandidateType {
  address: string;
  attributes: Record<string, string>;
  extent: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  };
  location: {
    x: number; // lon
    y: number; // lat
  };
}

export interface GetLocationCandidatesResponse {
  candidates: LocationCandidateType[];
  spatialReference: {
    latestWkid: number;
    wkid: number;
  };
}

export const getLocationCandidates = async (
  props: GetLocationCandidatesProps,
) => {
  const { query, magicKey, maxLocations = 5 } = props;

  const params: Record<string, string | number | boolean> = {
    f: "json",
    maxLocations,
    outSR: 102100,
    token: arcGisAPIKey as string,
  };

  // If we have a magicKey (coming from suggest), include it
  if (magicKey) {
    params.magicKey = magicKey;
  }

  if (query.trim().length > 0) {
    params.singleLine = query;
  }

  return await arcGisGeocode
    .get("findAddressCandidates", {
      searchParams: params,
    })
    .json<GetLocationCandidatesResponse>();
};

// Authentication APIs
const LOGIN_API_URL =
  import.meta.env.VITE_LOGIN_API_URL ||
  "https://lm-product-dev-be-cyfzfhf3gjgtezhp.eastus-01.azurewebsites.net/user/login";

export interface LoginRequest {
  reg_email: string;
  password: string;
}

export interface LoginResponse {
  success?: boolean;
  message?: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
  [key: string]: any;
}

export const login = async (
  credentials: LoginRequest,
): Promise<LoginResponse> => {
  try {
    const response = await fetch(LOGIN_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.error ||
        errorData.message ||
        `HTTP error! status: ${response.status}`;
      const error = new Error(errorMessage) as Error & {
        data: Record<string, unknown>;
        status: number;
      };
      error.data = errorData;
      error.status = response.status;
      throw error;
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error during login:", error);
    throw error;
  }
};
