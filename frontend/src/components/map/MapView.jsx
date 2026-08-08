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
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, AHMEDABAD_BOUNDS } from '@/constants'
import MarkerLayer from './MarkerLayer'

// ── MapEventBridge ────────────────────────────────────────────────────────────
// Watches mapStore.mapCenter and calls map.flyTo() — bridges external state
// (search results, locate-me) to the internal Leaflet map instance.

function MapEventBridge() {
  const map = useMap()
  const { mapCenter, mapZoom } = useMapStore()

  useEffect(() => {
    if (!mapCenter) return
    const [lat, lng] = mapCenter
    const targetZoom = mapZoom || 16

    map.flyTo([lat, lng], targetZoom, {
      duration: 1.0,
      easeLinearity: 0.25,
      noMoveStart: true,
    })
  }, [mapCenter, mapZoom, map])

  return null
}

function MapResizeBridge() {
  const map = useMap()
  const { showPanel } = useMapStore()

  useEffect(() => {
    const container = map.getContainer()
    if (!container) return

    const observer = new ResizeObserver(() => {
      map.invalidateSize({ animate: false })
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [map])

  useEffect(() => {
    // Invalidate size after panel slide-in/out transition
    const timer = setTimeout(() => {
      map.invalidateSize({ animate: false })
    }, 320)
    return () => clearTimeout(timer)
  }, [map, showPanel])

  return null
}

const TILE_LAYERS = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  },
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  },
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: 'abc',
    maxZoom: 19,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    subdomains: 'abc',
    maxZoom: 19,
  },
}

// ── MapView ───────────────────────────────────────────────────────────────────

export default function MapView() {
  const { mapStyle } = useMapStore()
  const activeTileConfig = TILE_LAYERS[mapStyle] || TILE_LAYERS.light

  return (
    // h-full w-full — fills the flex-1 parent in Analyze.jsx
    <div className="h-full w-full relative bg-[#F6F8FC]">
      <MapContainer
        center={DEFAULT_MAP_CENTER}
        zoom={DEFAULT_MAP_ZOOM}
        minZoom={3}
        className="h-full w-full bg-[#F6F8FC]"
        style={{ backgroundColor: '#F6F8FC' }}
        zoomControl={false}
        scrollWheelZoom
        doubleClickZoom={false}
      >
        <TileLayer
          key={mapStyle}
          url={activeTileConfig.url}
          attribution={activeTileConfig.attribution}
          subdomains={activeTileConfig.subdomains}
          maxZoom={activeTileConfig.maxZoom}
        />

        <ZoomControl position="bottomright" />
        <ScaleControl position="bottomright" imperial={false} />
        <MarkerLayer />
        <MapEventBridge />
        <MapResizeBridge />
      </MapContainer>
    </div>
  )
}
