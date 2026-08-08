import { useEffect, useState } from 'react'

function getFactorColor(value) {
  if (value >= 75) return '#43B96B'
  if (value >= 50) return '#315CF5'
  if (value >= 35) return '#D97706'
  return '#EF4444'
}

export default function FactorBar({
  label,
  icon,
  value = 0,
  factorKey,
  explanation = '',
  delay = 0,
}) {
  const [width, setWidth] = useState(0)
  const color = getFactorColor(value)

  useEffect(() => {
    const t = setTimeout(() => setWidth(Math.min(100, Math.max(0, value))), delay)
    return () => clearTimeout(t)
  }, [value, delay])

  const tier = value >= 75 ? 'High' : value >= 50 ? 'Medium' : 'Low'

  return (
    <div className="space-y-1.5 font-sans">
      {/* Label & Score row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm leading-none">{icon}</span>
          <span className="text-xs font-bold text-[#08111F] font-sans">{label}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-mono text-[#5D6675]">{tier}</span>
          <span className="text-xs font-mono font-extrabold text-[#08111F]">
            {Math.round(value)} / 100
          </span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="h-2 rounded-full bg-[#EEF1F5] overflow-hidden">
        {/* Fill */}
        <div
          className="h-full rounded-full"
          style={{
            width: `${width}%`,
            backgroundColor: color,
            transition: `width 0.8s cubic-bezier(0.4,0,0.2,1) ${delay}ms`,
          }}
        />
      </div>

      {/* Strengths / Risks explanation */}
      {explanation && (
        <p className="text-[11px] text-[#5D6675] leading-relaxed font-sans font-normal">
          {explanation}
        </p>
      )}
    </div>
  )
}
