/**
 * mapStore — manages all map, marker, and inline analysis state.
 *
 * Phase 2: Expanded to include business type, radius,
 * analysis result, and panel visibility.
 */

import { create } from 'zustand'
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/constants'

const useMapStore = create((set) => ({
  // ── Map viewport ───────────────────────────────────────────────────────────
  mapCenter: DEFAULT_MAP_CENTER,
  mapZoom: DEFAULT_MAP_ZOOM,

  // ── Selected marker position ───────────────────────────────────────────────
  selectedLat: null,
  selectedLon: null,

  // ── Search ────────────────────────────────────────────────────────────────
  searchQuery: '',
  isLocating: false,

  // ── Analysis form state ───────────────────────────────────────────────────
  businessType: 'retail',
  radius: 1000,

  // ── Analysis result ───────────────────────────────────────────────────────
  isAnalyzing: false,
  analysisResult: null,   // The full API response object
  analysisError: null,
  showPanel: false,       // Controls right slide-in panel

  // ── Actions ───────────────────────────────────────────────────────────────

  /** Drop or move the marker — also flies the map to the new point. */
  selectCoordinates: (lat, lon) =>
    set({
      selectedLat: lat,
      selectedLon: lon,
      mapCenter: [lat, lon],
      // Clear previous result when location changes
      analysisResult: null,
      showPanel: false,
      analysisError: null,
    }),

  setMapCenter: (center, zoom) =>
    set({ mapCenter: center, ...(zoom !== undefined ? { mapZoom: zoom } : {}) }),

  setSearchQuery: (q) => set({ searchQuery: q }),
  setLocating: (val) => set({ isLocating: val }),

  clearSelection: () =>
    set({
      selectedLat: null,
      selectedLon: null,
      analysisResult: null,
      showPanel: false,
      analysisError: null,
    }),

  setBusinessType: (type) => set({ businessType: type }),
  setRadius: (r) => set({ radius: r }),

  setIsAnalyzing: (val) => set({ isAnalyzing: val }),

  setAnalysisResult: (result) =>
    set({ analysisResult: result, showPanel: true, isAnalyzing: false, analysisError: null }),

  setAnalysisError: (err) =>
    set({ analysisError: err, isAnalyzing: false }),

  closePanel: () => set({ showPanel: false }),
}))

export default useMapStore
