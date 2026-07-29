import { Users, MapPin, Compass, AlertCircle } from 'lucide-react'

export default function CompetitorAnalysisCard({ result }) {
  const compMeta = result?.competition_metrics || {}
  const competitors = compMeta.competitors || []

  if (compMeta.competitor_count == null && competitors.length === 0) {
    return null
  }

  const levelColours = {
    Low: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    Medium: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    High: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
  }

  const compLevel = compMeta.competition_level || (
    compMeta.competitor_count > 8 ? 'High' : compMeta.competitor_count > 2 ? 'Medium' : 'Low'
  )

  const levelCls = levelColours[compLevel] || levelColours.Low

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-semibold text-white/90 uppercase tracking-wider">
            Competitor Analysis
          </h3>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${levelCls}`}>
          {compLevel} Competition
        </span>
      </div>

      {/* Grid Summary */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-900/60 border border-white/[0.05] p-2.5 rounded-lg">
          <span className="text-[10px] text-slate-400 block">Total Competitors</span>
          <span className="text-base font-bold text-slate-100">{compMeta.competitor_count ?? 0}</span>
        </div>

        <div className="bg-slate-900/60 border border-white/[0.05] p-2.5 rounded-lg">
          <span className="text-[10px] text-slate-400 block">Competition Density</span>
          <span className="text-base font-bold text-slate-100">
            {compMeta.competition_density != null ? `${compMeta.competition_density}/km²` : '—'}
          </span>
        </div>

        <div className="bg-slate-900/60 border border-white/[0.05] p-2.5 rounded-lg">
          <span className="text-[10px] text-slate-400 block">Nearest Competitor</span>
          <span className="text-sm font-semibold text-slate-200">
            {compMeta.nearest_distance_m != null
              ? compMeta.nearest_distance_m < 1000
                ? `${Math.round(compMeta.nearest_distance_m)}m`
                : `${(compMeta.nearest_distance_m / 1000).toFixed(1)}km`
              : '—'}
          </span>
        </div>

        <div className="bg-slate-900/60 border border-white/[0.05] p-2.5 rounded-lg">
          <span className="text-[10px] text-slate-400 block">Avg Distance</span>
          <span className="text-sm font-semibold text-slate-200">
            {compMeta.avg_distance_m != null
              ? compMeta.avg_distance_m < 1000
                ? `${Math.round(compMeta.avg_distance_m)}m`
                : `${(compMeta.avg_distance_m / 1000).toFixed(1)}km`
              : '—'}
          </span>
        </div>
      </div>

      {/* Competitors List */}
      {competitors.length > 0 && (
        <div className="pt-2 space-y-1.5 border-t border-white/[0.05]">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Nearby Competitor Sites
          </span>
          <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
            {competitors.slice(0, 6).map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs py-1 px-2 rounded bg-white/[0.02] border border-white/[0.03]"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin className="w-3 h-3 text-amber-400 flex-shrink-0" />
                  <span className="truncate text-slate-200 font-medium text-[11px]">
                    {c.name}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono flex-shrink-0 ml-2">
                  {c.distance_m != null ? `${Math.round(c.distance_m)}m` : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
