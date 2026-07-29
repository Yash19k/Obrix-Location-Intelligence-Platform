/**
 * IntelligenceMetricsCard — Phase 3 Final compact metrics display.
 *
 * Shows confidence score, road quality, nearest distances,
 * density data, and competition metrics from the enriched engine.
 *
 * Design rules:
 *   - Compact — same visual language as the existing panel
 *   - No redesign — uses identical tokens (bg-white/[0.025], border-white/[0.06], etc.)
 *   - Gracefully hides when data is empty (count-only mode or old results)
 */

import { Shield, MapPin, Route, Users, BarChart3 } from 'lucide-react'

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDist(metres) {
  if (metres == null || metres === undefined) return '—'
  if (metres < 1000) return `${Math.round(metres)}m`
  return `${(metres / 1000).toFixed(1)}km`
}

function fmtDensity(d) {
  if (d == null) return '—'
  return `${Number(d).toFixed(1)}/km²`
}

// ── Confidence badge ──────────────────────────────────────────────────────────

function ConfidenceBadge({ confidence }) {
  if (!confidence?.label) return null

  const colours = {
    High:   'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    Medium: 'text-amber-400  bg-amber-400/10  border-amber-400/20',
    Low:    'text-red-400    bg-red-400/10    border-red-400/20',
  }
  const cls = colours[confidence.label] ?? colours.Low

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-semibold ${cls}`}>
      <Shield className="w-3 h-3" />
      {confidence.label} Confidence · {Math.round(confidence.score)}%
    </div>
  )
}

// ── Metric row ────────────────────────────────────────────────────────────────

function MetricRow({ label, value, sub }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5
                    border-b border-white/[0.04] last:border-0">
      <span className="text-xs text-white/40 shrink-0">{label}</span>
      <div className="text-right">
        <span className="text-xs text-white/80 font-medium">{value}</span>
        {sub && <span className="text-xs text-white/30 ml-1.5">{sub}</span>}
      </div>
    </div>
  )
}

// ── Collapsible section ───────────────────────────────────────────────────────

function MetricSection({ icon: Icon, title, children }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5 text-brand-400 shrink-0" />
        <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
          {title}
        </span>
      </div>
      <div className="space-y-0">
        {children}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function IntelligenceMetricsCard({ result }) {
  const confidence       = result?.confidence         ?? {}
  const distanceMetrics  = result?.distance_metrics   ?? {}
  const densityMetrics   = result?.density_metrics    ?? {}
  const roadHierarchy    = result?.road_hierarchy     ?? {}
  const competitionMeta  = result?.competition_metrics ?? {}

  // Don't render if no enriched data available
  const hasData = (
    confidence?.label ||
    roadHierarchy?.road_quality_label ||
    Object.keys(distanceMetrics).length > 0
  )
  if (!hasData) return null

  // Key distances to surface (most decision-relevant)
  const KEY_DISTANCES = [
    { cat: 'hospitals',     label: 'Hospital' },
    { cat: 'schools',       label: 'School' },
    { cat: 'bus_stops',     label: 'Bus Stop' },
    { cat: 'fuel_stations', label: 'Fuel' },
    { cat: 'parks',         label: 'Park' },
  ]

  // Key densities
  const KEY_DENSITIES = [
    { cat: 'roads',       label: 'Roads' },
    { cat: 'restaurants', label: 'Restaurants' },
    { cat: 'banks',       label: 'Banks' },
  ]

  const roadQualityColour = {
    Excellent: 'text-emerald-400',
    Good:      'text-brand-400',
    Fair:      'text-amber-400',
    Poor:      'text-red-400',
  }[roadHierarchy.road_quality_label] ?? 'text-white/50'

  return (
    <div className="space-y-3">

      {/* ── Confidence header ──────────────────────────────────────────────── */}
      {confidence?.label && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/40 font-medium">Data Quality</span>
          <ConfidenceBadge confidence={confidence} />
        </div>
      )}

      {/* ── Road Hierarchy ─────────────────────────────────────────────────── */}
      {roadHierarchy?.road_quality_label && (
        <MetricSection icon={Route} title="Road Quality">
          <MetricRow
            label="Quality"
            value={
              <span className={`font-semibold ${roadQualityColour}`}>
                {roadHierarchy.road_quality_label}
              </span>
            }
            sub={roadHierarchy.quality_score != null
              ? `${Math.round(roadHierarchy.quality_score)}/100` : undefined}
          />
          {roadHierarchy.dominant_type && (
            <MetricRow label="Dominant Type" value={roadHierarchy.dominant_type} />
          )}
          {roadHierarchy.high_quality_count != null && (
            <MetricRow label="Major Roads" value={`${roadHierarchy.high_quality_count} found`} />
          )}
          {roadHierarchy.nearest_major_m != null && (
            <MetricRow
              label="Nearest Major"
              value={fmtDist(roadHierarchy.nearest_major_m)}
            />
          )}
        </MetricSection>
      )}

      {/* ── Nearest Distances ──────────────────────────────────────────────── */}
      {Object.keys(distanceMetrics).length > 0 && (
        <MetricSection icon={MapPin} title="Nearest Distances">
          {KEY_DISTANCES
            .filter(({ cat }) => distanceMetrics[cat]?.nearest_distance != null)
            .map(({ cat, label }) => (
              <MetricRow
                key={cat}
                label={label}
                value={fmtDist(distanceMetrics[cat].nearest_distance)}
                sub={distanceMetrics[cat].count != null
                  ? `${distanceMetrics[cat].count} total` : undefined}
              />
            ))
          }
        </MetricSection>
      )}

      {/* ── Density ───────────────────────────────────────────────────────── */}
      {Object.keys(densityMetrics).length > 0 && (
        <MetricSection icon={BarChart3} title="Feature Density">
          {KEY_DENSITIES
            .filter(({ cat }) => densityMetrics[cat] != null && densityMetrics[cat] > 0)
            .map(({ cat, label }) => (
              <MetricRow
                key={cat}
                label={label}
                value={fmtDensity(densityMetrics[cat])}
              />
            ))
          }
        </MetricSection>
      )}

      {/* ── Competition ───────────────────────────────────────────────────── */}
      {competitionMeta?.competitor_count != null && (
        <MetricSection icon={Users} title="Competition">
          <MetricRow
            label="Direct Competitors"
            value={
              <span className={
                competitionMeta.competitor_count > 5
                  ? 'text-red-400 font-semibold'
                  : competitionMeta.competitor_count > 0
                    ? 'text-amber-400 font-semibold'
                    : 'text-emerald-400 font-semibold'
              }>
                {competitionMeta.competitor_count}
              </span>
            }
          />
          {competitionMeta.weighted_competitor_count != null && (
            <MetricRow
              label="Proximity Pressure"
              value={Number(competitionMeta.weighted_competitor_count).toFixed(1)}
              sub="weighted"
            />
          )}
        </MetricSection>
      )}

      {/* ── Normalization footnote ─────────────────────────────────────────── */}
      <p className="text-[10px] text-white/20 text-center px-1 leading-relaxed">
        Scoring uses logarithmic normalization &amp; distance decay (Haversine).
        Phase 4 will add PostGIS precision.
      </p>

    </div>
  )
}
