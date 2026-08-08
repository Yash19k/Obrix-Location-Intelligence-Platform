import { useState } from 'react'
import {
  Search, MapPin, Layers, Crosshair, ArrowLeftRight, Loader2, Zap, RotateCcw, ChevronDown, Store, Coffee, ShoppingBag, BookOpen
} from 'lucide-react'
import useMapStore from '@/store/mapStore'
import useAnalysisStore from '@/store/analysisStore'
import { BUSINESS_TYPES, RADIUS_OPTIONS } from '@/constants'
import SearchControl from '../map/SearchControl'

const BIZ_ICONS = {
  pharmacy: Store,
  cafe: Coffee,
  grocery: ShoppingBag,
  stationery: BookOpen,
}

export default function AnalyzeToolbar() {
  const {
    selectedLat, selectedLon,
    businessType, radius,
    setBusinessType, setRadius,
    setLocating, selectCoordinates,
    setMapCenter, isAnalyzing, setIsAnalyzing,
    setAnalysisResult, setAnalysisError,
    clearSelection, isLocating, compareMode, startCompareMode, exitCompareMode
  } = useMapStore()

  const { submitAnalysis } = useAnalysisStore()
  const hasLocation = selectedLat !== null && selectedLon !== null

  // Locate user position
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

  // Submit analysis request
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
    <div className="absolute top-4 left-4 right-4 sm:left-6 sm:right-auto z-[2000] max-w-4xl font-sans pointer-events-auto">
      <div className="bg-white/95 backdrop-blur-md border border-[#DDE3EC] rounded-2xl shadow-xl p-2.5 sm:p-3 flex flex-wrap items-center gap-2.5 sm:gap-3">

        {/* 1. Search Control */}
        <div className="flex-1 min-w-[220px] max-w-md">
          <SearchControl />
        </div>

        {/* Vertical Divider */}
        <div className="hidden sm:block h-6 w-px bg-[#DDE3EC]" />

        {/* 2. Business Category Selector */}
        <div className="flex items-center gap-1 bg-[#F6F8FC] border border-[#DDE3EC] p-1 rounded-xl">
          {BUSINESS_TYPES.map((bt) => {
            const isSelected = businessType === bt.value
            const imageSrc = bt.image || (bt.value === 'stationery' ? '/statinary.png' : `/${bt.value}.png`)
            return (
              <button
                key={bt.value}
                type="button"
                onClick={() => setBusinessType(bt.value)}
                title={bt.label}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-[#315CF5] text-white shadow-2xs'
                    : 'text-[#5D6675] hover:text-[#08111F] hover:bg-white'
                }`}
              >
                <img
                  src={imageSrc}
                  alt={bt.label.split(' / ')[0]}
                  className="w-4 h-4 object-contain select-none shrink-0"
                />
                <span className="hidden md:inline">{bt.label.split(' / ')[0]}</span>
              </button>
            )
          })}
        </div>

        {/* 3. Radius Selector */}
        <div className="flex items-center gap-1 bg-[#F6F8FC] border border-[#DDE3EC] p-1 rounded-xl">
          {RADIUS_OPTIONS.map((ro) => (
            <button
              key={ro.value}
              onClick={() => setRadius(ro.value)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all duration-150 cursor-pointer ${
                radius === ro.value
                  ? 'bg-white text-[#315CF5] shadow-2xs border border-[#DDE3EC]'
                  : 'text-[#8A94A3] hover:text-[#08111F]'
              }`}
            >
              {ro.label}
            </button>
          ))}
        </div>

        {/* Vertical Divider */}
        <div className="hidden md:block h-6 w-px bg-[#DDE3EC]" />

        {/* 4. Action Buttons (Locate Me + Compare + Primary Analyze) */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Locate Me */}
          <button
            onClick={handleLocate}
            disabled={isLocating}
            title="Use My Location"
            className="p-2 rounded-xl bg-[#F6F8FC] hover:bg-[#E9EFFF] border border-[#DDE3EC] text-[#5D6675] hover:text-[#315CF5] transition-colors cursor-pointer"
          >
            {isLocating ? <Loader2 className="w-4 h-4 animate-spin text-[#315CF5]" /> : <Crosshair className="w-4 h-4" />}
          </button>

          {/* Compare Toggle */}
          <button
            onClick={() => (compareMode ? exitCompareMode() : startCompareMode())}
            title="Compare 2 Locations"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer border ${
              compareMode
                ? 'bg-[#E9EFFF] text-[#315CF5] border-[#315CF5]/30'
                : 'bg-[#F6F8FC] hover:bg-[#E9EFFF] text-[#5D6675] border-[#DDE3EC]'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-[#315CF5]" />
            <span className="hidden lg:inline">Compare</span>
          </button>

          {/* Clear Button if location selected */}
          {hasLocation && (
            <button
              onClick={clearSelection}
              title="Reset Selection"
              className="p-2 rounded-xl bg-[#F6F8FC] hover:bg-[#FEE2E2] text-[#8A94A3] hover:text-red-600 border border-[#DDE3EC] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {/* Primary Analyze Location Button */}
          <button
            id="toolbar-analyze-btn"
            onClick={handleAnalyze}
            disabled={!hasLocation || isAnalyzing}
            className="inline-flex items-center gap-2 bg-[#315CF5] hover:bg-[#2448D8] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all duration-200 shadow-md hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing…</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-current" />
                <span>Analyze Site</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
