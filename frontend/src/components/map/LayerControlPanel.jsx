import { useState, useRef, useEffect } from 'react'
import { Eye, EyeOff, Layers } from 'lucide-react'
import useMapStore from '@/store/mapStore'

export const CATEGORY_CONFIG = {
  roads: { label: 'Roads', color: '#6366f1', icon: '🛣️' },
  hospitals: { label: 'Hospitals', color: '#f43f5e', icon: '🏥' },
  schools: { label: 'Schools', color: '#f59e0b', icon: '🏫' },
  parks: { label: 'Parks', color: '#10b981', icon: '🌲' },
  restaurants: { label: 'Restaurants', color: '#f97316', icon: '🍽️' },
  banks: { label: 'Banks', color: '#a855f7', icon: '🏦' },
  fuel_stations: { label: 'Fuel Stations', color: '#06b6d4', icon: '⛽' },
  bus_stops: { label: 'Bus Stops', color: '#14b8a6', icon: '🚌' },
}

export default function LayerControlPanel() {
  const { activeLayers, toggleLayer, setAllLayers, analysisResult } = useMapStore()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const featureCounts = analysisResult?.osm_data_snapshot?.feature_counts || {}
  const totalCategoryFeatures = Object.values(featureCounts).reduce((a, b) => a + b, 0)
  const activeCount = Object.values(activeLayers).filter(Boolean).length

  return (
    <div ref={containerRef} className="relative z-[3000]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Toggle Map Layers"
        className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl bg-[#0d1526]/95 text-slate-200 border border-white/10 shadow-xl backdrop-blur-md hover:bg-[#162036] hover:text-white transition-all"
      >
        <Layers className="w-4 h-4 text-emerald-400" />
        <span>Layers ({activeCount}/{Object.keys(CATEGORY_CONFIG).length})</span>
      </button>

      {isOpen && (
        <div className="absolute top-11 right-0 w-64 py-2 bg-[#0d1526]/95 border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl text-xs text-slate-200 divide-y divide-white/5 z-[3500]">
          <div className="px-3 py-1.5 flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              OSM Map Layers
            </span>
            <div className="flex items-center gap-2 text-[11px]">
              <button
                onClick={() => setAllLayers(true)}
                className="text-indigo-400 hover:text-indigo-300 font-medium"
              >
                All
              </button>
              <span className="text-slate-600">|</span>
              <button
                onClick={() => setAllLayers(false)}
                className="text-slate-400 hover:text-slate-300 font-medium"
              >
                None
              </button>
            </div>
          </div>

          <div className="py-1 max-h-72 overflow-y-auto space-y-0.5 px-1">
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
              const isActive = !!activeLayers[key]
              const count = featureCounts[key] ?? 0
              return (
                <button
                  key={key}
                  onClick={() => toggleLayer(key)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                    isActive
                      ? 'bg-white/10 text-slate-100 font-medium'
                      : 'hover:bg-white/5 text-slate-400 opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{config.icon}</span>
                    <span className="font-medium text-xs">{config.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {count > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono border border-white/5">
                        {count}
                      </span>
                    )}
                    {isActive ? (
                      <Eye className="w-3.5 h-3.5 text-indigo-400" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {totalCategoryFeatures > 0 && (
            <div className="px-3 py-1.5 text-[10px] text-slate-400 text-right">
              {totalCategoryFeatures} total features loaded
            </div>
          )}
        </div>
      )}
    </div>
  )
}
