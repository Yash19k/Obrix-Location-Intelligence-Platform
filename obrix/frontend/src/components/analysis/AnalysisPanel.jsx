/**
 * AnalysisPanel — right-side results panel (Phase 3.2).
 *
 * Phase 3.2 additions:
 * - NearbyFeaturesGrid: real OSM feature counts from Overpass API
 * - LoadingSkeleton: shown while Overpass query runs (~7s)
 * - OsmErrorCard: shown when Overpass is unavailable
 * - Contextual insights driven by real counts
 *
 * Animation: parent (Analyze.jsx) expands panel width on showPanel || isAnalyzing.
 * This component fills whatever space the parent gives it.
 */

import {
  X, TrendingUp, MapPin, Lightbulb, ChevronRight,
  AlertTriangle, Globe2,
} from 'lucide-react'
import useMapStore from '@/store/mapStore'
import { FACTOR_META, BUSINESS_TYPES } from '@/constants'
import ScoreRing from './ScoreRing'
import FactorBar from './FactorBar'

// ── Feature display metadata ────────────────────────────────────────────────
const FEATURE_META = {
  roads:         { emoji: '🛣️',  label: 'Roads' },
  restaurants:   { emoji: '🍽️', label: 'Restaurants' },
  banks:         { emoji: '🏦',  label: 'Banks' },
  bus_stops:     { emoji: '🚌',  label: 'Bus Stops' },
  hospitals:     { emoji: '🏥',  label: 'Hospitals' },
  schools:       { emoji: '🏫',  label: 'Schools' },
  fuel_stations: { emoji: '⛽',  label: 'Fuel Stations' },
  parks:         { emoji: '🌳',  label: 'Parks' },
}

// Ordered by typical relevance (high-signal first)
const DISPLAY_ORDER = [
  'roads', 'restaurants', 'banks', 'bus_stops',
  'hospitals', 'schools', 'fuel_stations', 'parks',
]

// ── Main component ──────────────────────────────────────────────────────────

export default function AnalysisPanel() {
  const { analysisResult, isAnalyzing, closePanel } = useMapStore()

  const result        = analysisResult?.result   ?? null
  const score         = result?.site_readiness_score ?? 0
  const breakdown     = result?.score_breakdown  ?? {}
  const insights      = result?.ai_insights      ?? []
  const recs          = result?.recommendations  ?? []
  const featureCounts = result?.feature_counts   ?? {}
  const osmMeta       = result?.osm_query_meta   ?? {}
  const rawFactors    = result?.raw_factors       ?? {}
  const osmError      = osmMeta.osm_error        ?? null
  const bType = BUSINESS_TYPES.find((b) => b.value === analysisResult?.business_type)

  // Loading skeleton while Overpass query is in-flight
  if (isAnalyzing) return <LoadingSkeleton />

  // Nothing to show
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
                        bg-white/[0.025] rounded-2xl border border-white/[0.06]">
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
        </div>

        {/* ── Nearby Features (real OSM data) ─────────────────────────── */}
        <div className="space-y-3">
          <SectionDivider label="Nearby Features">
            <div className="flex items-center gap-1.5">
              <Globe2 className="w-3 h-3 text-white/20" />
              <span className="text-[10px] text-white/20">
                {osmError
                  ? 'unavailable'
                  : `${osmMeta.total_features ?? 0} via OpenStreetMap`}
              </span>
            </div>
          </SectionDivider>

          {osmError
            ? <OsmErrorCard />
            : <NearbyFeaturesGrid counts={featureCounts} />
          }
        </div>

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

        {/* Insights */}
        {insights.length > 0 && (
          <div className="space-y-3">
            <SectionDivider label="Insights" />
            {insights.map((insight, i) => (
              <div key={i} className="p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.025]">
                <div className="flex items-start gap-2.5">
                  {insight.type === 'warning'
                    ? <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    : <Lightbulb     className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
                  }
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
              <div key={i}
                className="flex items-start gap-3 p-3.5 rounded-xl
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
                    <span className={`inline-block mt-2 text-[10px] font-semibold
                                      uppercase tracking-wider px-2 py-0.5 rounded-full
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
          {osmMeta.source === 'cache'
            ? '📦 Cached · '
            : osmMeta.query_time_ms
              ? `⚡ ${Math.round(osmMeta.query_time_ms)}ms · `
              : ''}
          {osmError ? 'OSM unavailable · ' : ''}
          Scoring engine: Phase 5
        </p>
      </div>
    </div>
  )
}

// ── NearbyFeaturesGrid ────────────────────────────────────────────────────────

function NearbyFeaturesGrid({ counts }) {
  const hasAny = DISPLAY_ORDER.some((cat) => (counts[cat] ?? 0) > 0)

  if (!hasAny) {
    return (
      <div className="rounded-xl border border-dashed border-white/[0.08]
                      p-5 text-center">
        <p className="text-xs text-white/30">
          No features found within the search radius.
          Try increasing the radius.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {DISPLAY_ORDER.map((cat) => {
        const meta  = FEATURE_META[cat] ?? { emoji: '📍', label: cat }
        const count = counts[cat] ?? 0
        const active = count > 0

        return (
          <div
            key={cat}
            className={`flex items-center gap-2.5 p-3 rounded-xl border
                        transition-colors duration-150
                        ${active
                          ? 'bg-white/[0.045] border-white/[0.09]'
                          : 'bg-white/[0.015] border-white/[0.04]'
                        }`}
          >
            <span className="text-xl leading-none flex-shrink-0">
              {meta.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`text-[10px] leading-tight truncate
                             ${active ? 'text-white/45' : 'text-white/20'}`}>
                {meta.label}
              </p>
              <p className={`text-lg font-bold leading-tight tabular-nums
                             ${active ? 'text-white' : 'text-white/20'}`}>
                {count}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── OsmErrorCard ──────────────────────────────────────────────────────────────

function OsmErrorCard() {
  return (
    <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.05]">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-amber-300/80 leading-snug">
            Geospatial data temporarily unavailable
          </p>
          <p className="text-xs text-white/35 mt-1 leading-relaxed">
            Could not retrieve OpenStreetMap data for this location.
            The site score shown is based on mock values only.
          </p>
        </div>
      </div>
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

        {/* Features grid skeleton */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="h-2.5 w-28 rounded bg-white/[0.06] animate-pulse" />
            <div className="h-2.5 w-24 rounded bg-white/[0.04] animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-[3.25rem] rounded-xl bg-white/[0.04] animate-pulse
                           border border-white/[0.06]"
                style={{ animationDelay: `${i * 60}ms` }}
              />
            ))}
          </div>
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
            Fetching OpenStreetMap data…
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
