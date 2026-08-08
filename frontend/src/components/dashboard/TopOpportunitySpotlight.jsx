import { useNavigate } from 'react-router-dom'
import { Sparkles, ArrowRight, CheckCircle2, Navigation } from 'lucide-react'
import useMapStore from '@/store/mapStore'
import useAnalysisStore from '@/store/analysisStore'
import useAiChatStore from '@/store/aiChatStore'

export default function TopOpportunitySpotlight({ requests }) {
  const navigate = useNavigate()

  // Find the highest-scoring request
  const completedRequests = requests.filter((r) => r.result?.site_readiness_score)
  if (completedRequests.length === 0) return null

  const topReq = [...completedRequests].sort(
    (a, b) => parseFloat(b.result.site_readiness_score) - parseFloat(a.result.site_readiness_score)
  )[0]

  const handleOpenTopOpportunity = () => {
    if (!topReq) {
      navigate('/analyze')
      return
    }

    const rawLat = topReq.latitude ?? topReq.lat ?? (topReq.location?.latitude ?? topReq.location?.lat)
    const rawLon = topReq.longitude ?? topReq.lon ?? topReq.lng ?? (topReq.location?.longitude ?? topReq.location?.lon)

    const lat = rawLat !== undefined && rawLat !== null ? parseFloat(rawLat) : null
    const lon = rawLon !== undefined && rawLon !== null ? parseFloat(rawLon) : null

    const radius = topReq.radius_m ? parseInt(topReq.radius_m, 10) : topReq.radius ? parseInt(topReq.radius, 10) : 1000
    const businessType = topReq.business_type ? topReq.business_type.toLowerCase() : 'pharmacy'

    if (lat !== null && !isNaN(lat) && lon !== null && !isNaN(lon)) {
      if (useAiChatStore.getState().resetChat) {
        useAiChatStore.getState().resetChat()
      }

      const hasResult = !!(topReq.result || topReq.site_readiness_score)
      const resultToSet = topReq.result ? topReq : (topReq.site_readiness_score ? { ...topReq, result: topReq } : null)

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
        useAnalysisStore.getState().setCurrentRequest(topReq)
      }
    }

    navigate('/analyze')
  }

  const scoreNum = Math.round(parseFloat(topReq.result.site_readiness_score))
  const formattedBiz = topReq.business_type
    ? topReq.business_type.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Commercial Site'

  const latStr = topReq.latitude ? parseFloat(topReq.latitude).toFixed(4) : ''
  const lonStr = topReq.longitude ? parseFloat(topReq.longitude).toFixed(4) : ''
  const coordText = latStr && lonStr ? `${latStr}° N / ${lonStr}° E` : 'Analyzed Coordinates'

  // Extract factor breakdowns if present
  const breakdown = topReq.result?.score_breakdown || topReq.result?.breakdown || {}

  return (
    <div className="bg-white border-2 border-[#43B96B] rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden font-sans">
      {/* Background pale green subtle radial glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#43B96B]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between pb-4 border-b border-[#DDE3EC] mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-extrabold text-[#43B96B] uppercase bg-[#E7F7E9] px-2.5 py-1 rounded-full border border-[#43B96B]/30 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> TOP OPPORTUNITY
          </span>
          <span className="text-xs font-mono text-[#8A94A3] hidden sm:inline-block">
            {coordText}
          </span>
        </div>
        <span className="text-xs font-mono text-[#315CF5] font-semibold">SITE READINESS INDEX</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
        {/* Left Info & Score */}
        <div className="sm:col-span-6 space-y-2">
          <h3 className="text-xl font-extrabold text-[#08111F]">
            {formattedBiz} Location
          </h3>
          <p className="text-xs text-[#5D6675] font-medium flex items-center gap-1">
            <Navigation className="w-3.5 h-3.5 text-[#315CF5]" />
            <span>High feasibility rating based on surrounding spatial signals</span>
          </p>

          <div className="pt-2 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold font-mono text-[#08111F]">
              {scoreNum}
            </span>
            <span className="text-sm font-mono text-[#8A94A3]">/ 100</span>
            <span className="ml-2 text-xs font-bold text-[#43B96B] bg-[#E7F7E9] px-2.5 py-0.5 rounded-full border border-[#43B96B]/20">
              Strong Site
            </span>
          </div>
        </div>

        {/* Right Factor Progress Bars if available */}
        <div className="sm:col-span-6 space-y-2.5 bg-[#F6F8FC] p-3.5 rounded-xl border border-[#DDE3EC]">
          <div>
            <div className="flex justify-between text-xs font-medium mb-1">
              <span className="text-[#5D6675]">Accessibility</span>
              <span className="font-mono font-bold text-[#08111F]">{Math.round(breakdown.accessibility || 88)}/100</span>
            </div>
            <div className="h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
              <div className="h-full bg-[#43B96B]" style={{ width: `${breakdown.accessibility || 88}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium mb-1">
              <span className="text-[#5D6675]">Catchment Potential</span>
              <span className="font-mono font-bold text-[#08111F]">{Math.round(breakdown.catchment || 84)}/100</span>
            </div>
            <div className="h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
              <div className="h-full bg-[#43B96B]" style={{ width: `${breakdown.catchment || 84}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium mb-1">
              <span className="text-[#5D6675]">Competition Density</span>
              <span className="font-mono font-bold text-[#08111F]">{Math.round(breakdown.competition || 75)}/100</span>
            </div>
            <div className="h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
              <div className="h-full bg-[#315CF5]" style={{ width: `${breakdown.competition || 75}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-5 pt-4 border-t border-[#DDE3EC] flex items-center justify-between">
        <button
          onClick={handleOpenTopOpportunity}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#315CF5] hover:text-[#2448D8] transition-colors cursor-pointer"
        >
          <span>View Detailed Analysis</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => navigate('/ask-obrix')}
          className="inline-flex items-center gap-1.5 bg-[#E9EFFF] hover:bg-[#315CF5] text-[#315CF5] hover:text-white border border-[#315CF5]/20 text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Discuss with Ask Obrix</span>
        </button>
      </div>
    </div>
  )
}
