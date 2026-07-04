/** Analysis store — tracks in-flight requests and results. */

import { create } from 'zustand'
import analysisService from '@/services/analysisService'

const useAnalysisStore = create((set, get) => ({
  // ── State ─────────────────────────────────────────────────────────────────
  requests: [],
  currentRequest: null,
  isSubmitting: false,
  isLoading: false,
  error: null,

  // ── Actions ───────────────────────────────────────────────────────────────
  submitAnalysis: async (payload) => {
    set({ isSubmitting: true, error: null, currentRequest: null })
    try {
      const { data } = await analysisService.create(payload)
      set({ currentRequest: data, isSubmitting: false })
      return { success: true, data }
    } catch (err) {
      const message = err.response?.data?.message || 'Analysis failed. Please try again.'
      set({ error: message, isSubmitting: false })
      return { success: false, error: message }
    }
  },

  fetchList: async () => {
    set({ isLoading: true })
    try {
      const { data } = await analysisService.list()
      set({ requests: data.results || data, isLoading: false })
    } catch (err) {
      // 401 = not authenticated yet (Phase 1) — fail silently
      if (err.response?.status !== 401) {
        console.warn('fetchList error:', err.message)
      }
      set({ isLoading: false })
    }
  },

  fetchOne: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await analysisService.get(id)
      set({ currentRequest: data, isLoading: false })
      return data
    } catch (err) {
      set({ error: 'Failed to load analysis.', isLoading: false })
    }
  },

  setCurrentRequest: (req) => set({ currentRequest: req }),
  clearCurrent: () => set({ currentRequest: null, error: null }),
  clearError: () => set({ error: null }),
}))

export default useAnalysisStore
