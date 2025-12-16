import { useState, useEffect, useCallback } from "react";
import {
  getFavoriteLayers,
  addToFavorites,
  removeFromFavorites,
  isFavorite as checkIsFavorite,
  searchFavorites,
  FavoriteLayer,
} from "../utils/favoriteStorage";

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<FavoriteLayer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setFavorites(getFavoriteLayers());
  }, []);

  const filteredFavorites = searchQuery
    ? searchFavorites(searchQuery)
    : favorites;

  const toggleFavorite = useCallback((layer: FavoriteLayer) => {
    const isCurrentlyFavorite = checkIsFavorite(layer.id);

    if (isCurrentlyFavorite) {
      removeFromFavorites(layer.id);
    } else {
      addToFavorites(layer);
    }

    setFavorites(getFavoriteLayers());
  }, []);

  const removeFavorite = useCallback((layerId: string) => {
    removeFromFavorites(layerId);
    setFavorites(getFavoriteLayers());
  }, []);

  const checkIsLayerFavorite = useCallback((layerId: string) => {
    return checkIsFavorite(layerId);
  }, []);

  return {
    favorites: filteredFavorites,
    allFavorites: favorites,
    searchQuery,
    setSearchQuery,
    toggleFavorite,
    removeFavorite,
    isFavorite: checkIsLayerFavorite,
    hasFavorites: favorites.length > 0,
  };
};
