import { Layers, Moon, Sun, Map, Globe } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import useMapStore from '@/store/mapStore'

const MAP_STYLES = [
  { id: 'light', label: 'Light', icon: Sun, desc: 'Clean bright theme (Default)' },
  { id: 'dark', label: 'Dark', icon: Moon, desc: 'High-contrast dark theme' },
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
    <div ref={containerRef} className="relative z-[3000] font-sans">
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Change Map Style"
        className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl bg-white/95 text-[#08111F] border border-[#DDE3EC] shadow-md backdrop-blur-md hover:bg-[#F6F8FC] transition-all cursor-pointer"
      >
        <Layers className="w-4 h-4 text-[#315CF5]" />
        <span className="capitalize">{mapStyle} Map</span>
      </button>

      {isOpen && (
        <div className="absolute top-11 right-0 w-56 py-2 bg-white/95 border border-[#DDE3EC] rounded-xl shadow-xl backdrop-blur-xl text-xs text-[#08111F] divide-y divide-[#E8ECF2] z-[3500]">
          <div className="px-3 py-1.5 text-[10px] font-mono font-bold tracking-wider text-[#8A94A3] uppercase">
            MAP BASEMAP STYLE
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
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#E9EFFF] text-[#315CF5] font-bold'
                      : 'hover:bg-[#F6F8FC] text-[#5D6675]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-[#315CF5]' : 'text-[#8A94A3]'}`} />
                  <div>
                    <div className="leading-tight font-bold">{style.label}</div>
                    <div className="text-[10px] text-[#8A94A3] leading-tight font-medium">{style.desc}</div>
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
