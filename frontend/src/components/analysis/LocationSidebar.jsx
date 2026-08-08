import { useEffect } from 'react'
import { Loader2, Zap, Crosshair, RotateCcw, Layers, Bookmark, Trash2, ArrowLeftRight, Check, MapPin } from 'lucide-react'
import useMapStore from '@/store/mapStore'
import useAnalysisStore from '@/store/analysisStore'
import useLocationStore from '@/store/locationStore'
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
    setMapCenter([selectedLat, selectedLon], 16)
    const result = await submitAnalysis({
      latitude: selectedLat,
      longitude: selectedLon,
      radius_m: radius,
      business_type: businessType,
    })
    if (result.success) {
      setAnalysisResult(result.data)
    } else {
      setAnalysisError(result.error)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white font-sans text-[#08111F]">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="px-5 pt-4 pb-3 border-b border-[#DDE3EC] flex-shrink-0 bg-[#F6F8FC]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#315CF5] text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-[#08111F] leading-tight">Obrix</p>
              <p className="text-[10px] font-mono text-[#8A94A3] uppercase tracking-wider leading-tight">
                LOCATION INTELLIGENCE
              </p>
            </div>
          </div>
          {hasLocation && (
            <button
              onClick={clearSelection}
              title="Clear selection"
              className="text-[#8A94A3] hover:text-[#08111F] transition-colors p-1.5 rounded-lg hover:bg-[#E2E8F0]"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Scrollable content ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

        {/* 1. Search Control */}
        <div className="space-y-1">
          <label className="block text-[10px] font-mono font-bold text-[#8A94A3] uppercase tracking-widest">
            LOCATION SEARCH
          </label>
          <SearchControl />
        </div>

        <div className="border-t border-[#DDE3EC]" />

        {/* 2. Coordinate display */}
        {hasLocation ? (
          <div className="rounded-2xl border border-[#315CF5]/30 bg-[#E9EFFF]/60 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-mono font-bold text-[#315CF5] uppercase tracking-wider">
                SELECTED LOCATION
              </p>
              <span className="w-2 h-2 rounded-full bg-[#315CF5] animate-ping" />
            </div>
            <div className="flex items-center justify-between text-xs font-mono font-bold text-[#08111F]">
              <span className="text-[#5D6675]">Lat</span>
              <span>{selectedLat.toFixed(6)}° N</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono font-bold text-[#08111F]">
              <span className="text-[#5D6675]">Lon</span>
              <span>{selectedLon.toFixed(6)}° E</span>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#DDE3EC] bg-[#F6F8FC] p-4 text-center">
            <div className="w-9 h-9 rounded-xl bg-white border border-[#DDE3EC] text-[#315CF5] flex items-center justify-center mx-auto mb-2 shadow-2xs">
              <MapPin className="w-4 h-4" />
            </div>
            <p className="text-xs text-[#5D6675] font-medium leading-relaxed">
              Click anywhere on the map<br />or search to select a location pin
            </p>
          </div>
        )}

        {/* 3. Business Type Selector 2x2 Grid */}
        <div className="space-y-2">
          <label className="block text-[10px] font-mono font-bold text-[#8A94A3] uppercase tracking-widest">
            SELECT BUSINESS TYPE
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {BUSINESS_TYPES.map((bt) => {
              const isSelected = businessType === bt.value
              const labelName = bt.label.split(' / ')[0]
              const imageSrc = bt.image || (bt.value === 'stationery' ? '/statinary.png' : `/${bt.value}.png`)

              return (
                <button
                  key={bt.value}
                  type="button"
                  onClick={() => setBusinessType(bt.value)}
                  className={`relative flex flex-col items-center justify-between p-3.5 rounded-2xl border text-center transition-all duration-200 cursor-pointer select-none group min-h-[118px] focus:outline-none focus:ring-2 focus:ring-[#315CF5]/20 ${
                    isSelected
                      ? 'bg-[#F3F6FF] border-[1.5px] border-[#315CF5] shadow-2xs ring-2 ring-[#315CF5]/10'
                      : 'bg-white border-[#DDE3EC] hover:border-[#315CF5]/35 hover:bg-[#F8FAFF] hover:-translate-y-0.5 hover:shadow-sm'
                  }`}
                >
                  {/* Selected Checkmark Indicator */}
                  {isSelected ? (
                    <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-[#315CF5] flex items-center justify-center shadow-2xs z-10">
                      <Check className="w-2.5 h-2.5 text-white stroke-[3.5]" />
                    </div>
                  ) : (
                    <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full border border-[#DDE3EC] opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                  )}

                  {/* 3D Business Store Illustration */}
                  <div className="my-auto py-1 flex items-center justify-center w-full">
                    <img
                      src={imageSrc}
                      alt={labelName}
                      className="h-14 sm:h-16 w-auto max-w-[85px] object-contain select-none transition-transform duration-200 group-hover:scale-[1.04]"
                    />
                  </div>

                  {/* Business Type Label */}
                  <span
                    className={`text-xs font-sans leading-tight transition-colors duration-150 ${
                      isSelected
                        ? 'text-[#315CF5] font-extrabold'
                        : 'text-[#5D6675] font-semibold group-hover:text-[#08111F]'
                    }`}
                  >
                    {labelName}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 4. Radius options */}
        <div className="space-y-2">
          <label className="block text-[10px] font-mono font-bold text-[#8A94A3] uppercase tracking-widest">
            ANALYSIS RADIUS
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {RADIUS_OPTIONS.map((ro) => (
              <button
                key={ro.value}
                onClick={() => setRadius(ro.value)}
                className={`py-2 rounded-xl text-xs font-mono font-bold transition-all duration-150 cursor-pointer ${
                  radius === ro.value
                    ? 'bg-[#315CF5] text-white shadow-xs'
                    : 'bg-[#F6F8FC] border border-[#DDE3EC] text-[#5D6675] hover:text-[#08111F] hover:bg-white'
                }`}
              >
                {ro.label}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Saved Bookmarks Section */}
        <BookmarksSection />
      </div>

      {/* ── Action buttons — pinned to bottom ────────────────────────────── */}
      <div className="px-5 pb-5 pt-3 space-y-2 border-t border-[#DDE3EC] bg-[#F6F8FC] flex-shrink-0">

        {/* Compare Mode Button */}
        <button
          onClick={() => useMapStore.getState().startCompareMode()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide bg-[#E9EFFF] border border-[#315CF5]/30 text-[#315CF5] hover:bg-[#315CF5] hover:text-white transition-all cursor-pointer shadow-2xs"
        >
          <ArrowLeftRight className="w-4 h-4" /> Compare 2 Locations
        </button>

        {/* Locate Me */}
        <button
          onClick={handleLocate}
          disabled={isLocating}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide bg-white border border-[#DDE3EC] text-[#5D6675] hover:bg-[#E9EFFF] hover:text-[#315CF5] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
        >
          {isLocating
            ? <><Loader2 className="w-4 h-4 animate-spin text-[#315CF5]" /> Locating…</>
            : <><Crosshair className="w-4 h-4" /> Use My Location</>
          }
        </button>

        {/* Analyze Location CTA */}
        <button
          id="analyze-location-btn"
          onClick={handleAnalyze}
          disabled={!hasLocation || isAnalyzing}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl text-sm font-extrabold text-white bg-[#315CF5] hover:bg-[#2448D8] shadow-md transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]"
        >
          {isAnalyzing
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing Location…</>
            : <><Zap className="w-4 h-4 fill-current" /> Analyze Location</>
          }
        </button>
      </div>
    </div>
  )
}

// ── BookmarksSection ─────────────────────────────────────────────────────────

function BookmarksSection() {
  const { savedLocations, fetchLocations, deleteLocation, isLoading } = useLocationStore()
  const { selectCoordinates, setMapCenter } = useMapStore()

  useEffect(() => {
    fetchLocations()
  }, [])

  if (savedLocations.length === 0 && !isLoading) {
    return null
  }

  return (
    <div className="space-y-2 pt-3 border-t border-[#DDE3EC]">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono font-bold text-[#8A94A3] uppercase tracking-widest flex items-center gap-1.5">
          <Bookmark className="w-3.5 h-3.5 text-[#315CF5]" /> Saved Locations
        </span>
        <span className="text-[10px] text-[#5D6675] font-mono font-bold bg-[#F6F8FC] px-2 py-0.5 rounded border border-[#DDE3EC]">
          {savedLocations.length} SITES
        </span>
      </div>

      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
        {savedLocations.map((loc) => (
          <div
            key={loc.id}
            className="group flex items-center justify-between p-2.5 rounded-xl bg-[#F6F8FC] border border-[#DDE3EC] hover:bg-[#E9EFFF]/60 hover:border-[#315CF5]/30 transition-all cursor-pointer"
            onClick={() => {
              const lat = parseFloat(loc.latitude)
              const lon = parseFloat(loc.longitude)
              selectCoordinates(lat, lon)
              setMapCenter([lat, lon], 15)
            }}
          >
            <div className="min-w-0 pr-2">
              <div className="text-xs font-bold text-[#08111F] truncate font-sans">{loc.name}</div>
              <div className="text-[10px] text-[#5D6675] font-mono truncate">
                {parseFloat(loc.latitude).toFixed(3)}° N, {parseFloat(loc.longitude).toFixed(3)}° E
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                deleteLocation(loc.id)
              }}
              title="Delete bookmark"
              className="opacity-0 group-hover:opacity-100 p-1 text-[#8A94A3] hover:text-red-600 transition-opacity"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
