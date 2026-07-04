/** Report service — wraps all report API calls. */

import apiClient from './apiClient'

const reportService = {
  /** GET /reports/ */
  list: () => apiClient.get('/reports/'),

  /** POST /reports/ */
  create: (data) => apiClient.post('/reports/', data),

  /** GET /reports/{id}/ */
  get: (id) => apiClient.get(`/reports/${id}/`),

  /** DELETE /reports/{id}/ */
  delete: (id) => apiClient.delete(`/reports/${id}/`),

  /** GET /reports/{id}/export/ — Phase 8 */
  export: (id) =>
    apiClient.get(`/reports/${id}/export/`, { responseType: 'blob' }),
}

export default reportService
