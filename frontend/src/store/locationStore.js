import { create } from 'zustand'
import locationService from '@/services/locationService'

const useLocationStore = create((set, get) => ({
  savedLocations: [],
  isLoading: false,
  isSaving: false,
  error: null,

  // Comparison modal state
  isComparisonOpen: false,
  secondaryResult: null,

  fetchLocations: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await locationService.list()
      const list = Array.isArray(data) ? data : data.results || []
      set({ savedLocations: list, isLoading: false })
    } catch (err) {
      if (err.response?.status !== 401) {
        console.warn('fetchLocations failed:', err.message)
      }
      set({ isLoading: false })
    }
  },

  saveLocation: async (payload) => {
    set({ isSaving: true, error: null })
    try {
      const { data } = await locationService.create(payload)
      set((state) => ({
        savedLocations: [data, ...state.savedLocations],
        isSaving: false,
      }))
      return { success: true, data }
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.name?.[0] || 'Failed to save location'
      set({ isSaving: false, error: msg })
      return { success: false, error: msg }
    }
  },

  deleteLocation: async (id) => {
    try {
      await locationService.delete(id)
      set((state) => ({
        savedLocations: state.savedLocations.filter((loc) => loc.id !== id),
      }))
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  },

  openComparison: (secondaryRes) => set({ isComparisonOpen: true, secondaryResult: secondaryRes }),
  closeComparison: () => set({ isComparisonOpen: false, secondaryResult: null }),
}))

export default useLocationStore
