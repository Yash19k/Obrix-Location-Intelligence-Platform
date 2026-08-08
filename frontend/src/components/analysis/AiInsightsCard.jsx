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
    setModalError(null)
    setShowLoadingModal(true)
    setProgress(10)
    setStepMessage('Preparing analysis data...')

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
        setStepMessage('Sending request to Grok...')
      } else if (elapsed < 7000) {
        setProgress(70)
        setStepMessage('Generating professional report...')
      } else if (elapsed < 10000) {
        setProgress(90)
        setStepMessage('Formatting report...')
      } else {
        setProgress(95)
        setStepMessage('Finalizing consulting insights...')
      }
    }, 500)

    const res = await generateReport(analysisResult)
    if (progressInterval.current) clearInterval(progressInterval.current)

    if (res.success) {
      setProgress(100)
      setStepMessage('Opening Report...')
      setToastMsg('AI Report Generated Successfully')
      setTimeout(() => setToastMsg(null), 3000)
      setTimeout(() => setShowLoadingModal(false), 800)
    } else {
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
    <div className="p-5 rounded-2xl bg-white border border-[#DDE3EC] shadow-2xs space-y-4 font-sans relative overflow-hidden">

      {/* Toast Feedback */}
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[7000] px-4 py-2 bg-[#315CF5] text-white text-xs font-bold rounded-full shadow-xl flex items-center gap-2 animate-bounce font-sans">
          <Sparkles className="w-4 h-4" /> {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#E9EFFF] text-[#315CF5] border border-[#315CF5]/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-[#08111F] font-sans">AI Location Insights</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#E9EFFF] text-[#315CF5] border border-[#315CF5]/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#315CF5]" /> Powered by Grok
              </span>
            </div>
            <p className="text-[11px] text-[#5D6675]">Intelligent spatial feasibility & risk interpretation</p>
          </div>
        </div>
      </div>

      {/* Structured Insights Content */}
      <div className="space-y-3 text-xs text-[#08111F]">

        {/* Executive Summary */}
        <div className="p-3.5 rounded-xl bg-[#F6F8FC] border border-[#DDE3EC] space-y-1">
          <span className="text-[10px] font-mono font-bold text-[#315CF5] uppercase tracking-wider block">EXECUTIVE SUMMARY</span>
          <p className="leading-relaxed text-[#08111F] font-sans text-xs">
            Evaluating target site for <strong className="text-[#08111F]">{bizType}</strong>. The area exhibits a Site Readiness Score of <strong className="text-[#43B96B] font-mono">{score.toFixed(1)}/100</strong>, supported by <strong className="text-[#315CF5] font-mono">{counts.roads ?? 0} road segments</strong> and <strong className="text-[#315CF5]">{compLevel.toLowerCase()} competitor density</strong> ({compCount} direct outlets nearby).
          </p>
        </div>

        {/* SWOT Snapshot */}
        <div className="grid grid-cols-2 gap-2.5 text-xs font-sans">
          <div className="p-3 rounded-xl bg-[#E7F7E9] border border-[#43B96B]/30 space-y-1">
            <div className="font-bold text-[#43B96B] flex items-center gap-1 text-xs">
              <TrendingUp className="w-3.5 h-3.5" /> Key Strengths
            </div>
            <ul className="space-y-1 text-[#08111F] text-[11px]">
              <li className="flex items-start gap-1.5"><span className="text-[#43B96B] font-bold">•</span> Accessibility: {breakdown.accessibility?.toFixed(1) ?? 60}/100</li>
              <li className="flex items-start gap-1.5"><span className="text-[#43B96B] font-bold">•</span> {compCount <= 2 ? 'Low competition pressure' : 'Established commercial footfall'}</li>
            </ul>
          </div>

          <div className="p-3 rounded-xl bg-[#FEF3C7] border border-amber-300 space-y-1">
            <div className="font-bold text-amber-800 flex items-center gap-1 text-xs">
              <AlertTriangle className="w-3.5 h-3.5" /> Risk Factors
            </div>
            <ul className="space-y-1 text-[#08111F] text-[11px]">
              <li className="flex items-start gap-1.5"><span className="text-amber-700 font-bold">•</span> Environmental index ({breakdown.environment?.toFixed(1) ?? 40}/100)</li>
              <li className="flex items-start gap-1.5"><span className="text-amber-700 font-bold">•</span> Traffic slowdown risks</li>
            </ul>
          </div>
        </div>
      </div>

      {/* CTA Button — Generate Full AI Report */}
      <button
        onClick={triggerGenerateReport}
        disabled={isGenerating}
        className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-xs font-extrabold text-white bg-[#315CF5] hover:bg-[#2448D8] shadow-md transition-all duration-200 disabled:opacity-50 cursor-pointer"
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
