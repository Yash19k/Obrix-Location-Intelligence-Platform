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
  { value: 'pharmacy',   label: 'Pharmacy / Medical Store',  icon: '💊', image: '/pharmacy.png' },
  { value: 'stationery', label: 'Stationery / Book Store',  icon: '📚', image: '/statinary.png' },
  { value: 'cafe',       label: 'Cafe / Restaurant',        icon: '☕', image: '/cafe.png' },
  { value: 'grocery',    label: 'Grocery / Supermarket',    icon: '🛒', image: '/grocery.png' },
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

// Map defaults — centered on Ahmedabad
export const DEFAULT_MAP_CENTER = [23.0225, 72.5714]
export const DEFAULT_MAP_ZOOM = 13
export const ANALYSIS_MAP_ZOOM = 15
export const AHMEDABAD_BOUNDS = [
  [22.80, 72.35], // South-West corner
  [23.25, 72.80], // North-East corner
]

// Factor display config — keys must match intelligence/scoring/engine.py factor keys
export const FACTOR_META = {
  accessibility: { label: 'Accessibility',           icon: '🛣️',  description: 'Road network & transit access' },
  infrastructure:{ label: 'Infrastructure',          icon: '⚡',  description: 'Hospitals, schools, banks, fuel' },
  commercial:    { label: 'Commercial Activity',     icon: '🛍️', description: 'Dining & financial services density' },
  competition:   { label: 'Competition',             icon: '🏪',  description: 'Market saturation for this business type' },
  environment:   { label: 'Environmental Suitability', icon: '🌿', description: 'Green space & environmental factors' },
  population:    { label: 'Population & Catchment',  icon: '👥',  description: 'Residential and target demographics density' },
}
