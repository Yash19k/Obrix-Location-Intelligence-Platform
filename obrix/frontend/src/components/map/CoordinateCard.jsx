/**
 * CoordinateCard — shows live lat/lon and current zoom level.
 * Positioned at the bottom of the left sidebar, over the map.
 */

import { MapPin, ZoomIn } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useMap } from 'react-leaflet'
import useMapStore from '@/store/mapStore'

// Inner component — must live inside MapContainer to use useMap()
function ZoomDisplay() {
  const map = useMap()
  const [zoom, setZoom] = useState(map.getZoom())

  useEffect(() => {
    const onZoom = () => setZoom(Math.round(map.getZoom()))
    map.on('zoom', onZoom)
    return () => map.off('zoom', onZoom)
  }, [map])

  return (
    <div className="flex items-center gap-1.5">
      <ZoomIn className="w-3.5 h-3.5 text-white/30" />
      <span className="text-xs text-white/50">Zoom {zoom}</span>
    </div>
  )
}

export { ZoomDisplay }

// Standalone coord display — rendered outside MapContainer
export default function CoordinateCard() {
  const { selectedLat, selectedLon } = useMapStore()

  if (selectedLat === null) return null

  return (
    <div className="flex items-center gap-2 px-3 py-2
                    bg-surface-900/90 backdrop-blur border border-white/10
                    rounded-xl shadow-lg">
      <MapPin className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
      <span className="text-xs font-mono text-white/80">
        {selectedLat.toFixed(5)}, {selectedLon.toFixed(5)}
      </span>
    </div>
  )
}
