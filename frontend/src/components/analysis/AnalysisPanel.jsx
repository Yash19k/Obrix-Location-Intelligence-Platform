import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X, Check, Bookmark, ArrowLeftRight, TrendingUp, MapPin, Sparkles, CheckCircle2, AlertTriangle, Loader2
} from 'lucide-react'
import useMapStore from '@/store/mapStore'
import useLocationStore from '@/store/locationStore'
import useAiChatStore from '@/store/aiChatStore'
import useReportStore from '@/store/reportStore'
import { FACTOR_META, BUSINESS_TYPES } from '@/constants'
import ScoreRing from './ScoreRing'
import FactorBar from './FactorBar'
import CompetitorAnalysisCard from './CompetitorAnalysisCard'
import AiInsightsCard from './AiInsightsCard'
import LocationComparisonModal from './LocationComparisonModal'
import ReportViewerModal from '../reports/ReportViewerModal'

export default function AnalysisPanel() {
  const navigate = useNavigate()
  const { analysisResult, isAnalyzing, closePanel, selectedLat, selectedLon } = useMapStore()
  const { saveLocation, isSaving, savedLocations, isComparisonOpen, closeComparison, secondaryResult } = useLocationStore()
  const { activeReport, closeReportViewer } = useReportStore()

  const [savedSuccess, setSavedSuccess] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)
  const [toastType, setToastType] = useState('success')

  const result = analysisResult?.result ?? null
  const score = result?.site_readiness_score ? parseFloat(result.site_readiness_score) : 0
  const breakdown = result?.score_breakdown ?? {}
  const rawFactors = result?.raw_factors ?? {}
  const bType = BUSINESS_TYPES.find((b) => b.value === (analysisResult?.business_type || 'pharmacy'))

  const handleBookmark = async () => {
    if (!analysisResult) return
    const lat = parseFloat(analysisResult.latitude ?? selectedLat)
    const lon = parseFloat(analysisResult.longitude ?? selectedLon)

    if (isNaN(lat) || isNaN(lon)) {
      setToastType('error')
      setToastMessage('Invalid location coordinates')
      setTimeout(() => setToastMessage(null), 3000)
      return
    }

    const isAlreadySaved = savedLocations.some(
      (loc) =>
        parseFloat(loc.latitude).toFixed(4) === lat.toFixed(4) &&
        parseFloat(loc.longitude).toFixed(4) === lon.toFixed(4)
    )
    if (isAlreadySaved) {
      setToastType('error')
      setToastMessage('Location already saved!')
      setTimeout(() => setToastMessage(null), 3000)
      return
    }

    const bLabel = bType ? bType.label : 'Analysis Site'
    const name = `${bLabel} (${lat.toFixed(3)}, ${lon.toFixed(3)})`
    
    const metaPayload = JSON.stringify({
      type: 'single',
      business_type: analysisResult.business_type || 'retail',
      readiness_score: Number(score).toFixed(1),
      radius_m: analysisResult.radius_m || 1000,
      analysisResult: analysisResult,
    })

    const res = await saveLocation({
      name,
      description: metaPayload,
      latitude: lat,
      longitude: lon,
      address: `${bLabel} near ${lat.toFixed(4)}, ${lon.toFixed(4)}`,
    })

    if (res.success) {
      setSavedSuccess(true)
      setToastType('success')
      setToastMessage('✓ Location saved successfully')
      setTimeout(() => setSavedSuccess(false), 3000)
      setTimeout(() => setToastMessage(null), 3500)
    } else {
      setToastType('error')
      setToastMessage(res.error || 'Failed to save location.')
      setTimeout(() => setToastMessage(null), 3500)
    }
  }

  const handleDiscussWithAI = () => {
    if (analysisResult) {
      useAiChatStore.getState().openChat('single_analysis', analysisResult)
    }
    navigate('/ask-obrix')
  }

  // Loading Skeleton state
  if (isAnalyzing) return <LoadingSkeleton />

  // Nothing to show if no analysis result
  if (!result) return null

  return (
    <div className="flex flex-col h-full min-h-0 relative bg-white font-sans text-[#08111F]">

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`absolute top-3 left-4 right-4 z-50 p-3 rounded-xl text-xs font-bold text-white shadow-xl flex items-center gap-2 ${
          toastType === 'error' ? 'bg-red-600' : 'bg-[#43B96B]'
        }`}>
          <Check className="w-4 h-4" /> {toastMessage}
        </div>
      )}

      {/* ── 1. Header Bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#DDE3EC] bg-[#F6F8FC] flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#E9EFFF] border border-[#315CF5]/20 flex items-center justify-center flex-shrink-0 text-[#315CF5]">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-extrabold text-[#08111F] leading-tight font-sans">
              Analysis Result
            </h2>
            {bType && (
              <p className="text-xs text-[#5D6675] mt-0.5 truncate font-medium">
                {bType.icon} {bType.label}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={closePanel}
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-[#8A94A3] hover:text-[#08111F] hover:bg-[#E2E8F0] transition-colors ml-2 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── 2. Scrollable Body ───────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-6">

        {/* 2. Site Readiness Score Card */}
        <div className="flex flex-col items-center p-5 bg-[#F6F8FC] rounded-2xl border border-[#DDE3EC] relative shadow-2xs">
          <p className="text-[10px] text-[#8A94A3] uppercase tracking-widest font-mono font-bold mb-4">
            SITE READINESS SCORE
          </p>

          <ScoreRing score={score} size={144} />

          {analysisResult?.latitude && (
            <div className="mt-4 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#DDE3EC] rounded-full shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-[#315CF5]" />
              <span className="text-xs font-mono font-bold text-[#08111F]">
                {parseFloat(analysisResult.latitude).toFixed(6)}° N, {parseFloat(analysisResult.longitude).toFixed(6)}° E
              </span>
            </div>
          )}

          {/* Action Buttons (Bookmark + Compare) */}
          <div className="mt-4 flex items-center gap-2 w-full">
            <button
              onClick={handleBookmark}
              disabled={isSaving}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                savedSuccess
                  ? 'bg-[#E7F7E9] text-[#43B96B] border-[#43B96B]/30'
                  : 'bg-white text-[#08111F] border-[#DDE3EC] hover:bg-[#E9EFFF]'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 text-[#315CF5]" />
              <span>{savedSuccess ? 'Saved' : 'Save Analysis'}</span>
            </button>

            <button
              onClick={() => {
                if (analysisResult) {
                  useMapStore.getState().setLocationA(analysisResult)
                  useMapStore.getState().setCompareStep('select_b')
                  useMapStore.setState({ compareMode: true, showPanel: false })
                }
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-[#E9EFFF] text-[#315CF5] border border-[#315CF5]/20 hover:bg-[#315CF5] hover:text-white transition-all cursor-pointer"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Compare</span>
            </button>
          </div>
        </div>

        {/* 3. Competitor Analysis Card */}
        {result && (
          <CompetitorAnalysisCard result={result.raw_factors?._meta?.competition_metrics ? { competition_metrics: result.raw_factors._meta.competition_metrics } : result} />
        )}

        {/* 4. Score Factors Breakdown */}
        {Object.keys(breakdown).length > 0 && (
          <div className="space-y-3">
            <SectionDivider label="SCORE FACTORS" />
            <div className="space-y-3.5 bg-[#F6F8FC] border border-[#DDE3EC] rounded-2xl p-4">
              {Object.entries(breakdown).map(([key, val], i) => {
                const meta = FACTOR_META[key] ?? { label: key, icon: '📊' }
                return (
                  <FactorBar
                    key={key}
                    factorKey={key}
                    label={meta.label}
                    icon={meta.icon}
                    value={val}
                    explanation={rawFactors[key]?.explanation ?? ''}
                    delay={i * 80}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* 5. AI Recommendation */}
        {result?.recommendation && (
          <div className="space-y-2">
            <SectionDivider label="AI RECOMMENDATION" />
            <div className="p-4 rounded-2xl border border-[#DDE3EC] bg-[#F6F8FC] space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-[#315CF5]">
                <Sparkles className="w-4 h-4 text-[#315CF5]" />
                <span>Executive Summary & Feasibility</span>
              </div>
              <p className="text-xs text-[#08111F] leading-relaxed font-sans font-normal">
                {result.recommendation}
              </p>
            </div>
          </div>
        )}

        {/* 6. Top Analysis Factors (Strengths & Risks) */}
        {((result?.top_positive && result.top_positive.length > 0) ||
          (result?.top_negative && result.top_negative.length > 0)) && (
          <div className="space-y-3">
            <SectionDivider label="TOP ANALYSIS FACTORS" />
            <div className="grid grid-cols-1 gap-3">
              {/* Positive Strengths */}
              {result?.top_positive && result.top_positive.length > 0 && (
                <div className="p-4 rounded-2xl border border-[#43B96B]/30 bg-[#E7F7E9] space-y-2">
                  <p className="text-xs font-mono font-extrabold text-[#43B96B] uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> STRENGTHS / POSITIVES
                  </p>
                  <ul className="space-y-1.5 font-sans">
                    {result.top_positive.map((factor, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-[#08111F] leading-relaxed">
                        <span className="text-[#43B96B] font-bold">•</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Negative Risks */}
              {result?.top_negative && result.top_negative.length > 0 && (
                <div className="p-4 rounded-2xl border border-amber-300 bg-[#FEF3C7] space-y-2">
                  <p className="text-xs font-mono font-extrabold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> RISKS / NEGATIVES
                  </p>
                  <ul className="space-y-1.5 font-sans">
                    {result.top_negative.map((factor, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-[#08111F] leading-relaxed">
                        <span className="text-amber-800 font-bold">•</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 7. AI Intelligence Section (AiInsightsCard) */}
        {result && (
          <div className="space-y-3">
            <SectionDivider label="AI INTELLIGENCE" />
            <AiInsightsCard analysisResult={analysisResult} />
          </div>
        )}

        {/* 8. Obrix AI Consultant Card */}
        {result && (
          <div className="p-5 rounded-2xl bg-[#E9EFFF]/60 border border-[#315CF5]/30 space-y-3 shadow-2xs font-sans">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#315CF5]" />
                <h3 className="text-xs font-extrabold text-[#08111F] font-sans">Obrix AI Consultant</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white text-[#315CF5] border border-[#315CF5]/20">
                Interactive
              </span>
            </div>
            <p className="text-xs text-[#5D6675] leading-relaxed font-sans">
              Ask questions about this location's potential, risks and opportunities.
            </p>
            <button
              onClick={handleDiscussWithAI}
              className="w-full py-3 px-4 rounded-xl text-xs font-extrabold bg-[#315CF5] hover:bg-[#2448D8] text-white shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer font-sans"
            >
              <Sparkles className="w-4 h-4" /> Discuss with Obrix AI
            </button>
          </div>
        )}
      </div>

      {/* Location Comparison Modal */}
      <LocationComparisonModal
        isOpen={isComparisonOpen}
        onClose={closeComparison}
        primaryResult={analysisResult}
        secondaryResult={secondaryResult}
      />

      {/* AI Consulting Report Viewer */}
      {activeReport && (
        <ReportViewerModal
          isOpen={!!activeReport}
          onClose={closeReportViewer}
          report={activeReport}
        />
      )}
    </div>
  )
}

// ── LoadingSkeleton ───────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="flex flex-col h-full bg-white font-sans p-6 overflow-hidden">
      <div className="flex items-center justify-between pb-4 border-b border-[#DDE3EC] mb-6">
        <div className="flex items-center gap-2.5">
          <Loader2 className="w-4 h-4 text-[#315CF5] animate-spin" />
          <span className="text-xs font-mono font-bold text-[#315CF5] uppercase">
            ANALYZING LOCATION DATA
          </span>
        </div>
      </div>

      <div className="space-y-6 flex-1 overflow-hidden">
        <div className="h-44 bg-[#F6F8FC] border border-[#DDE3EC] rounded-2xl animate-pulse" />
        <div className="h-28 bg-[#F6F8FC] border border-[#DDE3EC] rounded-2xl animate-pulse" />
        <div className="h-48 bg-[#F6F8FC] border border-[#DDE3EC] rounded-2xl animate-pulse" />
      </div>
    </div>
  )
}

// ── SectionDivider ────────────────────────────────────────────────────────────

function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-px flex-1 bg-[#DDE3EC]" />
      <span className="text-[10px] font-mono text-[#8A94A3] uppercase tracking-widest font-bold">
        {label}
      </span>
      <div className="h-px flex-1 bg-[#DDE3EC]" />
    </div>
  )
}
