/**
 * MapView — Leaflet map container.
 *
 * Phase 2 fix: No longer uses `absolute inset-0`.
 * Parent (flex-1 relative) gives this div its dimensions.
 * h-full w-full fills whatever space the flex layout allocates.
 */

import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'
import {
  MapContainer,
  TileLayer,
  ZoomControl,
  ScaleControl,
  useMap,
} from 'react-leaflet'
import useMapStore from '@/store/mapStore'
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/constants'
import MarkerLayer from './MarkerLayer'

// ── MapEventBridge ────────────────────────────────────────────────────────────
// Watches mapStore.mapCenter and calls map.flyTo() — bridges external state
// (search results, locate-me) to the internal Leaflet map instance.

let _prevCenter = null

function MapEventBridge() {
  const map = useMap()
  const { mapCenter, mapZoom } = useMapStore()

  useEffect(() => {
    if (!mapCenter) return
    const [lat, lng] = mapCenter
    if (_prevCenter && _prevCenter[0] === lat && _prevCenter[1] === lng) return
    _prevCenter = mapCenter
    map.flyTo([lat, lng], mapZoom ?? map.getZoom(), {
      duration: 1.2,
      easeLinearity: 0.5,
    })
  }, [mapCenter, mapZoom])

  return null
}

// ── MapView ───────────────────────────────────────────────────────────────────

export default function MapView() {
  return (
    // h-full w-full — fills the flex-1 parent in Analyze.jsx
    <div className="h-full w-full">
      <MapContainer
        center={DEFAULT_MAP_CENTER}
        zoom={DEFAULT_MAP_ZOOM}
        className="h-full w-full"
        zoomControl={false}
        scrollWheelZoom
        doubleClickZoom={false}
      >
        {/* CartoDB Dark Matter — professional dark basemap */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />

        <ZoomControl position="bottomright" />
        <ScaleControl position="bottomright" imperial={false} />
        <MarkerLayer />
        <MapEventBridge />
      </MapContainer>
    </div>
  )
}
