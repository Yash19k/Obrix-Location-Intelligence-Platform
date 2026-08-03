/**
 * AnalysisPanel — right-side results panel (Phase 3 Final).
 *
 * Phase 3 Final additions:
 * - IntelligenceMetricsCard: confidence, road quality, nearest distances,
 *   density, competition metrics from distance-enriched scoring engine.
 *
 * Earlier additions:
 * - NearbyFeaturesGrid: real OSM feature counts (Phase 3.2)
 * - LoadingSkeleton: shown while Overpass query runs (Phase 3.2)
 * - OsmErrorCard: shown when Overpass unavailable (Phase 3.2)
 *
 * Animation: parent (Analyze.jsx) expands panel width on showPanel || isAnalyzing.
 */

import { useState } from 'react'
import {
  X, Check, Bookmark, ArrowLeftRight, TrendingUp, MapPin,
} from 'lucide-react'
import useMapStore from '@/store/mapStore'
import useLocationStore from '@/store/locationStore'
import { FACTOR_META, BUSINESS_TYPES } from '@/constants'
import ScoreRing from './ScoreRing'
import FactorBar from './FactorBar'
import CompetitorAnalysisCard from './CompetitorAnalysisCard'
import LocationComparisonModal from './LocationComparisonModal'
import AiInsightsCard from './AiInsightsCard'
import ReportViewerModal from '../reports/ReportViewerModal'
import useReportStore from '@/store/reportStore'

// ── Main component ──────────────────────────────────────────────────────────

