/** Results page — displays the Site Readiness Score and analysis breakdown. */

import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, TrendingUp, Info, Lightbulb } from 'lucide-react'
import useAnalysisStore from '@/store/analysisStore'
import Card from '@/components/ui/Card'
import Badge, { getTier } from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import { FACTOR_META, BUSINESS_TYPES } from '@/constants'

function ScoreGauge({ score }) {
  const tier = getTier(score)
  const circumference = 2 * Math.PI * 54
  const progress = (score / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke={tier.color}
            strokeWidth="10"
            strokeDasharray={`${progress} ${circumference}`}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 8px ${tier.color}80)`, transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black text-white">{score.toFixed(0)}</span>
          <span className="text-xs text-white/40">/ 100</span>
        </div>
      </div>
      <Badge score={score} />
      <p className="text-xs text-white/30 mt-2">Site Readiness Score</p>
    </div>
  )
}

function FactorBar({ label, score, icon, description }) {
  const tier = getTier(score)
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span>{icon}</span>
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold" style={{ color: tier.color }}>{score.toFixed(1)}</span>
        </div>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: tier.color, boxShadow: `0 0 8px ${tier.color}60` }}
        />
      </div>
      <p className="text-xs text-white/30">{description}</p>
    </div>
  )
}

export default function Results() {
  const { requestId } = useParams()
  const { currentRequest, fetchOne, isLoading } = useAnalysisStore()

  useEffect(() => {
    if (!currentRequest || currentRequest.id !== requestId) {
      fetchOne(requestId)
    }
  }, [requestId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Spinner size="lg" />
          <p className="text-white/40 text-sm">Loading analysis results...</p>
        </div>
      </div>
    )
  }

  if (!currentRequest) return null

  const result = currentRequest.result
  const bizType = BUSINESS_TYPES.find((b) => b.value === currentRequest.business_type)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/dashboard" className="btn-ghost py-2 px-3">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="section-title">Analysis Results</h1>
          <p className="text-white/40 text-sm mt-0.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            {parseFloat(currentRequest.latitude).toFixed(4)},{' '}
            {parseFloat(currentRequest.longitude).toFixed(4)} · {bizType?.icon} {bizType?.label}
          </p>
        </div>
      </div>

      {!result ? (
        <Card className="text-center py-12">
          <Spinner className="mx-auto mb-4" />
          <p className="text-white/40">Analysis is still processing...</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Score gauge */}
          <Card className="flex flex-col items-center justify-center gap-6 lg:col-span-1">
            <ScoreGauge score={parseFloat(result.site_readiness_score)} />
            <div className="w-full divider" />
            <div className="text-center">
              <p className="text-xs text-white/30 mb-1">Analysis Radius</p>
              <p className="text-sm font-semibold">{currentRequest.radius_m}m</p>
            </div>
          </Card>

          {/* Right: Factor breakdown */}
          <Card className="space-y-5 lg:col-span-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-400" />
              <h2 className="font-semibold">Factor Breakdown</h2>
            </div>
            {result.score_breakdown && Object.entries(result.score_breakdown).map(([key, score]) => {
              const meta = FACTOR_META[key]
              if (!meta) return null
              return (
                <FactorBar
                  key={key}
                  label={meta.label}
                  score={parseFloat(score)}
                  icon={meta.icon}
                  description={meta.description}
                />
              )
            })}
          </Card>

          {/* AI Insights */}
          {result.ai_insights?.length > 0 && (
            <Card className="lg:col-span-3 space-y-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <h2 className="font-semibold">AI Insights</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {result.ai_insights.map((insight, i) => (
                  <div key={i} className="bg-white/3 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-3.5 h-3.5 text-brand-400" />
                      <p className="text-sm font-medium">{insight.title}</p>
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed">{insight.description}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
