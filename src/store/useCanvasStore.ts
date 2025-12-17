/**
 * Canvas Store - Manages canvas view tabs and studio tabs
 */

import { create } from "zustand";

export type CanvasTab = "map" | "studio";
export type StudioContentTab = "marketing" | "placestory";

interface StudioTab {
  id: string;
  type: StudioContentTab;
  title: string;
  createdAt: Date;
}

interface CanvasStore {
  // Main canvas tab (Map View vs Studio)
  activeCanvasTab: CanvasTab;
  setActiveCanvasTab: (tab: CanvasTab) => void;

  // Studio content tabs (Chrome-like tabs)
  studioTabs: StudioTab[];
  activeStudioTabId: string | null;

  // Actions
  addStudioTab: (type: StudioContentTab, title: string) => string;
  removeStudioTab: (tabId: string) => void;
  setActiveStudioTab: (tabId: string) => void;

  // Helper to open studio with a specific tab
  openStudioWithTab: (type: StudioContentTab, title: string) => void;

  // Check if studio has any tabs
  hasStudioTabs: () => boolean;
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  activeCanvasTab: "map",
  studioTabs: [],
  activeStudioTabId: null,

  setActiveCanvasTab: (tab) => set({ activeCanvasTab: tab }),

  addStudioTab: (type, title) => {
    const id = `${type}-${Date.now()}`;
    const newTab: StudioTab = {
      id,
      type,
      title,
      createdAt: new Date(),
    };

    set((state) => ({
      studioTabs: [...state.studioTabs, newTab],
      activeStudioTabId: id,
    }));

    return id;
  },

  removeStudioTab: (tabId) => {
    set((state) => {
      const newTabs = state.studioTabs.filter((t) => t.id !== tabId);
      let newActiveId = state.activeStudioTabId;

      // If removing the active tab, switch to another tab
      if (state.activeStudioTabId === tabId) {
        const removedIndex = state.studioTabs.findIndex((t) => t.id === tabId);
        if (newTabs.length > 0) {
          // Try to select the tab before, otherwise the tab after
          newActiveId = newTabs[Math.max(0, removedIndex - 1)]?.id || null;
        } else {
          newActiveId = null;
        }
      }

      return {
        studioTabs: newTabs,
        activeStudioTabId: newActiveId,
        // If no more tabs, switch back to map view
        activeCanvasTab: newTabs.length === 0 ? "map" : state.activeCanvasTab,
      };
    });
  },

  setActiveStudioTab: (tabId) => set({ activeStudioTabId: tabId }),

  openStudioWithTab: (type, title) => {
    const { studioTabs, addStudioTab, setActiveCanvasTab, setActiveStudioTab } = get();

    // Check if a tab of this type already exists
    const existingTab = studioTabs.find((t) => t.type === type);

    if (existingTab) {
      // Switch to existing tab
      setActiveStudioTab(existingTab.id);
    } else {
      // Create new tab
      addStudioTab(type, title);
    }

    // Switch to studio view
    setActiveCanvasTab("studio");
  },

  hasStudioTabs: () => get().studioTabs.length > 0,
}));

export default useCanvasStore;
