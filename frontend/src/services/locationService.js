/** Location service — wraps all saved location API calls. */

import apiClient from './apiClient'

const locationService = {
  /** GET /locations/ — list user's saved locations */
  list: () => apiClient.get('/locations/'),

  /** POST /locations/ — save a new location */
  create: (payload) => apiClient.post('/locations/', payload),

  /** DELETE /locations/{id}/ — delete a saved location */
  delete: (id) => apiClient.delete(`/locations/${id}/`),
}

export default locationService
