import { Layers, Moon, Sun, Map, Globe } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import useMapStore from '@/store/mapStore'

const MAP_STYLES = [
  { id: 'dark', label: 'Dark', icon: Moon, desc: 'High-contrast dark theme' },
  { id: 'light', label: 'Light', icon: Sun, desc: 'Clean bright theme' },
  { id: 'street', label: 'Street', icon: Map, desc: 'Detailed street map' },
  { id: 'satellite', label: 'Satellite', icon: Globe, desc: 'High-res satellite imagery' },
]

export default function MapStyleControl() {
  const { mapStyle, setMapStyle } = useMapStore()
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

  return (
    <div ref={containerRef} className="relative z-[3000]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Change Map Style"
        className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl bg-[#0d1526]/95 text-slate-200 border border-white/10 shadow-xl backdrop-blur-md hover:bg-[#162036] hover:text-white transition-all"
      >
        <Layers className="w-4 h-4 text-indigo-400" />
        <span className="capitalize">{mapStyle} Map</span>
      </button>

      {isOpen && (
        <div className="absolute top-11 right-0 w-56 py-2 bg-[#0d1526]/95 border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl text-xs text-slate-200 divide-y divide-white/5 z-[3500]">
          <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            Map Basemap Style
          </div>
          <div className="py-1 space-y-0.5">
            {MAP_STYLES.map((style) => {
              const Icon = style.icon
              const isSelected = mapStyle === style.id
              return (
                <button
                  key={style.id}
                  onClick={() => {
                    setMapStyle(style.id)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                    isSelected
                      ? 'bg-indigo-600/25 text-indigo-300 font-semibold'
                      : 'hover:bg-white/5 text-slate-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <div>
                    <div className="leading-tight">{style.label}</div>
                    <div className="text-[10px] text-slate-400 leading-tight">{style.desc}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
