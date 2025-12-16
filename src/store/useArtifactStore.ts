import { create } from "zustand";
import { Artifact } from "../types/artifacts";

interface ArtifactStore {
  activeArtifact: Artifact | null;

  setActiveArtifact: (artifact: Artifact | null) => void;
}

export const useArtifactStore = create<ArtifactStore>((set) => ({
  activeArtifact: null,
  setActiveArtifact: (artifact: Artifact | null) =>
    set({ activeArtifact: artifact }),
}));
