import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bookmark, MapPin, Eye, ArrowLeftRight, Trash2, Calendar, Sparkles, Building2, Award, ArrowRight } from 'lucide-react'
import useLocationStore from '@/store/locationStore'
import useMapStore from '@/store/mapStore'
import useAnalysisStore from '@/store/analysisStore'
import Spinner from '@/components/ui/Spinner'
import LocationComparisonModal from '@/components/analysis/LocationComparisonModal'

function getScoreBadge(scoreVal) {
  const num = parseFloat(scoreVal)
  if (isNaN(num)) return null

  if (num >= 80) {
    return {
      label: 'Strong Opportunity',
      bg: 'bg-[#E7F7E9]',
      text: 'text-[#43B96B]',
      border: 'border-[#43B96B]/30',
      scoreText: `${num.toFixed(1)} / 100`,
    }
  } else if (num >= 60) {
    return {
      label: 'Promising',
      bg: 'bg-[#E9EFFF]',
      text: 'text-[#315CF5]',
      border: 'border-[#315CF5]/30',
      scoreText: `${num.toFixed(1)} / 100`,
    }
  } else if (num >= 40) {
    return {
      label: 'Moderate',
      bg: 'bg-[#FEF3C7]',
      text: 'text-amber-800',
      border: 'border-amber-300',
      scoreText: `${num.toFixed(1)} / 100`,
    }
  } else {
    return {
      label: 'Weak',
      bg: 'bg-[#FEE2E2]',
      text: 'text-red-700',
      border: 'border-red-200',
      scoreText: `${num.toFixed(1)} / 100`,
    }
  }
}

