import { LayerData } from "../api";
import { toastSuccess } from "./toast";

export type FavoriteLayer = LayerData["results"][0];

const FAVORITES_STORAGE_KEY = "lm-map-viewer-favorites";

export const getFavoriteLayers = (): FavoriteLayer[] => {
  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error loading favorites from localStorage:", error);
    return [];
  }
};

export const addToFavorites = (layer: FavoriteLayer): void => {
  try {
    const favorites = getFavoriteLayers();
    const existingIndex = favorites.findIndex((fav) => fav.id === layer.id);

    if (existingIndex === -1) {
      const updatedFavorites = [...favorites, layer];
      localStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(updatedFavorites),
      );
      toastSuccess("Layer added to favorites");
    } else {
      const updatedFavorites = [...favorites];
      updatedFavorites[existingIndex] = {
        ...updatedFavorites[existingIndex],
        ...layer,
      };
      localStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(updatedFavorites),
      );
      toastSuccess("Layer updated in favorites");
    }
  } catch (error) {
    console.error("Error adding to favorites:", error);
  }
};

export const removeFromFavorites = (layerId: string): void => {
  try {
    const favorites = getFavoriteLayers();
    const updatedFavorites = favorites.filter((fav) => fav.id !== layerId);
    localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(updatedFavorites),
    );
    toastSuccess("Layer removed from favorites");
  } catch (error) {
    console.error("Error removing from favorites:", error);
  }
};

export const isFavorite = (layerId: string): boolean => {
  try {
    const favorites = getFavoriteLayers();
    return favorites.some((fav) => fav.id === layerId);
  } catch (error) {
    console.error("Error checking favorite status:", error);
    return false;
  }
};

export const searchFavorites = (query: string): FavoriteLayer[] => {
  try {
    const favorites = getFavoriteLayers();
    if (!query.trim()) {
      return favorites;
    }

    const searchTerm = query.toLowerCase();
    return favorites.filter(
      (layer) =>
        layer.title.toLowerCase().includes(searchTerm) ||
        layer.description?.toLowerCase().includes(searchTerm) ||
        layer.tags.some((tag) => tag.toLowerCase().includes(searchTerm)) ||
        layer.type.toLowerCase().includes(searchTerm),
    );
  } catch (error) {
    console.error("Error searching favorites:", error);
    return [];
  }
};
