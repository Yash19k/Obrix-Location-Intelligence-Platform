/**
 * AnalysisPanel — right-side results panel (Phase 2 fix).
 *
 * No longer uses absolute positioning or CSS transform slide.
 * Animation is handled by the parent div's width transition in Analyze.jsx.
 * This component simply fills whatever space the parent gives it.
 */

import { X, TrendingUp, MapPin, Lightbulb, ChevronRight } from 'lucide-react'
import useMapStore from '@/store/mapStore'
import { FACTOR_META, BUSINESS_TYPES } from '@/constants'
import ScoreRing from './ScoreRing'
import FactorBar from './FactorBar'

export default function AnalysisPanel() {
  const { analysisResult, closePanel } = useMapStore()

  const result     = analysisResult?.result ?? null
  const score      = result?.site_readiness_score ?? 0
  const breakdown  = result?.score_breakdown ?? {}
  const insights   = result?.ai_insights ?? []
  const recs       = result?.recommendations ?? []
  const bType      = BUSINESS_TYPES.find((b) => b.value === analysisResult?.business_type)

  // No result yet — render nothing (parent width is 0 so it's invisible anyway)
  if (!result) return null

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4
                      border-b border-white/[0.07] flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-brand-600/20 border border-brand-500/20
                          flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-brand-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-white leading-tight">Analysis Result</h2>
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
                        bg-white/[0.025] rounded-2xl border border-white/[0.06]">
          <p className="text-[10px] text-white/25 uppercase tracking-[0.15em] font-semibold mb-4">
            Site Readiness Score
          </p>
          <ScoreRing score={score} size={144} />

          {/* Coordinates chip */}
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
        </div>

        {/* Factor breakdown */}
        {Object.keys(breakdown).length > 0 && (
          <div className="space-y-4">
            <SectionDivider label="Factor Scores" />
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
                    delay={i * 90}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* AI Insights */}
        {insights.length > 0 && (
          <div className="space-y-3">
            <SectionDivider label="Insights" />
            {insights.map((insight, i) => (
              <div key={i} className="p-3.5 rounded-xl border border-white/[0.06]
                                      bg-white/[0.025]">
                <div className="flex items-start gap-2.5">
                  <Lightbulb className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white/80 leading-snug">
                      {insight.title}
                    </p>
                    <p className="text-xs text-white/40 mt-1 leading-relaxed">
                      {insight.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recommendations */}
        {recs.length > 0 && (
          <div className="space-y-3">
            <SectionDivider label="Recommendations" />
            {recs.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl
                                      bg-white/[0.025] border border-white/[0.06]">
                <ChevronRight className="w-4 h-4 text-accent-400 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white/80 leading-snug">
                    {rec.action}
                  </p>
                  {rec.rationale && (
                    <p className="text-xs text-white/40 mt-1 leading-relaxed">
                      {rec.rationale}
                    </p>
                  )}
                  {rec.impact && (
                    <span className={`inline-block mt-2 text-[10px] font-semibold uppercase
                                      tracking-wider px-2 py-0.5 rounded-full
                                      ${rec.impact === 'high'
                                        ? 'bg-emerald-500/15 text-emerald-400'
                                        : rec.impact === 'medium'
                                          ? 'bg-amber-500/15 text-amber-400'
                                          : 'bg-slate-500/15 text-slate-400'
                                      }`}>
                      {rec.impact} impact
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div className="px-5 py-3 border-t border-white/[0.07] flex-shrink-0">
        <p className="text-[10px] text-white/20 text-center leading-relaxed">
          Phase 4 mock scoring · Real OSM data from Phase 5
        </p>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-px flex-1 bg-white/[0.06]" />
      <span className="text-[10px] text-white/25 uppercase tracking-[0.12em] font-semibold">
        {label}
      </span>
      <div className="h-px flex-1 bg-white/[0.06]" />
    </div>
  )
}
