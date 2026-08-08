import { Users, MapPin } from 'lucide-react'

export default function CompetitorAnalysisCard({ result }) {
  const compMeta = result?.competition_metrics || {}
  const competitors = compMeta.competitors || []

  if (compMeta.competitor_count == null) {
    return null
  }

  const levelColours = {
    Low: 'text-[#43B96B] bg-[#E7F7E9] border-[#43B96B]/30',
    Medium: 'text-amber-700 bg-[#FEF3C7] border-amber-300',
    High: 'text-red-700 bg-[#FEE2E2] border-red-200',
  }

  const compLevel = compMeta.competition_level || (
    compMeta.competitor_count > 8 ? 'High' : compMeta.competitor_count > 2 ? 'Medium' : 'Low'
  )

  const levelCls = levelColours[compLevel] || levelColours.Low

  return (
    <div className="rounded-2xl border border-[#DDE3EC] bg-white p-4 space-y-3 font-sans shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-amber-600" />
          <h3 className="text-xs font-mono font-extrabold text-[#08111F] uppercase tracking-wider">
            COMPETITOR ANALYSIS
          </h3>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${levelCls}`}>
          {compLevel} Competition
        </span>
      </div>

      {/* Summary Row */}
      <div className="bg-[#F6F8FC] border border-[#DDE3EC] p-3 rounded-xl flex items-center justify-between">
        <span className="text-xs text-[#5D6675] font-medium font-sans">Total Competitors</span>
        <span className="text-base font-extrabold text-[#08111F] font-mono">{compMeta.competitor_count ?? 0}</span>
      </div>

      {/* Competitors List */}
      {competitors.length > 0 && (
        <div className="pt-2 space-y-1.5 border-t border-[#DDE3EC]">
          <span className="text-[10px] font-mono font-bold text-[#8A94A3] uppercase tracking-wider block mb-1">
            NEARBY COMPETITOR SITES
          </span>
          <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
            {competitors.slice(0, 6).map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-[#F6F8FC] border border-[#DDE3EC]"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <span className="truncate text-[#08111F] font-medium text-[11px] font-sans">
                    {c.name}
                  </span>
                </div>
                <span className="text-[10px] text-[#5D6675] font-mono flex-shrink-0 ml-2">
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
