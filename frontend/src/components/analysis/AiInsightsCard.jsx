import { useState, useEffect, useRef } from 'react'
import { Sparkles, Bot, FileText, Loader2, ArrowRight, ShieldCheck, TrendingUp, AlertTriangle } from 'lucide-react'
import useReportStore from '@/store/reportStore'
import AiReportLoadingModal from '../reports/AiReportLoadingModal'

export default function AiInsightsCard({ analysisResult }) {
  const { generateReport, isGenerating } = useReportStore()
  const [showLoadingModal, setShowLoadingModal] = useState(false)
  const [progress, setProgress] = useState(10)
  const [stepMessage, setStepMessage] = useState('Preparing analysis data...')
  const [modalError, setModalError] = useState(null)
  const [toastMsg, setToastMsg] = useState(null)

  const progressInterval = useRef(null)

  useEffect(() => {
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current)
    }
  }, [])

  if (!analysisResult) return null

  const result = analysisResult.result || analysisResult
  const score = float(result.site_readiness_score ?? 65)
  const breakdown = result.score_breakdown || {}
  const counts = result.feature_counts || {}
  const rawFactors = result.raw_factors || {}
  const meta = rawFactors._meta || {}
  const compMeta = meta.competition_metrics || {}
  const bizType = (analysisResult.business_type || 'retail').toUpperCase()

  function float(val) {
    const n = Number(val)
    return isNaN(n) ? 65 : n
  }

  const triggerGenerateReport = async () => {
    console.log('[AI Report] Button clicked. Starting generation flow...')
    setModalError(null)
    setShowLoadingModal(true)
    setProgress(10)
    setStepMessage('Preparing analysis data...')

    // Start progress simulation
    const startTime = Date.now()
    if (progressInterval.current) clearInterval(progressInterval.current)
    
    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      if (elapsed < 1000) {
        setProgress(10)
        setStepMessage('Preparing analysis data...')
      } else if (elapsed < 2000) {
        setProgress(25)
        setStepMessage('Building AI consulting prompt...')
      } else if (elapsed < 4000) {
        setProgress(45)
        setStepMessage('Sending request to Gemini...')
      } else if (elapsed < 7000) {
        setProgress(70)
        setStepMessage('Generating professional report...')
      } else if (elapsed < 10000) {
        setProgress(90)
        setStepMessage('Formatting report...')
      } else {
        // Cap at 95% until complete
        setProgress(95)
        setStepMessage('Finalizing consulting insights...')
      }
    }, 500)

    console.log('[AI Report] API started. Sending payload:', { analysis_data: analysisResult })
    const res = await generateReport(analysisResult)

    if (progressInterval.current) clearInterval(progressInterval.current)

    if (res.success) {
      console.log('[AI Report] API completed successfully. Response received:', res.data)
      setProgress(100)
      setStepMessage('Opening Report...')
      setToastMsg('AI Report Generated Successfully')
      
      setTimeout(() => {
        setToastMsg(null)
      }, 3000)

      // Auto close loading modal and open report viewer
      setTimeout(() => {
        setShowLoadingModal(false)
      }, 800)
    } else {
      console.error('[AI Report] Generation failed. Error response:', res.error)
      setModalError(res.error || 'Failed to generate AI report.')
    }
  }

  const handleCancel = () => {
    setShowLoadingModal(false)
    setModalError(null)
    if (progressInterval.current) clearInterval(progressInterval.current)
  }

  const compCount = compMeta.competitor_count ?? 0
  const compLevel = compMeta.competition_level || 'Low'

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900/80 to-purple-950/40 border border-indigo-500/30 shadow-xl space-y-4 relative overflow-hidden">
      
      {/* Toast Feedback */}
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[7000] px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4" /> {toastMsg}
        </div>
      )}

      {/* Background glow accent */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100">AI Location Insights</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Powered by Gemini
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Intelligent spatial feasibility & risk interpretation</p>
          </div>
        </div>
      </div>

      {/* Structured Insights Content */}
      <div className="space-y-3 text-xs text-slate-300">

        {/* Executive Summary */}
        <div className="p-3 rounded-xl bg-slate-800/50 border border-white/5 space-y-1">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Executive Summary</span>
          <p className="leading-relaxed text-slate-200">
            Evaluating target site for <strong className="text-white">{bizType}</strong>. The area exhibits a Site Readiness Score of <strong className="text-emerald-400">{score.toFixed(1)}/100</strong>, supported by <strong className="text-indigo-300">{counts.roads ?? 0} road segments</strong> and <strong className="text-indigo-300">{compLevel.toLowerCase()} competitor density</strong> ({compCount} direct outlets nearby).
          </p>
        </div>

        {/* SWOT Snapshot */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 space-y-1">
            <div className="font-bold text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Key Strengths
            </div>
            <ul className="space-y-0.5 text-slate-300 list-disc list-inside text-[10px]">
              <li>Accessibility score: {breakdown.accessibility?.toFixed(1) ?? 60}/100</li>
              <li>{compCount <= 2 ? 'Low competition pressure' : 'Established commercial footfall'}</li>
            </ul>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/20 space-y-1">
            <div className="font-bold text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Risk Factors
            </div>
            <ul className="space-y-0.5 text-slate-300 list-disc list-inside text-[10px]">
              <li>Environmental park index ({breakdown.environment?.toFixed(1) ?? 40}/100)</li>
              <li>Peak rush-hour traffic slowdowns</li>
            </ul>
          </div>
        </div>
      </div>

      {/* CTA Button — Generate Full AI Report */}
      <button
        onClick={triggerGenerateReport}
        disabled={isGenerating}
        className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 shadow-lg shadow-indigo-600/30 transition-all duration-200 disabled:opacity-50"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Generating AI Report...
          </>
        ) : (
          <>
            <FileText className="w-4 h-4" /> Generate Full AI Consulting Report <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {/* AI Consulting Progress Loading / Error Modal */}
      <AiReportLoadingModal
        isOpen={showLoadingModal}
        error={modalError}
        progress={progress}
        stepMessage={stepMessage}
        onRetry={triggerGenerateReport}
        onCancel={handleCancel}
      />
    </div>
  )
}
