import { create } from 'zustand'
import aiService from '@/services/aiService'

const useReportStore = create((set, get) => ({
  reports: [],
  activeReport: null,
  isGenerating: false,
  isLoading: false,
  error: null,

  fetchReports: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await aiService.listReports()
      const list = Array.isArray(data) ? data : data.results || []
      set({ reports: list, isLoading: false })
    } catch (err) {
      if (err.response?.status !== 401) {
        console.warn('fetchReports error:', err.message)
      }
      set({ isLoading: false })
    }
  },

  generateReport: async (analysisData) => {
    set({ isGenerating: true, error: null })
    try {
      const { data } = await aiService.generateReport({ analysis_data: analysisData })
      set((state) => ({
        reports: [data, ...state.reports],
        activeReport: data,
        isGenerating: false,
      }))
      return { success: true, data }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to generate AI report.'
      set({ isGenerating: false, error: msg })
      return { success: false, error: msg }
    }
  },

  regenerateReport: async (id) => {
    set({ isGenerating: true, error: null })
    try {
      const { data } = await aiService.regenerateReport(id)
      set((state) => ({
        reports: state.reports.map((r) => (r.id === id ? data : r)),
        activeReport: data,
        isGenerating: false,
      }))
      return { success: true, data }
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to regenerate report.'
      set({ isGenerating: false, error: msg })
      return { success: false, error: msg }
    }
  },

  deleteReport: async (id) => {
    try {
      await aiService.deleteReport(id)
      set((state) => ({
        reports: state.reports.filter((r) => r.id !== id),
        activeReport: state.activeReport?.id === id ? null : state.activeReport,
      }))
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  },

  setActiveReport: (report) => set({ activeReport: report }),
  closeReportViewer: () => set({ activeReport: null }),
}))

export default useReportStore
