/**
 * LocationSidebar — left control panel (Phase 2 fix).
 *
 * No longer uses absolute positioning.
 * Renders as inline content inside Analyze.jsx's <aside> flex child.
 *
 * Business type and radius use native <select> elements to avoid
 * dropdown overflow/clipping issues in the sidebar scroll container.
 * SearchControl dropdown uses createPortal (see SearchControl.jsx).
 */

import { Loader2, Zap, Crosshair, RotateCcw, Layers } from 'lucide-react'
import useMapStore from '@/store/mapStore'
import useAnalysisStore from '@/store/analysisStore'
import { BUSINESS_TYPES, RADIUS_OPTIONS } from '@/constants'
import SearchControl from '../map/SearchControl'

export default function LocationSidebar() {
  const {
    selectedLat, selectedLon,
    businessType, radius,
    setBusinessType, setRadius,
    setLocating, selectCoordinates,
    setMapCenter, isAnalyzing, setIsAnalyzing,
    setAnalysisResult, setAnalysisError,
    clearSelection, isLocating,
  } = useMapStore()

  const { submitAnalysis } = useAnalysisStore()
  const hasLocation = selectedLat !== null && selectedLon !== null

  // ── Locate Me ────────────────────────────────────────────────────────────────
  const handleLocate = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6))
        const lon = parseFloat(pos.coords.longitude.toFixed(6))
        selectCoordinates(lat, lon)
        setMapCenter([lat, lon], 15)
        setLocating(false)
      },
      () => setLocating(false),
      { timeout: 10_000 },
    )
  }

  // ── Run analysis ─────────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!hasLocation) return
    setIsAnalyzing(true)
    const result = await submitAnalysis({
      latitude:      selectedLat,
      longitude:     selectedLon,
      radius_m:      radius,
      business_type: businessType,
    })
    if (result.success) {
      setAnalysisResult(result.data)
    } else {
      setAnalysisError(result.error)
    }
  }

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-brand-600/20 border border-brand-500/20
                            flex items-center justify-center flex-shrink-0">
              <Layers className="w-3.5 h-3.5 text-brand-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">Obrix</p>
              <p className="text-[10px] text-white/30 leading-tight">Location Intelligence</p>
            </div>
          </div>
          {hasLocation && (
            <button
              onClick={clearSelection}
              title="Clear selection"
              className="text-white/25 hover:text-white/60 transition-colors p-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Scrollable content ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

        {/* Search */}
        <SearchControl />

        {/* Divider */}
        <div className="border-t border-white/[0.06]" />

        {/* Coordinate display */}
        {hasLocation ? (
          <div className="rounded-xl border border-brand-500/20 bg-brand-600/[0.08] p-3.5">
            <p className="text-[10px] text-white/40 uppercase tracking-wider font-medium mb-2">
              Selected Location
            </p>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] text-white/30 w-6">Lat</span>
              <span className="text-sm font-mono text-white font-medium">
                {selectedLat.toFixed(6)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/30 w-6">Lon</span>
              <span className="text-sm font-mono text-white/80">
                {selectedLon.toFixed(6)}
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/[0.08]
                          p-4 text-center">
            <div className="w-9 h-9 rounded-full bg-white/[0.04] flex items-center
                            justify-center mx-auto mb-2.5">
              <span className="text-lg">📍</span>
            </div>
            <p className="text-xs text-white/30 leading-relaxed">
              Click anywhere on the map<br />to select a location
            </p>
          </div>
        )}

        {/* Business Type */}
        <div className="space-y-2">
          <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-widest">
            Business Type
          </label>
          <div className="relative">
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="w-full appearance-none bg-white/[0.05] border border-white/10
                         rounded-xl px-3.5 py-2.5 text-sm text-white
                         focus:outline-none focus:ring-2 focus:ring-brand-500/40
                         focus:border-brand-500/40 cursor-pointer
                         transition-colors hover:bg-white/[0.08]"
              style={{ colorScheme: 'dark' }}
            >
              {BUSINESS_TYPES.map((bt) => (
                <option key={bt.value} value={bt.value}
                  style={{ background: '#0d1526', color: '#fff' }}>
                  {bt.icon} {bt.label}
                </option>
              ))}
            </select>
            {/* Custom chevron */}
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
              <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Radius */}
        <div className="space-y-2">
          <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-widest">
            Analysis Radius
          </label>
          <div className="grid grid-cols-5 gap-1">
            {RADIUS_OPTIONS.map((ro) => (
              <button
                key={ro.value}
                onClick={() => setRadius(ro.value)}
                className={`py-2 rounded-lg text-xs font-medium transition-all duration-150
                            ${radius === ro.value
                              ? 'bg-brand-600/30 border border-brand-500/40 text-brand-300'
                              : 'bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.08]'
                            }`}
              >
                {ro.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Action buttons — pinned to bottom ────────────────────────────── */}
      <div className="px-4 pb-4 pt-3 space-y-2.5 border-t border-white/[0.06] flex-shrink-0">

        {/* Locate Me */}
        <button
          onClick={handleLocate}
          disabled={isLocating}
          className="w-full flex items-center justify-center gap-2
                     px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wide
                     bg-white/[0.05] border border-white/10 text-white/60
                     hover:bg-white/[0.09] hover:text-white
                     disabled:opacity-40 disabled:cursor-not-allowed
                     transition-all duration-150"
        >
          {isLocating
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Locating…</>
            : <><Crosshair className="w-3.5 h-3.5" /> Use My Location</>
          }
        </button>

        {/* Analyze */}
        <button
          id="analyze-location-btn"
          onClick={handleAnalyze}
          disabled={!hasLocation || isAnalyzing}
          className="w-full flex items-center justify-center gap-2.5
                     px-4 py-3.5 rounded-xl text-sm font-bold
                     text-white transition-all duration-200
                     disabled:opacity-30 disabled:cursor-not-allowed
                     focus:outline-none focus:ring-2 focus:ring-brand-500/50
                     active:scale-[0.98]"
          style={hasLocation && !isAnalyzing ? {
            background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
            boxShadow: '0 0 24px rgba(99,102,241,0.35), 0 4px 12px rgba(0,0,0,0.3)',
          } : {
            background: 'rgba(99,102,241,0.15)',
          }}
        >
          {isAnalyzing
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</>
            : <><Zap className="w-4 h-4" /> Analyze Location</>
          }
        </button>
      </div>
    </div>
  )
}
