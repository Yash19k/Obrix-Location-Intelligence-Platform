/**
 * Auth service — wraps all authentication API calls.
 * Components should never call apiClient directly; use services instead.
 */

import apiClient from './apiClient'

const authService = {
  /** POST /auth/register/ */
  register: (data) => apiClient.post('/auth/register/', data),

  /** POST /auth/login/ — returns { access, refresh, user } */
  login: (email, password) =>
    apiClient.post('/auth/login/', { email, password }),

  /** POST /auth/logout/ — blacklists the refresh token */
  logout: (refreshToken) =>
    apiClient.post('/auth/logout/', { refresh: refreshToken }),

  /** GET /auth/me/ */
  getProfile: () => apiClient.get('/auth/me/'),

  /** PATCH /auth/me/ */
  updateProfile: (data) => apiClient.patch('/auth/me/', data),
}

export default authService
