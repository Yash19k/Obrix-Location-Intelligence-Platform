import apiClient from './apiClient'

const aiService = {
  /** POST /ai/report/ — generate full 13-section AI consulting report */
  generateReport: (payload) => apiClient.post('/ai/report/', payload),

  /** GET /reports/ — list all user AI reports */
  listReports: () => apiClient.get('/reports/'),

  /** GET /reports/{id}/ — retrieve specific report detail */
  getReport: (id) => apiClient.get(`/reports/${id}/`),

  /** DELETE /reports/{id}/ — delete report */
  deleteReport: (id) => apiClient.delete(`/reports/${id}/`),

  /** POST /reports/{id}/regenerate/ — regenerate report */
  regenerateReport: (id) => apiClient.post(`/reports/${id}/regenerate/`),
}

export default aiService
