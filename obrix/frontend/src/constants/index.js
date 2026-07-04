/** Application-wide constants — no business logic here */

export const APP_NAME = 'Obrix'
export const APP_TAGLINE = 'Intelligent Location Intelligence'

// API
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

// Auth
export const ACCESS_TOKEN_KEY = 'obrix_access'
export const REFRESH_TOKEN_KEY = 'obrix_refresh'
export const USER_KEY = 'obrix_user'

// Analysis
export const BUSINESS_TYPES = [
  { value: 'retail',    label: 'Retail Store',            icon: '🏪' },
  { value: 'hospital',  label: 'Hospital / Clinic',       icon: '🏥' },
  { value: 'ev_station',label: 'EV Charging Station',     icon: '⚡' },
  { value: 'warehouse', label: 'Warehouse / Logistics',   icon: '🏭' },
  { value: 'telecom',   label: 'Telecom Tower',           icon: '📡' },
  { value: 'renewable', label: 'Renewable Energy Project',icon: '🌱' },
  { value: 'generic',   label: 'Generic Location',        icon: '📍' },
]

export const RADIUS_OPTIONS = [
  { value: 500,   label: '500m' },
  { value: 1000,  label: '1 km' },
  { value: 2000,  label: '2 km' },
  { value: 5000,  label: '5 km' },
  { value: 10000, label: '10 km' },
]

// Score tiers
export const SCORE_TIERS = {
  EXCELLENT: { min: 80, label: 'Excellent', className: 'badge-excellent', color: '#34d399' },
  GOOD:      { min: 60, label: 'Good',      className: 'badge-good',      color: '#60a5fa' },
  FAIR:      { min: 40, label: 'Fair',      className: 'badge-fair',      color: '#fbbf24' },
  POOR:      { min: 0,  label: 'Poor',      className: 'badge-poor',      color: '#f87171' },
}

// Map defaults — centered on India for demo
export const DEFAULT_MAP_CENTER = [20.5937, 78.9629]
export const DEFAULT_MAP_ZOOM = 5
export const ANALYSIS_MAP_ZOOM = 13

// Factor display config
export const FACTOR_META = {
  accessibility: { label: 'Accessibility',  icon: '🛣️',  description: 'Road network & transit access' },
  population:    { label: 'Population',     icon: '👥',  description: 'Residents within analysis radius' },
  competition:   { label: 'Competition',    icon: '🏪',  description: 'Nearby competing businesses' },
  infrastructure:{ label: 'Infrastructure', icon: '⚡',  description: 'Utilities & connectivity' },
  land_use:      { label: 'Land Use',       icon: '🗺️',  description: 'Zoning & compatibility' },
}
