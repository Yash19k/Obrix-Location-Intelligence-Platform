/**
 * MarkerLayer — handles map click events and renders a draggable marker.
 *
 * Must be rendered inside a <MapContainer> so useMapEvents/useMap work.
 *
 * Uses a pure SVG DivIcon — no external image files needed (avoids Vite
 * asset-hash issues with Leaflet's default marker-icon.png).
 */

import L from 'leaflet'
import { Marker, useMapEvents } from 'react-leaflet'
import useMapStore from '@/store/mapStore'

// ── Custom SVG marker icon ────────────────────────────────────────────────────

const MARKER_SVG = `
<svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
  <filter id="shadow">
    <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.5)"/>
  </filter>
  <g filter="url(#shadow)">
    <path d="M16 2C9.373 2 4 7.373 4 14c0 8.5 12 26 12 26s12-17.5 12-26C28 7.373 22.627 2 16 2z"
      fill="#6366f1" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
  </g>
  <circle cx="16" cy="14" r="6" fill="white" opacity="0.95"/>
  <circle cx="16" cy="14" r="3.5" fill="#6366f1"/>
</svg>
`

const markerIcon = L.divIcon({
  className: '',
  html: `<div style="cursor:grab;filter:drop-shadow(0 4px 12px rgba(99,102,241,0.6))">${MARKER_SVG}</div>`,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -44],
})

// ── MarkerLayer ───────────────────────────────────────────────────────────────

export default function MarkerLayer() {
  const { selectedLat, selectedLon, selectCoordinates } = useMapStore()

  // Attach click handler to the map
  useMapEvents({
    click(e) {
      selectCoordinates(
        parseFloat(e.latlng.lat.toFixed(6)),
        parseFloat(e.latlng.lng.toFixed(6)),
      )
    },
  })

  // Don't render until a location is selected
  if (selectedLat === null || selectedLon === null) return null

  return (
    <Marker
      position={[selectedLat, selectedLon]}
      icon={markerIcon}
      draggable
      eventHandlers={{
        dragend(e) {
          const { lat, lng } = e.target.getLatLng()
          selectCoordinates(
            parseFloat(lat.toFixed(6)),
            parseFloat(lng.toFixed(6)),
          )
        },
      }}
    />
  )
}
