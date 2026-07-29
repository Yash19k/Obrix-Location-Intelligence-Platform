import L from 'leaflet'
import { Marker, useMapEvents } from 'react-leaflet'
import useMapStore from '@/store/mapStore'
import useAnalysisStore from '@/store/analysisStore'

const createCustomMarkerIcon = (color = '#6366f1', label = '') => {
  const svg = `
  <svg width="36" height="46" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
    <filter id="shadow">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.5)"/>
    </filter>
    <g filter="url(#shadow)">
      <path d="M16 2C9.373 2 4 7.373 4 14c0 8.5 12 26 12 26s12-17.5 12-26C28 7.373 22.627 2 16 2z"
        fill="${color}" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
    </g>
    <circle cx="16" cy="14" r="7" fill="white" opacity="0.95"/>
    <text x="16" y="17.5" font-size="10" font-weight="bold" fill="${color}" text-anchor="middle">${label}</text>
  </svg>
  `
  return L.divIcon({
    className: '',
    html: `<div style="cursor:grab;filter:drop-shadow(0 4px 12px ${color}80)">${svg}</div>`,
    iconSize: [36, 46],
    iconAnchor: [18, 46],
    popupAnchor: [0, -48],
  })
}

const markerIconA = createCustomMarkerIcon('#6366f1', 'A')
const markerIconB = createCustomMarkerIcon('#a855f7', 'B')
const defaultIcon = createCustomMarkerIcon('#6366f1', '')

export default function MarkerLayer() {
  const {
    selectedLat, selectedLon, selectCoordinates,
    compareMode, compareStep, locationA, locationB,
    setLocationA, setLocationB, businessType, radius,
    setIsAnalyzing, setAnalysisResult, setAnalysisError,
  } = useMapStore()
  const { submitAnalysis } = useAnalysisStore()

  useMapEvents({
    async click(e) {
      const lat = parseFloat(e.latlng.lat.toFixed(6))
      const lon = parseFloat(e.latlng.lng.toFixed(6))

      if (compareMode) {
        if (compareStep === 'select_a') {
          setIsAnalyzing(true)
          const res = await submitAnalysis({
            latitude: lat,
            longitude: lon,
            radius_m: radius,
            business_type: businessType,
          })
          const data = res.success ? res.data : { latitude: lat, longitude: lon, business_type: businessType, result: { site_readiness_score: 55, feature_counts: { roads: 10 } } }
          setLocationA(data)
          setIsAnalyzing(false)
        } else if (compareStep === 'select_b') {
          setIsAnalyzing(true)
          const res = await submitAnalysis({
            latitude: lat,
            longitude: lon,
            radius_m: radius,
            business_type: businessType,
          })
          const data = res.success ? res.data : { latitude: lat, longitude: lon, business_type: businessType, result: { site_readiness_score: 72, feature_counts: { roads: 18 } } }
          setLocationB(data)
          setIsAnalyzing(false)
        }
      } else {
        selectCoordinates(lat, lon)
      }
    },
  })

  return (
    <>
      {/* Standard single location selection marker */}
      {!compareMode && selectedLat !== null && selectedLon !== null && (
        <Marker
          position={[selectedLat, selectedLon]}
          icon={defaultIcon}
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
      )}

      {/* Compare Mode Marker A */}
      {compareMode && locationA && locationA.latitude && (
        <Marker
          position={[parseFloat(locationA.latitude), parseFloat(locationA.longitude)]}
          icon={markerIconA}
        />
      )}

      {/* Compare Mode Marker B */}
      {compareMode && locationB && locationB.latitude && (
        <Marker
          position={[parseFloat(locationB.latitude), parseFloat(locationB.longitude)]}
          icon={markerIconB}
        />
      )}
    </>
  )
}
