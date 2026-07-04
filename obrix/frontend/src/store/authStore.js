/**
 * Auth store — manages authentication state across the app.
 *
 * Design: Zustand with localStorage persistence for tokens.
 * The store is the single source of truth for auth state.
 */

import { create } from 'zustand'
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY } from '@/constants'
import authService from '@/services/authService'

const useAuthStore = create((set, get) => ({
  // ── State ─────────────────────────────────────────────────────────────────
  user: JSON.parse(localStorage.getItem(USER_KEY) || 'null'),
  accessToken: localStorage.getItem(ACCESS_TOKEN_KEY) || null,
  refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY) || null,
  isLoading: false,
  error: null,

  // ── Computed ──────────────────────────────────────────────────────────────
  isAuthenticated: () => !!get().accessToken,

  // ── Actions ───────────────────────────────────────────────────────────────
  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await authService.login(email, password)
      const { access, refresh, user } = data

      // Persist to localStorage
      localStorage.setItem(ACCESS_TOKEN_KEY, access)
      localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
      localStorage.setItem(USER_KEY, JSON.stringify(user))

      set({ accessToken: access, refreshToken: refresh, user, isLoading: false })
      return { success: true }
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please try again.'
      set({ error: message, isLoading: false })
      return { success: false, error: message }
    }
  },

  register: async (formData) => {
    set({ isLoading: true, error: null })
    try {
      await authService.register(formData)
      set({ isLoading: false })
      return { success: true }
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed.'
      set({ error: message, isLoading: false })
      return { success: false, error: message }
    }
  },

  logout: async () => {
    const { refreshToken } = get()
    try {
      if (refreshToken) await authService.logout(refreshToken)
    } catch {
      // Proceed with local logout even if server call fails
    } finally {
      localStorage.removeItem(ACCESS_TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      set({ user: null, accessToken: null, refreshToken: null, error: null })
    }
  },

  updateUser: (updatedUser) => {
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser))
    set({ user: updatedUser })
  },

  clearError: () => set({ error: null }),
}))

export default useAuthStore
