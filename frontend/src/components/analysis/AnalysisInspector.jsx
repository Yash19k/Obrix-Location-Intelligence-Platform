import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X, Check, Bookmark, ArrowLeftRight, TrendingUp, MapPin, Sparkles, Zap, FileText, Navigation, AlertCircle, CheckCircle2, AlertTriangle, Loader2
} from 'lucide-react'
import useMapStore from '@/store/mapStore'
import useLocationStore from '@/store/locationStore'
import useAiChatStore from '@/store/aiChatStore'
import useReportStore from '@/store/reportStore'
import useAnalysisStore from '@/store/analysisStore'
import { FACTOR_META, BUSINESS_TYPES } from '@/constants'
import ReportViewerModal from '../reports/ReportViewerModal'

function getTierBadge(scoreNum) {
  if (scoreNum >= 80) {
    return { label: 'Strong Opportunity', bg: 'bg-[#E7F7E9]', text: 'text-[#43B96B]', border: 'border-[#43B96B]/30' }
  } else if (scoreNum >= 60) {
    return { label: 'Promising', bg: 'bg-[#E9EFFF]', text: 'text-[#315CF5]', border: 'border-[#315CF5]/30' }
  } else if (scoreNum >= 40) {
    return { label: 'Moderate', bg: 'bg-[#FEF3C7]', text: 'text-amber-700', border: 'border-amber-300' }
  } else {
    return { label: 'Weak', bg: 'bg-[#FEE2E2]', text: 'text-red-700', border: 'border-red-200' }
  }
}

