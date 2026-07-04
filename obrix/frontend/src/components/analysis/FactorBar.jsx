/**
 * FactorBar — animated horizontal progress bar for a single analysis factor.
 */

import { useEffect, useState } from 'react'

const COLOR_MAP = {
  accessibility:  { color: '#818cf8', bg: 'rgba(129,140,248,0.15)' },
  population:     { color: '#34d399', bg: 'rgba(52,211,153,0.15)'  },
  competition:    { color: '#f472b6', bg: 'rgba(244,114,182,0.15)' },
  infrastructure: { color: '#60a5fa', bg: 'rgba(96,165,250,0.15)'  },
  land_use:       { color: '#fbbf24', bg: 'rgba(251,191,36,0.15)'  },
}

function getColor(key) {
  return COLOR_MAP[key] ?? { color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' }
}

export default function FactorBar({ label, icon, value = 0, factorKey, delay = 0 }) {
  const [width, setWidth] = useState(0)
  const { color, bg } = getColor(factorKey)

  useEffect(() => {
    const t = setTimeout(() => setWidth(Math.min(100, Math.max(0, value))), delay)
    return () => clearTimeout(t)
  }, [value, delay])

  const tier = value >= 75 ? 'High' : value >= 50 ? 'Medium' : 'Low'

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">{icon}</span>
          <span className="text-xs font-medium text-white/70">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/30">{tier}</span>
          <span className="text-xs font-semibold tabular-nums" style={{ color }}>
            {Math.round(value)}
          </span>
        </div>
      </div>

      {/* Track */}
      <div className="h-1.5 rounded-full" style={{ background: bg }}>
        {/* Fill */}
        <div
          className="h-full rounded-full"
          style={{
            width: `${width}%`,
            background: `linear-gradient(90deg, ${color}80, ${color})`,
            boxShadow: `0 0 8px ${color}60`,
            transition: `width 1s cubic-bezier(0.4,0,0.2,1) ${delay}ms`,
          }}
        />
      </div>
    </div>
  )
}
