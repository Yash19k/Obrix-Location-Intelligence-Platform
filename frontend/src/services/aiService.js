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

  /** POST /ai/chat/ — conversational AI Location Consultant */
  chat: (payload) => apiClient.post('/ai/chat/', payload),

  /** GET /ai/conversations/ — list user persistent conversations */
  listConversations: () => apiClient.get('/ai/conversations/'),

  /** POST /ai/conversations/ — create conversation */
  createConversation: (payload) => apiClient.post('/ai/conversations/', payload),

  /** GET /ai/conversations/{id}/ — retrieve conversation detail */
  getConversation: (id) => apiClient.get(`/ai/conversations/${id}/`),

  /** PATCH /ai/conversations/{id}/ — update conversation (e.g. rename title) */
  updateConversation: (id, payload) => apiClient.patch(`/ai/conversations/${id}/`, payload),

  /** DELETE /ai/conversations/{id}/ — delete conversation */
  deleteConversation: (id) => apiClient.delete(`/ai/conversations/${id}/`),

  /** GET /ai/conversations/{id}/messages/ — list messages for conversation */
  getMessages: (id) => apiClient.get(`/ai/conversations/${id}/messages/`),
}

export default aiService

