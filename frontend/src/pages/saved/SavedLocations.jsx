import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bookmark, MapPin, Eye, ArrowLeftRight, Trash2, Calendar, Sparkles, Building2, Award, ShieldCheck } from 'lucide-react'
import useLocationStore from '@/store/locationStore'
import useMapStore from '@/store/mapStore'
import useAnalysisStore from '@/store/analysisStore'
import Spinner from '@/components/ui/Spinner'
import LocationComparisonModal from '@/components/analysis/LocationComparisonModal'

export default function SavedLocations() {
  const navigate = useNavigate()
  const { savedLocations, fetchLocations, deleteLocation, isLoading, openComparison } = useLocationStore()
  const { selectCoordinates, setMapCenter, setBusinessType, setIsAnalyzing, setAnalysisResult, openPanel } = useMapStore()
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
      // ignore
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
      const res = await submitAnalysis({
        latitude: lat,
        longitude: lon,
        radius_m: meta.radius_m || 1000,
        business_type: meta.business_type || 'retail',
      })
      if (res.success) {
        setAnalysisResult(res.data)
      }
      return
    }

    navigate('/analyze')
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Bookmark className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-100">Saved Locations & Comparisons</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Access and restore your bookmarked site analyses and side-by-side comparison dashboards
          </p>
        </div>

        <button
          onClick={() => navigate('/analyze')}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all"
        >
          <Sparkles className="w-4 h-4" /> New Site Analysis
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Spinner size="lg" />
          <p className="text-xs mt-3">Loading saved locations...</p>
        </div>
      ) : savedLocations.length === 0 ? (
        <div className="py-20 rounded-2xl border border-white/5 bg-slate-900/40 flex flex-col items-center justify-center text-center p-6 space-y-3">
          <div className="p-4 rounded-full bg-slate-800/80 text-slate-500 border border-white/5">
            <Bookmark className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200">No Saved Locations Yet</h3>
          <p className="text-xs text-slate-400 max-w-md">
            When analyzing sites on the map, click "Save Analysis" or "Save Comparison" to bookmark them here for instant restoration.
          </p>
          <button
            onClick={() => navigate('/analyze')}
            className="px-4 py-2 text-xs font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 transition-all"
          >
            Go to Analyze Page
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedLocations.map((loc) => {
            const lat = parseFloat(loc.latitude).toFixed(4)
            const lon = parseFloat(loc.longitude).toFixed(4)
            const dateStr = loc.created_at ? new Date(loc.created_at).toLocaleDateString() : 'Recent'
            const meta = parseDescription(loc.description)

            const isComparison = meta.type === 'comparison' || !!meta.primaryResult
            const readinessScore = meta.recScore || meta.readiness_score || meta.score || null
            const confidence = meta.confidence || '98'
            const bTypeLabel = isComparison
              ? 'SITE COMPARISON'
              : meta.business_type ? meta.business_type.toUpperCase() : 'SITE ANALYSIS'

            return (
              <div
                key={loc.id}
                onClick={() => handleViewLocation(loc)}
                className="group p-5 rounded-2xl bg-slate-900/60 border border-white/10 hover:border-indigo-500/40 hover:bg-slate-900/90 cursor-pointer transition-all flex flex-col justify-between space-y-4 shadow-lg"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isComparison
                          ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400'
                          : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
                      }`}>
                        {isComparison ? <ArrowLeftRight className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-100 truncate">{loc.name}</h3>
                        <span className={`text-[10px] font-semibold tracking-wider ${
                          isComparison ? 'text-purple-400' : 'text-indigo-400'
                        }`}>
                          {bTypeLabel}
                        </span>
                      </div>
                    </div>

                    {readinessScore && (
                      <div className="flex flex-col items-end">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <Award className="w-3 h-3" /> {readinessScore}/100
                        </span>
                      </div>
                    )}
                  </div>

                  {loc.address && !meta.text && (
                    <p className="text-xs text-slate-300 font-medium">{loc.address}</p>
                  )}

                  {meta.text && (
                    <p className="text-xs text-slate-300 font-medium">{meta.text}</p>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                      {lat}, {lon}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {confidence}% Confidence
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Calendar className="w-3 h-3" />
                      {dateStr}
                    </span>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleViewLocation(loc); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" /> Restore View
                    </button>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); deleteLocation(loc.id); }}
                    title="Delete Saved Location"
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
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
