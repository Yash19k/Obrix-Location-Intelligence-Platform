import apiClient from './apiClient'

const locationService = {
  list: () => apiClient.get('/api/v1/locations/'),
  create: (payload) => apiClient.post('/api/v1/locations/', payload),
  delete: (id) => apiClient.delete(`/api/v1/locations/${id}/`),
}

export default locationService
