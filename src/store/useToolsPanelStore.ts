/**
 * Tools Panel Store
 * Manages the active tab and collapsed state for the Tools & Insights panel
 */

import { create } from "zustand";

export type ToolsPanelTab = "layers" | "analyze" | "list" | "map-key";

interface ToolsPanelStore {
  activeTab: ToolsPanelTab;
  isCollapsed: boolean;
  setActiveTab: (tab: ToolsPanelTab) => void;
  setIsCollapsed: (collapsed: boolean) => void;
  expandPanel: () => void;
  collapsePanel: () => void;
  switchToAnalyze: () => void;
  switchToLayers: () => void;
  switchToList: () => void;
  /** Opens the panel and switches to analyze tab - used for lifestyle reports */
  openAnalysisView: () => void;
}

export const useToolsPanelStore = create<ToolsPanelStore>((set) => ({
  activeTab: "layers",
  isCollapsed: true,

  setActiveTab: (tab) => set({ activeTab: tab }),

  setIsCollapsed: (collapsed) => set({ isCollapsed: collapsed }),

  expandPanel: () => set({ isCollapsed: false }),

  collapsePanel: () => set({ isCollapsed: true }),

  switchToAnalyze: () => set({ activeTab: "analyze" }),

  switchToLayers: () => set({ activeTab: "layers" }),

  switchToList: () => set({ activeTab: "list" }),

  /** Opens the panel (expands it) and switches to analyze tab */
  openAnalysisView: () => set({ activeTab: "analyze", isCollapsed: false }),
}));

export default useToolsPanelStore;
