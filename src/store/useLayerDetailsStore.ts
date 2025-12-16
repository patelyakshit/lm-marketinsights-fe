import { create } from "zustand";

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

interface LayerDetailsState {
  isOpen: boolean;
  layerId: string | null;
  layerDetails: LayerDetails | null;
  isLoading: boolean;
  error: string | null;
  openLayerDetails: (layerId: string) => void;
  closeLayerDetails: () => void;
  setLayerDetails: (details: LayerDetails | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useLayerDetailsStore = create<LayerDetailsState>((set) => ({
  isOpen: false,
  layerId: null,
  layerDetails: null,
  isLoading: false,
  error: null,
  openLayerDetails: (layerId: string) =>
    set({
      isOpen: true,
      layerId,
      error: null,
    }),
  closeLayerDetails: () =>
    set({
      isOpen: false,
      layerId: null,
      layerDetails: null,
      error: null,
    }),
  setLayerDetails: (details: LayerDetails | null) =>
    set({ layerDetails: details }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
}));
