/** Analysis service — wraps all analysis API calls. */

import apiClient from './apiClient'

const analysisService = {
  /** POST /analysis/ — submit new analysis */
  create: (data) => apiClient.post('/analysis/', data),

  /** GET /analysis/ — list user's analyses */
  list: (params) => apiClient.get('/analysis/', { params }),

  /** GET /analysis/{id}/ — get request + nested result */
  get: (id) => apiClient.get(`/analysis/${id}/`),

  /** GET /analysis/{id}/result/ — get result only */
  getResult: (id) => apiClient.get(`/analysis/${id}/result/`),

  /** DELETE /analysis/{id}/ */
  delete: (id) => apiClient.delete(`/analysis/${id}/`),

  /** GET /analysis/weights/ */
  getWeights: () => apiClient.get('/analysis/weights/'),
}

export default analysisService
