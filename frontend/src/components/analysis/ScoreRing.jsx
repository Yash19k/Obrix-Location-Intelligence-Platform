import { useEffect, useState } from 'react'

const TIERS = [
  { min: 80, label: 'Excellent', color: '#43B96B' },
  { min: 60, label: 'Good',      color: '#315CF5' },
  { min: 40, label: 'Fair',      color: '#D97706' },
  { min: 0,  label: 'Poor',      color: '#EF4444' },
]

function getTier(score) {
  return TIERS.find((t) => score >= t.min) ?? TIERS[TIERS.length - 1]
}

export default function ScoreRing({ score = 0, size = 140 }) {
  const [animScore, setAnimScore] = useState(0)
  const tier = getTier(score)

  const radius = (size - 20) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDash = (animScore / 100) * circumference

  useEffect(() => {
    setAnimScore(0)
    const timer = setTimeout(() => setAnimScore(score), 50)
    return () => clearTimeout(timer)
  }, [score])

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#EEF1F5"
            strokeWidth={10}
          />

          {/* Score arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={tier.color}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - strokeDash}
            style={{ transition: 'stroke-dashoffset 1.0s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>

        {/* Center number */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center font-mono"
          style={{ transform: 'none' }}
        >
          <span
            className="text-4xl font-extrabold tabular-nums tracking-tight"
            style={{ color: tier.color }}
          >
            {Math.round(animScore)}
          </span>
          <span className="text-[11px] text-[#8A94A3] font-bold tracking-wider uppercase mt-0.5">
            / 100
          </span>
        </div>
      </div>

      {/* Tier Label Badge */}
      <span
        className="px-3 py-1 rounded-full text-xs font-bold font-sans uppercase tracking-wider"
        style={{
          backgroundColor: `${tier.color}15`,
          color: tier.color,
          border: `1px solid ${tier.color}30`,
        }}
      >
        {tier.label}
      </span>
    </div>
  )
}