export default function AnalysisInspector() {
  const navigate = useNavigate()
  const {
    analysisResult, isAnalyzing, closePanel, selectedLat, selectedLon,
    businessType, radius, setIsAnalyzing, setAnalysisResult, setAnalysisError, setMapCenter
  } = useMapStore()

  const { saveLocation, isSaving, savedLocations } = useLocationStore()
  const { generateReport, isGenerating, activeReport, closeReportViewer } = useReportStore()
  const { submitAnalysis } = useAnalysisStore()

  const [savedSuccess, setSavedSuccess] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)
  const [toastType, setToastType] = useState('success')

  const hasLocation = selectedLat !== null && selectedLon !== null
  const result = analysisResult?.result ?? null
  const score = result?.site_readiness_score ? parseFloat(result.site_readiness_score) : null
  const breakdown = result?.score_breakdown ?? {}
  const rawFactors = result?.raw_factors ?? {}
  const bType = BUSINESS_TYPES.find((b) => b.value === (analysisResult?.business_type || businessType))

  // Handle Save Location
  const handleBookmark = async () => {
    if (!analysisResult) return
    const lat = parseFloat(analysisResult.latitude ?? selectedLat)
    const lon = parseFloat(analysisResult.longitude ?? selectedLon)

    if (isNaN(lat) || isNaN(lon)) {
      setToastType('error')
      setToastMessage('Invalid location coordinates')
      setTimeout(() => setToastMessage(null), 3000)
      return
    }

    const isAlreadySaved = savedLocations.some(
      (loc) =>
        parseFloat(loc.latitude).toFixed(4) === lat.toFixed(4) &&
        parseFloat(loc.longitude).toFixed(4) === lon.toFixed(4)
    )
    if (isAlreadySaved) {
      setToastType('error')
      setToastMessage('Location already saved!')
      setTimeout(() => setToastMessage(null), 3000)
      return
    }

    const bLabel = bType ? bType.label : 'Analysis Site'
    const name = `${bLabel} (${lat.toFixed(3)}, ${lon.toFixed(3)})`

    const res = await saveLocation({
      name,
      description: JSON.stringify({
        type: 'single',
        business_type: analysisResult.business_type || businessType,
        readiness_score: score ? score.toFixed(1) : '0',
        radius_m: radius,
      }),
      latitude: lat,
      longitude: lon,
      address: `${bLabel} near ${lat.toFixed(4)}, ${lon.toFixed(4)}`,
    })

    if (res.success) {
      setSavedSuccess(true)
      setToastType('success')
      setToastMessage('✓ Location saved successfully')
      setTimeout(() => setSavedSuccess(false), 3000)
      setTimeout(() => setToastMessage(null), 3500)
    } else {
      setToastType('error')
      setToastMessage(res.error || 'Failed to save location.')
      setTimeout(() => setToastMessage(null), 3500)
    }
  }

  // Handle Generate Report
  const handleGenerateReport = async () => {
    if (!analysisResult) return
    const res = await generateReport(analysisResult)
    if (res.success) {
      navigate('/reports')
    }
  }

  // Handle Ask Obrix Navigation with Context
  const handleAskObrixWithQuestion = (questionText) => {
    if (analysisResult) {
      useAiChatStore.getState().openChat('single_analysis', analysisResult)
    }
    navigate('/ask-obrix', { state: { prefillQuestion: questionText } })
  }

  // 1. Loading Skeleton State
  if (isAnalyzing) {
    return (
      <div className="flex flex-col h-full bg-white border-l border-[#DDE3EC] font-sans p-6 overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[#DDE3EC] mb-6">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-[#315CF5] animate-spin" />
            <span className="text-xs font-mono font-bold text-[#315CF5] uppercase">
              ANALYZING SITE
            </span>
          </div>
          <span className="text-xs font-mono text-[#8A94A3]">PLEASE WAIT</span>
        </div>

        <div className="space-y-6">
          <div className="bg-[#F6F8FC] border border-[#DDE3EC] rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-[#43B96B]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Location coordinates captured</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#43B96B]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Querying OpenStreetMap spatial features</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#315CF5] animate-pulse">
              <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
              <span>Evaluating site factors & readiness score...</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#8A94A3]">
              <span className="w-4 h-4 rounded-full border border-[#DDE3EC] inline-block shrink-0" />
              <span>Generating competitor & catchment analysis</span>
            </div>
          </div>

          <div className="h-28 bg-[#F6F8FC] rounded-2xl animate-pulse" />
          <div className="h-44 bg-[#F6F8FC] rounded-2xl animate-pulse" />
        </div>
      </div>
    )
  }

  // 2. Pre-Analysis / Unselected State
  if (!result) {
    return (
      <div className="flex flex-col h-full bg-white border-l border-[#DDE3EC] font-sans p-6 overflow-y-auto justify-between">
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#DDE3EC]">
            <span className="text-[11px] font-mono font-bold text-[#8A94A3] uppercase">
              SITE INSPECTOR
            </span>
            <span className="text-xs font-mono text-[#315CF5]">READY</span>
          </div>

          {hasLocation ? (
            <div className="bg-[#F6F8FC] border border-[#DDE3EC] rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#315CF5] uppercase">
                <MapPin className="w-4 h-4 text-[#315CF5]" /> LOCATION SELECTED
              </div>

              <div className="space-y-1">
                <div className="text-sm font-bold text-[#08111F] font-sans">
                  Candidate Location Pin
                </div>
                <div className="text-xs font-mono text-[#5D6675]">
                  LAT: {selectedLat.toFixed(5)}° N | LNG: {selectedLon.toFixed(5)}° E
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs font-sans text-[#5D6675] border-t border-[#DDE3EC]">
                <span>Category: <strong className="text-[#08111F]">{bType?.label}</strong></span>
                <span className="font-mono text-[#315CF5] font-bold">{radius}m Radius</span>
              </div>
            </div>
          ) : (
            <div className="bg-[#F6F8FC] border border-[#DDE3EC] rounded-2xl p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#DDE3EC] flex items-center justify-center mx-auto text-[#315CF5] shadow-2xs">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-[#08111F]">Select a location</h3>
              <p className="text-xs text-[#5D6675] leading-relaxed">
                Click anywhere on the interactive map or search for an address to drop a candidate site marker.
              </p>
            </div>
          )}
        </div>

        {hasLocation && (
          <button
            id="inspector-analyze-btn"
            onClick={async () => {
              setIsAnalyzing(true)
              setMapCenter([selectedLat, selectedLon], 16)
              const res = await submitAnalysis({
                latitude: selectedLat,
                longitude: selectedLon,
                radius_m: radius,
                business_type: businessType,
              })
              if (res.success) {
                setAnalysisResult(res.data)
              } else {
                setAnalysisError(res.error)
              }
            }}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#315CF5] hover:bg-[#2448D8] text-white text-sm font-bold py-3.5 rounded-xl transition-all shadow-md cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Analyze Selected Location</span>
          </button>
        )}
      </div>
    )
  }

  // 3. Active Result Inspector State
  const tier = score !== null ? getTierBadge(score) : { label: 'Complete', bg: 'bg-[#E9EFFF]', text: 'text-[#315CF5]', border: 'border-[#315CF5]/30' }
  const totalCompetitors = result.raw_factors?._meta?.competition_metrics?.total_competitors ?? result.feature_counts?.competitors ?? null

  return (
    <div className="flex flex-col h-full bg-white border-l border-[#DDE3EC] font-sans relative overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`absolute top-3 left-4 right-4 z-50 p-3 rounded-xl text-xs font-bold text-white shadow-xl flex items-center gap-2 ${
          toastType === 'error' ? 'bg-red-600' : 'bg-[#43B96B]'
        }`}>
          <Check className="w-4 h-4" /> {toastMessage}
        </div>
      )}

      {/* Header Bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#DDE3EC] bg-[#F6F8FC] shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-mono font-extrabold text-[#315CF5] uppercase">
            SITE INTELLIGENCE
          </span>
          <span className="text-xs font-mono text-[#8A94A3]">·</span>
          <span className="text-xs font-mono text-[#8A94A3]">RADIUS / {analysisResult.radius_m || radius}M</span>
        </div>

        <button
          onClick={closePanel}
          className="p-1.5 rounded-lg text-[#8A94A3] hover:text-[#08111F] hover:bg-[#E2E8F0] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">

        {/* Primary Score Banner */}
        <div className="bg-[#F6F8FC] border border-[#DDE3EC] rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#08111F]">
              {bType ? bType.label : 'Commercial'} Site
            </span>
            <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${tier.bg} ${tier.text} ${tier.border}`}>
              {tier.label}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-extrabold font-mono text-[#08111F]">
              {Math.round(score)}
            </span>
            <span className="text-sm font-mono text-[#8A94A3]">/ 100</span>
            <span className="ml-auto text-xs font-mono text-[#5D6675]">
              {parseFloat(analysisResult.latitude).toFixed(4)}° N, {parseFloat(analysisResult.longitude).toFixed(4)}° E
            </span>
          </div>
        </div>

        {/* Factor Breakdown Bars */}
        {Object.keys(breakdown).length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-extrabold text-[#08111F] uppercase tracking-wider">
                SITE FACTORS
              </h3>
              <span className="text-[10px] font-mono text-[#8A94A3]">0–100 SCALE</span>
            </div>

            <div className="space-y-3 bg-[#F6F8FC] border border-[#DDE3EC] rounded-2xl p-4">
              {Object.entries(breakdown).map(([key, val]) => {
                const meta = FACTOR_META[key] ?? { label: key }
                const scoreVal = Math.round(val)
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-[#5D6675] font-sans">{meta.label}</span>
                      <span className="font-mono font-bold text-[#08111F]">{scoreVal} / 100</span>
                    </div>
                    <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          scoreVal >= 80 ? 'bg-[#43B96B]' : scoreVal >= 60 ? 'bg-[#315CF5]' : 'bg-[#D97706]'
                        }`}
                        style={{ width: `${scoreVal}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Factual Competitor Count Metric (If available) */}
        {totalCompetitors !== null && (
          <div className="bg-white border border-[#DDE3EC] rounded-2xl p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-mono font-semibold text-[#8A94A3] uppercase block">
                COMPETITION COUNT
              </span>
              <span className="text-sm font-bold text-[#08111F]">
                Total Competitors in Buffer
              </span>
            </div>
            <span className="text-2xl font-extrabold font-mono text-[#08111F] bg-[#F6F8FC] border border-[#DDE3EC] px-3 py-1 rounded-xl">
              {totalCompetitors}
            </span>
          </div>
        )}

        {/* Strengths & Risks */}
        {((result?.top_positive && result.top_positive.length > 0) ||
          (result?.top_negative && result.top_negative.length > 0)) && (
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-extrabold text-[#08111F] uppercase tracking-wider">
              ANALYSIS SIGNALS
            </h3>

            <div className="space-y-3">
              {/* Positive Strengths */}
              {result?.top_positive && result.top_positive.length > 0 && (
                <div className="bg-[#E7F7E9] border border-[#43B96B]/30 rounded-2xl p-4 space-y-2">
                  <span className="text-xs font-bold text-[#43B96B] flex items-center gap-1.5 font-mono uppercase">
                    <CheckCircle2 className="w-4 h-4" /> STRENGTHS
                  </span>
                  <ul className="space-y-1.5 text-xs text-[#08111F]">
                    {result.top_positive.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-[#43B96B] font-bold">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Negative Risks */}
              {result?.top_negative && result.top_negative.length > 0 && (
                <div className="bg-[#FEF3C7] border border-amber-300 rounded-2xl p-4 space-y-2">
                  <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5 font-mono uppercase">
                    <AlertTriangle className="w-4 h-4" /> RISKS & CHALLENGES
                  </span>
                  <ul className="space-y-1.5 text-xs text-[#08111F]">
                    {result.top_negative.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-amber-700 font-bold">!</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons Row (Save, Compare, Report) */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#DDE3EC]">
          <button
            onClick={handleBookmark}
            disabled={isSaving}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              savedSuccess
                ? 'bg-[#E7F7E9] text-[#43B96B] border-[#43B96B]/30'
                : 'bg-white text-[#08111F] border-[#DDE3EC] hover:bg-[#F6F8FC]'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-[#315CF5]" />
            <span>{savedSuccess ? 'Saved' : 'Save'}</span>
          </button>

          <button
            onClick={() => {
              if (analysisResult) {
                useMapStore.getState().setLocationA(analysisResult)
                useMapStore.getState().setCompareStep('select_b')
                useMapStore.setState({ compareMode: true, showPanel: false })
              }
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#E9EFFF] text-[#315CF5] border border-[#315CF5]/20 hover:bg-[#315CF5] hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Compare</span>
          </button>

          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#F6F8FC] text-[#08111F] border border-[#DDE3EC] hover:bg-[#E2E8F0] transition-all cursor-pointer"
          >
            {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5 text-[#315CF5]" />}
            <span>Report</span>
          </button>
        </div>

        {/* ASK OBRIX Contextual Module */}
        <div className="bg-[#08111F] bg-gis-dark-grid border border-[#315CF5]/30 rounded-2xl p-5 text-white space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#315CF5]" />
              <h3 className="text-xs font-bold text-white uppercase font-mono">ASK OBRIX ASSISTANT</h3>
            </div>
            <span className="text-[10px] font-mono text-[#315CF5] bg-[#315CF5]/10 px-2 py-0.5 rounded font-bold">
              AI CONSULTANT
            </span>
          </div>

          <p className="text-xs text-[#8A94A3] leading-relaxed">
            Want to understand this result? Discuss the site's strengths, risks, competition and opportunities with your AI location consultant.
          </p>

          {/* Dynamic Suggested Questions */}
          <div className="space-y-1.5 pt-1">
            <button
              onClick={() => handleAskObrixWithQuestion(`Why did this location score ${Math.round(score)}?`)}
              className="w-full text-left text-xs text-white/90 bg-white/5 hover:bg-[#315CF5] p-2 rounded-lg border border-white/10 transition-colors cursor-pointer font-sans"
            >
              Why did this location score {Math.round(score)}?
            </button>
            <button
              onClick={() => handleAskObrixWithQuestion('What is the biggest risk for this site?')}
              className="w-full text-left text-xs text-white/90 bg-white/5 hover:bg-[#315CF5] p-2 rounded-lg border border-white/10 transition-colors cursor-pointer font-sans"
            >
              What is the biggest risk for this site?
            </button>
            <button
              onClick={() => handleAskObrixWithQuestion('How does competition affect this score?')}
              className="w-full text-left text-xs text-white/90 bg-white/5 hover:bg-[#315CF5] p-2 rounded-lg border border-white/10 transition-colors cursor-pointer font-sans"
            >
              How does competition affect this score?
            </button>
          </div>

          <button
            onClick={() => handleAskObrixWithQuestion(`Explain the analysis for score ${Math.round(score)}`)}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#315CF5] hover:bg-[#2448D8] text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md mt-2"
          >
            <Sparkles className="w-4 h-4" /> Ask Obrix →
          </button>
        </div>
      </div>

      {/* Report Viewer Modal if active */}
      {activeReport && (
        <ReportViewerModal
          isOpen={!!activeReport}
          onClose={closeReportViewer}
          report={activeReport}
        />
      )}
    </div>
  )
}
