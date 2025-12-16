/**
 * Layer Storage Utility
 * Persists user-added layers to localStorage so they survive page refreshes.
 */

import { AppliedLayer } from "../schema";

const STORAGE_KEY = "lm_user_added_layers";

export interface StoredLayer {
  id: string;
  title: string;
  url: string;
  type: string;
  layerType: string;
  itemId?: string;
  visibility?: boolean;
  opacity?: number;
  addedAt: number;
}

/**
 * Save a user-added layer to localStorage
 */
export function saveUserLayer(layer: AppliedLayer): void {
  try {
    const stored = getUserLayers();

    // Don't save duplicates (by URL)
    if (stored.some(l => l.url === layer.url)) {
      console.log(`[LayerStorage] Layer already saved: ${layer.title}`);
      return;
    }

    const layerToStore: StoredLayer = {
      id: layer.id,
      title: layer.title,
      url: layer.url || "",
      type: layer.type || "Feature Layer",
      layerType: layer.layerType || "Feature Layer",
      itemId: layer.itemId,
      visibility: layer.visibility ?? true,
      opacity: layer.opacity ?? 1,
      addedAt: Date.now(),
    };

    stored.push(layerToStore);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    console.log(`[LayerStorage] Saved layer: ${layer.title}`);
  } catch (error) {
    console.error("[LayerStorage] Error saving layer:", error);
  }
}

/**
 * Get all user-added layers from localStorage
 */
export function getUserLayers(): StoredLayer[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as StoredLayer[];
  } catch (error) {
    console.error("[LayerStorage] Error loading layers:", error);
    return [];
  }
}

/**
 * Remove a user-added layer from localStorage
 */
export function removeUserLayer(layerId: string): void {
  try {
    const stored = getUserLayers();
    const filtered = stored.filter(l => l.id !== layerId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    console.log(`[LayerStorage] Removed layer: ${layerId}`);
  } catch (error) {
    console.error("[LayerStorage] Error removing layer:", error);
  }
}

/**
 * Remove a user-added layer by URL
 */
export function removeUserLayerByUrl(url: string): void {
  try {
    const stored = getUserLayers();
    const filtered = stored.filter(l => l.url !== url);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    console.log(`[LayerStorage] Removed layer by URL: ${url}`);
  } catch (error) {
    console.error("[LayerStorage] Error removing layer:", error);
  }
}

/**
 * Clear all user-added layers from localStorage
 */
export function clearUserLayers(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log("[LayerStorage] Cleared all user layers");
  } catch (error) {
    console.error("[LayerStorage] Error clearing layers:", error);
  }
}

/**
 * Convert stored layers back to AppliedLayer format for the store
 */
export function storedLayersToApplied(storedLayers: StoredLayer[]): AppliedLayer[] {
  return storedLayers.map(stored => ({
    id: stored.id,
    title: stored.title,
    url: stored.url,
    type: stored.type,
    layerType: stored.layerType,
    itemId: stored.itemId,
    visibility: stored.visibility ?? true,
    opacity: stored.opacity ?? 1,
    popupEnabled: true,
    labelsVisible: true,
    isAddedFromWebMap: false, // Mark as user-added
  }));
}