export default function SavedLocations() {
  const navigate = useNavigate()
  const { savedLocations, fetchLocations, deleteLocation, isLoading } = useLocationStore()
  const { selectCoordinates, setMapCenter, setBusinessType, setIsAnalyzing, setAnalysisResult } = useMapStore()
  const { submitAnalysis } = useAnalysisStore()

  const [activeComparison, setActiveComparison] = useState(null)

  useEffect(() => {
    fetchLocations()
  }, [])

  const parseDescription = (descStr) => {
    if (!descStr) return {}
    try {
      if (descStr.startsWith('{')) {
        return JSON.parse(descStr)
      }
    } catch {
      // ignore JSON parse failure
    }
    return { text: descStr }
  }

  const handleViewLocation = async (loc) => {
    const lat = parseFloat(loc.latitude)
    const lon = parseFloat(loc.longitude)
    const meta = parseDescription(loc.description)

    if (meta.type === 'comparison' || meta.primaryResult) {
      setActiveComparison({
        primaryResult: meta.primaryResult,
        secondaryResult: meta.secondaryResult,
      })
      return
    }

    // Single analysis restore
    if (meta.business_type) {
      setBusinessType(meta.business_type)
    }
    selectCoordinates(lat, lon)
    setMapCenter([lat, lon], 16)

    if (meta.analysisResult) {
      setAnalysisResult(meta.analysisResult)
    } else {
      setIsAnalyzing(true)
      navigate('/analyze')
      try {
        const res = await submitAnalysis({
          latitude: lat,
          longitude: lon,
          radius_m: meta.radius_m || 1000,
          business_type: meta.business_type || 'retail',
        })
        if (res.success) {
          setAnalysisResult(res.data)
        } else {
          setIsAnalyzing(false)
        }
      } catch {
        setIsAnalyzing(false)
      }
      return
    }

    navigate('/analyze')
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans relative">
      
      {/* ── Page Header Bar ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#DDE3EC] rounded-2xl p-6 shadow-2xs relative overflow-hidden">
        <div className="space-y-1 z-10">
          <span className="text-[10px] font-mono font-bold text-[#315CF5] uppercase tracking-wider block">
            LOCATION LIBRARY / SAVED INTELLIGENCE
          </span>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#E9EFFF] border border-[#315CF5]/20 text-[#315CF5] flex items-center justify-center shrink-0">
              <Bookmark className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#08111F] font-sans">
              Saved Locations & Comparisons
            </h1>
          </div>
          <p className="text-xs text-[#5D6675] font-sans font-normal leading-relaxed">
            Access and restore your bookmarked site analyses and side-by-side comparison dashboards.
          </p>
        </div>

        <button
          onClick={() => navigate('/analyze')}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold rounded-xl bg-[#315CF5] hover:bg-[#2448D8] text-white shadow-md transition-all duration-200 cursor-pointer shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>New Site Analysis</span>
        </button>
      </div>

      {/* ── Content Grid / Loading / Empty State ───────────────────────────── */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-[#5D6675] font-sans">
          <Spinner size="lg" />
          <p className="text-xs font-medium mt-3 text-[#8A94A3]">Loading saved location library...</p>
        </div>
      ) : savedLocations.length === 0 ? (
        <div className="py-16 rounded-2xl border border-[#DDE3EC] bg-white flex flex-col items-center justify-center text-center p-8 space-y-4 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-[#E9EFFF] text-[#315CF5] border border-[#315CF5]/20 flex items-center justify-center mx-auto shadow-2xs">
            <Bookmark className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="text-base font-extrabold text-[#08111F] font-sans">No saved locations yet</h3>
            <p className="text-xs text-[#5D6675] leading-relaxed">
              When analyzing sites on the map, click "Save Analysis" or "Save Comparison" to bookmark them here for instant restoration.
            </p>
          </div>
          <button
            onClick={() => navigate('/analyze')}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#315CF5] hover:bg-[#2448D8] rounded-xl shadow-md transition-all cursor-pointer"
          >
            <span>Analyze a Location</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {savedLocations.map((loc) => {
            const lat = parseFloat(loc.latitude).toFixed(4)
            const lon = parseFloat(loc.longitude).toFixed(4)
            const dateStr = loc.created_at ? new Date(loc.created_at).toLocaleDateString() : 'Recent'
            const meta = parseDescription(loc.description)

            const isComparison = meta.type === 'comparison' || !!meta.primaryResult
            const rawScore = meta.recScore || meta.readiness_score || meta.score || null
            const scoreBadge = rawScore ? getScoreBadge(rawScore) : null
            const bTypeLabel = isComparison
              ? 'SITE COMPARISON'
              : meta.business_type ? meta.business_type.toUpperCase() : 'SITE ANALYSIS'

            return (
              <div
                key={loc.id}
                onClick={() => handleViewLocation(loc)}
                className="group p-5 rounded-2xl bg-white border border-[#DDE3EC] hover:border-[#315CF5]/40 hover:-translate-y-0.5 hover:shadow-md cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-4 shadow-2xs"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#E9EFFF] border border-[#315CF5]/20 text-[#315CF5] flex items-center justify-center flex-shrink-0">
                        {isComparison ? <ArrowLeftRight className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono font-bold tracking-wider text-[#315CF5] uppercase block">
                          {bTypeLabel}
                        </span>
                        <h3 className="text-sm font-extrabold text-[#08111F] truncate font-sans group-hover:text-[#315CF5] transition-colors">
                          {loc.name}
                        </h3>
                      </div>
                    </div>

                    {scoreBadge && (
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border shrink-0 ${scoreBadge.bg} ${scoreBadge.text} ${scoreBadge.border}`}>
                        {scoreBadge.scoreText}
                      </span>
                    )}
                  </div>

                  {loc.address && !meta.text && (
                    <p className="text-xs text-[#5D6675] font-sans font-medium line-clamp-2 leading-relaxed">
                      {loc.address}
                    </p>
                  )}

                  {meta.text && (
                    <p className="text-xs text-[#5D6675] font-sans font-medium line-clamp-2 leading-relaxed">
                      {meta.text}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-[#8A94A3] pt-1">
                    <span className="flex items-center gap-1 font-mono font-bold text-[11px] text-[#5D6675]">
                      <MapPin className="w-3.5 h-3.5 text-[#315CF5]" />
                      {lat}° N · {lon}° E
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-mono text-[#8A94A3]">
                      <Calendar className="w-3 h-3" />
                      {dateStr}
                    </span>
                  </div>
                </div>

                {/* Card Actions Bar */}
                <div className="pt-3 border-t border-[#E8ECF2] flex items-center justify-between">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleViewLocation(loc); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#F3F6FF] border border-[#DDE3EC] text-[#315CF5] hover:bg-[#E9EFFF] hover:border-[#315CF5]/30 transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Restore View →
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); deleteLocation(loc.id); }}
                    title="Delete Saved Location"
                    className="p-1.5 text-[#8A94A3] hover:text-red-600 hover:bg-[#FEE2E2] rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Restored Comparison Dashboard Modal */}
      {activeComparison && (
        <LocationComparisonModal
          isOpen={!!activeComparison}
          onClose={() => setActiveComparison(null)}
          primaryResult={activeComparison.primaryResult}
          secondaryResult={activeComparison.secondaryResult}
        />
      )}
    </div>
  )
}
