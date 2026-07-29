import L from 'leaflet'
import { Marker, Popup } from 'react-leaflet'
import useMapStore from '@/store/mapStore'
import { CATEGORY_CONFIG } from './LayerControlPanel'

const createCategoryIcon = (category) => {
  const config = CATEGORY_CONFIG[category] || { icon: '📍', color: '#6366f1' }
  const svgHtml = `
    <div style="
      background-color: ${config.color};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.5);
      border: 2px solid white;
    ">
      ${config.icon}
    </div>
  `
  return L.divIcon({
    className: '',
    html: svgHtml,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  })
}

export default function FeatureMarkerLayer() {
  const { analysisResult, activeLayers } = useMapStore()

  if (!analysisResult || !analysisResult.osm_data_snapshot) return null

  const featureItems = analysisResult.osm_data_snapshot.feature_items || {}

  const activeFeatures = []
  Object.entries(featureItems).forEach(([category, items]) => {
    if (activeLayers[category] && Array.isArray(items)) {
      items.forEach((item) => {
        if (item.lat !== null && item.lon !== null) {
          activeFeatures.push(item)
        }
      })
    }
  })

  if (activeFeatures.length === 0) return null

  return (
    <>
      {activeFeatures.map((item, idx) => {
        const catConfig = CATEGORY_CONFIG[item.category] || { label: item.category, icon: '📍' }
        return (
          <Marker
            key={`${item.category}-${item.osm_id}-${idx}`}
            position={[item.lat, item.lon]}
            icon={createCategoryIcon(item.category)}
          >
            <Popup className="obrix-map-popup">
              <div className="p-1 max-w-xs text-xs text-slate-900">
                <div className="flex items-center gap-1.5 font-bold border-b pb-1 mb-1">
                  <span>{catConfig.icon}</span>
                  <span>{item.name}</span>
                </div>
                <div className="text-[11px] text-slate-600 space-y-0.5">
                  <div>
                    <span className="font-semibold text-slate-700">Category:</span> {catConfig.label}
                  </div>
                  {item.tags && Object.keys(item.tags).length > 0 && (
                    <div>
                      <span className="font-semibold text-slate-700">Tags:</span>{' '}
                      {Object.entries(item.tags)
                        .slice(0, 3)
                        .map(([k, v]) => `${k}=${v}`)
                        .join(', ')}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400 font-mono pt-0.5">
                    {item.lat.toFixed(5)}, {item.lon.toFixed(5)}
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </>
  )
}
