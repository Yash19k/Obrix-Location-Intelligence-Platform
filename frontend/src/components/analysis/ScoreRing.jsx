/**
 * ScoreRing — animated SVG circular progress ring for the site readiness score.
 *
 * Score tiers:
 *  80–100 → Excellent (emerald)
 *  60–79  → Good      (blue)
 *  40–59  → Fair      (amber)
 *  0–39   → Poor      (red)
 */

import { useEffect, useState } from 'react'

const TIERS = [
  { min: 80, label: 'Excellent', color: '#34d399', glow: 'rgba(52,211,153,0.35)' },
  { min: 60, label: 'Good',      color: '#60a5fa', glow: 'rgba(96,165,250,0.35)' },
  { min: 40, label: 'Fair',      color: '#fbbf24', glow: 'rgba(251,191,36,0.35)'  },
  { min: 0,  label: 'Poor',      color: '#f87171', glow: 'rgba(248,113,113,0.35)' },
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

  // Animate from 0 to score on mount
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
          {/* Glow filter */}
          <defs>
            <filter id="score-glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
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
            filter="url(#score-glow)"
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>

        {/* Center number */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ transform: 'none' }}
        >
          <span
            className="text-4xl font-bold tabular-nums"
            style={{ color: tier.color, textShadow: `0 0 20px ${tier.glow}` }}
          >
            {Math.round(animScore)}
          </span>
          <span className="text-xs text-white/40 font-medium tracking-wider uppercase mt-0.5">
            / 100
          </span>
        </div>
      </div>

      {/* Tier badge */}
      <div
        className="px-3.5 py-1 rounded-full text-xs font-semibold border"
        style={{
          color: tier.color,
          background: `${tier.glow}`,
          borderColor: `${tier.color}40`,
        }}
      >
        {tier.label}
      </div>
    </div>
  )
}
