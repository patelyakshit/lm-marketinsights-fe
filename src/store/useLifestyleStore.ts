/**
 * Lifestyle Report Store
 * Manages lifestyle/tapestry analysis state using Zustand
 */

import { create } from "zustand";
import { LifestyleSegment, LifestyleReportPayload } from "../types/operations";

interface LifestyleReport {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
  totalHouseholds: number;
  segments: LifestyleSegment[];
  businessInsight: string;
  generatedAt: Date;
  bufferMiles?: number;
  driveTimeMinutes?: number;
}

interface LifestyleStore {
  // Current report
  currentReport: LifestyleReport | null;

  // History of reports
  reportHistory: LifestyleReport[];

  // Loading state
  isLoading: boolean;

  // View state
  isReportOpen: boolean;

  // Actions
  setReport: (payload: LifestyleReportPayload) => void;
  clearReport: () => void;
  openReport: () => void;
  closeReport: () => void;
  setLoading: (loading: boolean) => void;
  getTopSegment: () => LifestyleSegment | null;
  getSegmentByCode: (code: string) => LifestyleSegment | null;
}

export const useLifestyleStore = create<LifestyleStore>((set, get) => ({
  currentReport: null,
  reportHistory: [],
  isLoading: false,
  isReportOpen: false,

  setReport: (payload) => {
    const report: LifestyleReport = {
      id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      address: payload.address,
      latitude: payload.latitude,
      longitude: payload.longitude,
      totalHouseholds: payload.totalHouseholds,
      segments: payload.segments,
      businessInsight: payload.businessInsight,
      generatedAt: new Date(payload.generatedAt),
      bufferMiles: payload.bufferMiles,
      driveTimeMinutes: payload.driveTimeMinutes,
    };

    set((state) => ({
      currentReport: report,
      reportHistory: [report, ...state.reportHistory.slice(0, 9)], // Keep last 10
      isLoading: false,
      isReportOpen: true,
    }));
  },

  clearReport: () =>
    set({
      currentReport: null,
      isReportOpen: false,
    }),

  openReport: () => set({ isReportOpen: true }),

  closeReport: () => set({ isReportOpen: false }),

  setLoading: (loading) => set({ isLoading: loading }),

  getTopSegment: () => {
    const { currentReport } = get();
    if (currentReport && currentReport.segments.length > 0) {
      return currentReport.segments[0];
    }
    return null;
  },

  getSegmentByCode: (code) => {
    const { currentReport } = get();
    if (currentReport) {
      return currentReport.segments.find((s) => s.code === code) || null;
    }
    return null;
  },
}));

export default useLifestyleStore;