export default function AnalysisPanel() {
  const { analysisResult, isAnalyzing, closePanel, selectedLat, selectedLon } = useMapStore()
  const { saveLocation, isSaving, savedLocations, isComparisonOpen, closeComparison, secondaryResult } = useLocationStore()
  const { activeReport, closeReportViewer } = useReportStore()

  const [savedSuccess, setSavedSuccess] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)
  const [toastType, setToastType] = useState('success')

  const result           = analysisResult?.result   ?? null
  const score            = result?.site_readiness_score ?? 0
  const breakdown        = result?.score_breakdown  ?? {}
  const rawFactors       = result?.raw_factors       ?? {}
  const bType = BUSINESS_TYPES.find((b) => b.value === analysisResult?.business_type)

  const handleBookmark = async () => {
    if (!analysisResult) return
    const lat = parseFloat(analysisResult.latitude ?? selectedLat)
    const lon = parseFloat(analysisResult.longitude ?? selectedLon)

    if (isNaN(lat) || isNaN(lon)) {
      setToastType('error')
      setToastMessage('Invalid location coordinates')
      setTimeout(() => setToastMessage(null), 4000)
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
      setTimeout(() => setToastMessage(null), 4000)
    }
  }

  // Loading skeleton while Overpass query is in-flight
  if (isAnalyzing) return <LoadingSkeleton />

  // Nothing to show
  if (!result) return null

  return (
    <div className="flex flex-col h-full min-h-0 relative">

      {toastMessage && (
        <div className={`absolute top-2 left-5 right-5 z-50 px-3.5 py-2 rounded-xl text-xs font-semibold text-white shadow-2xl flex items-center gap-2 animate-bounce ${
          toastType === 'error' ? 'bg-rose-600 border border-rose-400' : 'bg-emerald-600 border border-emerald-400'
        }`}>
          <Check className="w-4 h-4" /> {toastMessage}
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4
                      border-b border-white/[0.07] flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-brand-600/20 border border-brand-500/20
                          flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-brand-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-white leading-tight">
              Analysis Result
            </h2>
            {bType && (
              <p className="text-xs text-white/40 mt-0.5 truncate">
                {bType.icon} {bType.label}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={closePanel}
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                     text-white/30 hover:text-white hover:bg-white/[0.07]
                     transition-all duration-150 ml-2"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Scrollable body ─────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-5">

        {/* Score ring */}
        <div className="flex flex-col items-center py-5
                        bg-white/[0.025] rounded-2xl border border-white/[0.06] relative">
          <p className="text-[10px] text-white/25 uppercase tracking-[0.15em] font-semibold mb-4">
            Site Readiness Score
          </p>
          <ScoreRing score={score} size={144} />
          {analysisResult?.latitude && (
            <div className="mt-4 flex items-center gap-1.5 px-3 py-1.5
                            bg-white/[0.04] border border-white/[0.07] rounded-full">
              <MapPin className="w-3 h-3 text-white/25" />
              <span className="text-[10px] font-mono text-white/40">
                {parseFloat(analysisResult.latitude).toFixed(5)},&nbsp;
                {parseFloat(analysisResult.longitude).toFixed(5)}
              </span>
            </div>
          )}

          {/* Action Buttons (Bookmark + Compare) */}
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={handleBookmark}
              disabled={isSaving}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                savedSuccess
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-white/[0.05] text-slate-200 border-white/10 hover:bg-white/10'
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Saved!
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5 text-indigo-400" /> Save Analysis
                </>
              )}
            </button>

            {/* Compare with another location button */}
            <button
              onClick={() => {
                if (analysisResult) {
                  useMapStore.getState().setLocationA(analysisResult)
                  useMapStore.getState().setCompareStep('select_b')
                  useMapStore.setState({ compareMode: true, showPanel: false })
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition-all"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400" /> Compare
            </button>
          </div>
        </div>

        {/* ── Competitor Analysis (Priority 3) ───────────────────────── */}
        {result && (
          <CompetitorAnalysisCard result={result.raw_factors?._meta?.competition_metrics ? { competition_metrics: result.raw_factors._meta.competition_metrics } : result} />
        )}


        {/* Factor breakdown */}
        {Object.keys(breakdown).length > 0 && (
          <div className="space-y-4">
            <SectionDivider label="Score Factors" />
            <div className="space-y-3.5">
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
                    delay={i * 90}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* AI Recommendation */}
        {result?.recommendation && (
          <div className="space-y-3">
            <SectionDivider label="AI Recommendation" />
            <div className="p-4 rounded-2xl border border-brand-500/20 bg-brand-500/5 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/10 rounded-full blur-2xl" />
              <p className="text-xs text-slate-200 leading-relaxed relative z-10 font-medium">
                {result.recommendation}
              </p>
            </div>
          </div>
        )}

        {/* Top Positive & Negative Factors */}
        {((result?.top_positive && result.top_positive.length > 0) ||
          (result?.top_negative && result.top_negative.length > 0)) && (
          <div className="space-y-4">
            <SectionDivider label="Top Analysis Factors" />
            <div className="grid grid-cols-1 gap-3">
              {/* Positive Factors */}
              {result?.top_positive && result.top_positive.length > 0 && (
                <div className="p-3.5 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.02]">
                  <p className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Strengths / Positives
                  </p>
                  <ul className="space-y-1.5">
                    {result.top_positive.map((factor, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-300 leading-normal">
                        <span className="text-emerald-400 font-bold shrink-0 mt-0.5">•</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Negative Factors */}
              {result?.top_negative && result.top_negative.length > 0 && (
                <div className="p-3.5 rounded-2xl border border-rose-500/15 bg-rose-500/[0.02]">
                  <p className="text-[10px] font-bold tracking-widest text-rose-400 uppercase mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Risks / Negatives
                  </p>
                  <ul className="space-y-1.5">
                    {result.top_negative.map((factor, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-300 leading-normal">
                        <span className="text-rose-400 font-bold shrink-0 mt-0.5">•</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Insights Card */}
        {result && (
          <div className="space-y-3 mt-4">
            <SectionDivider label="AI Intelligence" />
            <AiInsightsCard analysisResult={analysisResult} />
          </div>
        )}
      </div>

      {/* Location Comparison Modal (Priority 4) */}
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
    <div className="flex flex-col h-full min-h-0">

      {/* Header skeleton */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4
                      border-b border-white/[0.07] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/[0.06] animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-3 w-28 rounded bg-white/[0.06] animate-pulse" />
            <div className="h-2.5 w-20 rounded bg-white/[0.04] animate-pulse" />
          </div>
        </div>
      </div>

      <div className="flex-1 px-5 py-5 space-y-5 overflow-hidden">

        {/* Score ring skeleton */}
        <div className="flex flex-col items-center py-5
                        bg-white/[0.025] rounded-2xl border border-white/[0.06]">
          <div className="h-2.5 w-36 rounded bg-white/[0.06] animate-pulse mb-4" />
          <div className="w-36 h-36 rounded-full bg-white/[0.06] animate-pulse" />
          <div className="mt-4 h-5 w-40 rounded-full bg-white/[0.04] animate-pulse" />
        </div>

        {/* Factor bars skeleton */}
        <div className="space-y-3">
          <div className="h-2.5 w-24 rounded bg-white/[0.06] animate-pulse" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-2.5 w-20 rounded bg-white/[0.04] animate-pulse" />
              <div
                className="flex-1 h-1.5 rounded-full bg-white/[0.04] animate-pulse"
                style={{ animationDelay: `${i * 80}ms` }}
              />
              <div className="h-2.5 w-8 rounded bg-white/[0.04] animate-pulse" />
            </div>
          ))}
        </div>

        {/* Fetching indicator */}
        <div className="flex items-center justify-center gap-2.5 py-2">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-brand-400/60 animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
          <span className="text-xs text-white/30">
            Analyzing location data…
          </span>
        </div>
      </div>
    </div>
  )
}

// ── SectionDivider ────────────────────────────────────────────────────────────

function SectionDivider({ label, children }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-px flex-1 bg-white/[0.06]" />
      <span className="text-[10px] text-white/25 uppercase tracking-[0.12em] font-semibold">
        {label}
      </span>
      <div className="h-px flex-1 bg-white/[0.06]" />
      {children && <div className="flex-shrink-0">{children}</div>}
    </div>
  )
}

