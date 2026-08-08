import { Link, useNavigate } from 'react-router-dom'
import { MapPin, Plus, ArrowRight, Clock, Store, Coffee, ShoppingBag, BookOpen } from 'lucide-react'
import useMapStore from '@/store/mapStore'
import useAnalysisStore from '@/store/analysisStore'
import useAiChatStore from '@/store/aiChatStore'

const BIZ_ICONS = {
  pharmacy: Store,
  cafe: Coffee,
  grocery: ShoppingBag,
  stationery: BookOpen,
}

function getTierBadge(scoreNum) {
  if (scoreNum >= 80) {
    return { label: 'Strong Opportunity', bg: 'bg-[#E7F7E9]', text: 'text-[#43B96B]', border: 'border-[#43B96B]/30' }
  } else if (scoreNum >= 60) {
    return { label: 'Promising', bg: 'bg-[#E9EFFF]', text: 'text-[#315CF5]', border: 'border-[#315CF5]/30' }
  } else if (scoreNum >= 40) {
    return { label: 'Moderate', bg: 'bg-[#FEF3C7]', text: 'text-amber-700', border: 'border-amber-300' }
  } else {
    return { label: 'Weak', bg: 'bg-[#FEE2E2]', text: 'text-red-700', border: 'border-red-200' }
  }
}

export default function RecentAnalysesTable({ requests, isLoading }) {
  const navigate = useNavigate()

  const handleOpenAnalysis = (req) => {
    if (!req) return

    // Extract latitude and longitude with robust fallbacks
    const rawLat = req.latitude ?? req.lat ?? (req.location?.latitude ?? req.location?.lat)
    const rawLon = req.longitude ?? req.lon ?? req.lng ?? (req.location?.longitude ?? req.location?.lon)

    const lat = rawLat !== undefined && rawLat !== null ? parseFloat(rawLat) : null
    const lon = rawLon !== undefined && rawLon !== null ? parseFloat(rawLon) : null

    // Extract radius and business type
    const radius = req.radius_m ? parseInt(req.radius_m, 10) : req.radius ? parseInt(req.radius, 10) : 1000
    const businessType = req.business_type ? req.business_type.toLowerCase() : 'pharmacy'

    if (lat !== null && !isNaN(lat) && lon !== null && !isNaN(lon)) {
      if (useAiChatStore.getState().resetChat) {
        useAiChatStore.getState().resetChat()
      }

      const hasResult = !!(req.result || req.site_readiness_score)
      const resultToSet = req.result ? req : (req.site_readiness_score ? { ...req, result: req } : null)

      useMapStore.setState({
        selectedLat: lat,
        selectedLon: lon,
        mapCenter: [lat, lon],
        mapZoom: 16,
        businessType,
        radius,
        analysisResult: hasResult ? resultToSet : null,
        showPanel: hasResult,
        isAnalyzing: false,
        analysisError: null,
      })

      if (hasResult) {
        useAnalysisStore.getState().setCurrentRequest(req)
      }
    }

    navigate('/analyze')
  }

  return (
    <div className="bg-white border border-[#DDE3EC] rounded-2xl p-5 sm:p-6 shadow-2xs font-sans">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-extrabold text-[#08111F] font-sans">Recent Analyses</h2>
          <p className="text-xs text-[#5D6675] mt-0.5">Your latest evaluated commercial locations</p>
        </div>

        <button
          onClick={() => navigate('/analyze')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#315CF5] hover:text-[#2448D8] transition-colors cursor-pointer"
        >
          <span>New Analysis</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3 py-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-16 bg-[#F6F8FC] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 px-4 bg-[#F6F8FC] border border-[#DDE3EC] rounded-xl">
          <div className="w-12 h-12 rounded-2xl bg-white border border-[#DDE3EC] flex items-center justify-center mx-auto mb-3 shadow-2xs">
            <MapPin className="w-6 h-6 text-[#315CF5]" />
          </div>
          <h3 className="text-base font-bold text-[#08111F] mb-1">Your first location starts here</h3>
          <p className="text-xs text-[#5D6675] max-w-md mx-auto mb-5 leading-relaxed font-normal">
            Choose a potential business site on the interactive map and Obrix will evaluate the surrounding location signals.
          </p>
          <button
            onClick={() => navigate('/analyze')}
            className="inline-flex items-center gap-2 bg-[#315CF5] hover:bg-[#2448D8] text-white text-xs font-semibold px-5 py-2.5 rounded-full transition-all shadow-2xs hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Analyze Your First Location</span>
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="space-y-2.5 min-w-[600px]">
            {requests.slice(0, 6).map((req) => {
              const scoreVal = req.result?.site_readiness_score ? parseFloat(req.result.site_readiness_score) : null
              const tier = scoreVal !== null ? getTierBadge(scoreVal) : null
              const BizIcon = BIZ_ICONS[req.business_type?.toLowerCase()] || MapPin
              const formattedBiz = req.business_type
                ? req.business_type.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                : 'Commercial Store'

              const latStr = req.latitude ? parseFloat(req.latitude).toFixed(4) : ''
              const lonStr = req.longitude ? parseFloat(req.longitude).toFixed(4) : ''
              const coordText = latStr && lonStr ? `${latStr}° N, ${lonStr}° E` : 'Selected Coordinates'

              return (
                <div
                  key={req.id}
                  tabIndex={0}
                  role="button"
                  aria-label={`Open ${formattedBiz} analysis at ${coordText}`}
                  onClick={() => handleOpenAnalysis(req)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleOpenAnalysis(req)
                    }
                  }}
                  className="flex items-center justify-between p-3.5 bg-[#F6F8FC] hover:bg-[#E9EFFF]/60 border border-[#DDE3EC] hover:border-[#315CF5]/40 rounded-xl transition-all duration-150 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-[#315CF5]/50"
                >
                  {/* Left: Icon & Title */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-white border border-[#DDE3EC] text-[#315CF5] flex items-center justify-center shrink-0 group-hover:bg-[#315CF5] group-hover:text-white transition-colors">
                      <BizIcon className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#08111F] truncate font-sans">
                          {formattedBiz}
                        </span>
                        <span className="text-[11px] font-mono text-[#8A94A3] bg-white px-2 py-0.5 rounded border border-[#DDE3EC] shrink-0">
                          {coordText}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-[#5D6675] mt-1 font-mono">
                        <span className="flex items-center gap-1 text-[11px]">
                          <Clock className="w-3 h-3 text-[#8A94A3]" />
                          {req.created_at
                            ? new Date(req.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Recently'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Score & Tier Badge */}
                  <div className="flex items-center gap-4 shrink-0">
                    {scoreVal !== null ? (
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full ${tier.bg} ${tier.text} ${tier.border}`}>
                          {tier.label}
                        </span>
                        <div className="text-right">
                          <span className="text-xl font-extrabold font-mono text-[#08111F]">
                            {Math.round(scoreVal)}
                          </span>
                          <span className="text-xs font-mono text-[#8A94A3]"> / 100</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs font-mono text-[#8A94A3] uppercase bg-white px-2.5 py-1 rounded border border-[#DDE3EC]">
                        {req.status || 'PENDING'}
                      </span>
                    )}

                    <ArrowRight className="w-4 h-4 text-[#8A94A3] group-hover:text-[#315CF5] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
