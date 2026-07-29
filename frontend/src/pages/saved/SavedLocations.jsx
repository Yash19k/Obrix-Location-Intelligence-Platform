import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bookmark, MapPin, Eye, ArrowLeftRight, Trash2, Calendar, Sparkles, Building2 } from 'lucide-react'
import useLocationStore from '@/store/locationStore'
import useMapStore from '@/store/mapStore'
import Spinner from '@/components/ui/Spinner'

export default function SavedLocations() {
  const navigate = useNavigate()
  const { savedLocations, fetchLocations, deleteLocation, isLoading, openComparison } = useLocationStore()
  const { selectCoordinates, setMapCenter, setBusinessType } = useMapStore()

  useEffect(() => {
    fetchLocations()
  }, [])

  const handleViewLocation = (loc) => {
    const lat = parseFloat(loc.latitude)
    const lon = parseFloat(loc.longitude)
    selectCoordinates(lat, lon)
    setMapCenter([lat, lon], 14)
    navigate('/analyze')
  }

  const handleCompareLocation = (loc) => {
    const lat = parseFloat(loc.latitude)
    const lon = parseFloat(loc.longitude)
    const secondaryResult = {
      latitude: lat,
      longitude: lon,
      business_type: loc.name?.toLowerCase().includes('retail') ? 'retail' : 'hospital',
      result: {
        site_readiness_score: 65,
        feature_counts: { roads: 12, hospitals: 1, schools: 3, restaurants: 8, parks: 2 },
        competition_metrics: { competitor_count: 3, competition_level: 'Medium' },
        road_hierarchy: { road_quality_label: 'Good' },
      },
    }
    openComparison(secondaryResult)
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
            <h1 className="text-xl font-bold text-slate-100">Saved Locations</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Access and manage your bookmarked site analysis locations
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
            When analyzing sites on the map, click "Save Analysis" to bookmark them here for quick access and comparison.
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

            return (
              <div
                key={loc.id}
                className="group p-5 rounded-2xl bg-slate-900/60 border border-white/10 hover:border-indigo-500/40 hover:bg-slate-900/90 transition-all flex flex-col justify-between space-y-4 shadow-lg"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-100 truncate">{loc.name}</h3>
                    </div>
                  </div>

                  {loc.description && (
                    <p className="text-xs text-slate-300 font-medium">{loc.description}</p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1 font-mono">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                      {lat}, {lon}
                    </span>
                    <span className="flex items-center gap-1 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {dateStr}
                    </span>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewLocation(loc)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    <button
                      onClick={() => handleCompareLocation(loc)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 transition-all"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" /> Compare
                    </button>
                  </div>

                  <button
                    onClick={() => deleteLocation(loc.id)}
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
    </div>
  )
}
