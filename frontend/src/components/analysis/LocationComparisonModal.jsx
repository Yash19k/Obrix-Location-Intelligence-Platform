import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, ArrowLeftRight, Check, Award, Sparkles, Download, Bookmark } from 'lucide-react'
import useLocationStore from '@/store/locationStore'
import useAiChatStore from '@/store/aiChatStore'

export default function LocationComparisonModal({ isOpen, onClose, primaryResult, secondaryResult }) {
  const navigate = useNavigate()
  const { saveLocation } = useLocationStore()
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [toastMsg, setToastMsg] = useState(null)

  if (!isOpen || !primaryResult || !secondaryResult) return null

  const pRes = primaryResult.result || primaryResult
  const sRes = secondaryResult.result || secondaryResult

  const pScoreNum = Number(pRes.site_readiness_score ?? pRes.overall ?? 0) || 0
  const sScoreNum = Number(sRes.site_readiness_score ?? sRes.overall ?? 0) || 0

  const pCounts = pRes.feature_counts || {}
  const sCounts = sRes.feature_counts || {}

  const pComp = pRes.raw_factors?._meta?.competition_metrics || pRes.competition_metrics || {}
  const sComp = sRes.raw_factors?._meta?.competition_metrics || sRes.competition_metrics || {}

  const pRoad = pRes.raw_factors?._meta?.road_hierarchy || pRes.road_hierarchy || {}
  const sRoad = sRes.raw_factors?._meta?.road_hierarchy || sRes.road_hierarchy || {}

  const pOsm = pRes.osm_query_meta || {}
  const sOsm = sRes.osm_query_meta || {}

  const metrics = [
    {
      label: 'Site Readiness Score',
      pVal: `${pScoreNum.toFixed(1)}/100`,
      sVal: `${sScoreNum.toFixed(1)}/100`,
      winner: pScoreNum > sScoreNum ? 'primary' : pScoreNum < sScoreNum ? 'secondary' : 'tie',
    },
    {
      label: 'Road Accessibility',
      pVal: pRoad.road_quality_label || (pCounts.roads ? `${pCounts.roads} roads` : 'Good'),
      sVal: sRoad.road_quality_label || (sCounts.roads ? `${sCounts.roads} roads` : 'Fair'),
      winner: (pCounts.roads || 0) >= (sCounts.roads || 0) ? 'primary' : 'secondary',
    },
    {
      label: 'Hospitals Count',
      pVal: pCounts.hospitals ?? 0,
      sVal: sCounts.hospitals ?? 0,
      winner: (pCounts.hospitals || 0) > (sCounts.hospitals || 0) ? 'primary' : (pCounts.hospitals || 0) < (sCounts.hospitals || 0) ? 'secondary' : 'tie',
    },
    {
      label: 'Schools Count',
      pVal: pCounts.schools ?? 0,
      sVal: sCounts.schools ?? 0,
      winner: (pCounts.schools || 0) > (sCounts.schools || 0) ? 'primary' : (pCounts.schools || 0) < (sCounts.schools || 0) ? 'secondary' : 'tie',
    },
    {
      label: 'Restaurants Count',
      pVal: pCounts.restaurants ?? 0,
      sVal: sCounts.restaurants ?? 0,
      winner: (pCounts.restaurants || 0) > (sCounts.restaurants || 0) ? 'primary' : (pCounts.restaurants || 0) < (sCounts.restaurants || 0) ? 'secondary' : 'tie',
    },
    {
      label: 'Competitor Count',
      pVal: pComp.competitor_count ?? 0,
      sVal: sComp.competitor_count ?? 0,
      winner: (pComp.competitor_count || 0) <= (sComp.competitor_count || 0) ? 'primary' : 'secondary',
    },
  ]

  const isPrimaryRecommended = pScoreNum >= sScoreNum
  const recommendedLoc = isPrimaryRecommended ? 'Location A' : 'Location B'
  const recScore = isPrimaryRecommended ? pScoreNum.toFixed(1) : sScoreNum.toFixed(1)
  const otherScore = isPrimaryRecommended ? sScoreNum.toFixed(1) : pScoreNum.toFixed(1)

  const handleSaveComparison = async () => {
    const latA = parseFloat(primaryResult.latitude || 23.0225).toFixed(3)
    const lonA = parseFloat(primaryResult.longitude || 72.5714).toFixed(3)
    const latB = parseFloat(secondaryResult.latitude || 23.0300).toFixed(3)
    const lonB = parseFloat(secondaryResult.longitude || 72.5800).toFixed(3)

    const payloadMeta = JSON.stringify({
      type: 'comparison',
      recommendedLoc,
      recScore,
      primaryResult,
      secondaryResult,
    })

    const res = await saveLocation({
      name: `Compared Sites (${latA}, ${lonA} vs ${latB}, ${lonB})`,
      description: payloadMeta,
      latitude: parseFloat(primaryResult.latitude || 23.0225),
      longitude: parseFloat(primaryResult.longitude || 72.5714),
      address: `Comparison Winner: ${recommendedLoc} (${recScore}/100)`,
    })

    if (res.success) {
      setSavedSuccess(true)
      setToastMsg('✓ Comparison saved successfully!')
      setTimeout(() => setSavedSuccess(false), 3000)
      setTimeout(() => setToastMsg(null), 3500)
    }
  }

  const handleAskObrixComparison = () => {
    useAiChatStore.getState().openChat('comparison', { primaryResult, secondaryResult })
    navigate('/ask-obrix')
  }

  const handleExport = () => {
    const reportHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Obrix Location Comparison Report</title>
        <style>
          body { font-family: Manrope, system-ui, sans-serif; background: #F6F8FC; color: #08111F; padding: 40px; margin: 0; }
          .header { border-bottom: 2px solid #315CF5; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
          .title { font-size: 24px; font-weight: bold; color: #08111F; }
          .subtitle { font-size: 14px; color: #5D6675; margin-top: 4px; }
          .date { font-size: 12px; color: #8A94A3; font-family: 'IBM Plex Mono', monospace; }
          .rec-box { background: #E7F7E9; border: 1px solid rgba(67, 185, 107, 0.4); border-radius: 12px; padding: 16px; margin-bottom: 24px; }
          .rec-title { font-size: 16px; font-weight: bold; color: #43B96B; }
          .rec-desc { font-size: 13px; color: #08111F; margin-top: 6px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
          .card { background: #FFFFFF; border: 1px solid #DDE3EC; border-radius: 12px; padding: 16px; }
          .card-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #315CF5; font-weight: bold; font-family: 'IBM Plex Mono', monospace; }
          .card-value { font-size: 16px; font-weight: bold; margin-top: 4px; color: #08111F; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; background: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #DDE3EC; }
          th { background: #F6F8FC; text-align: left; padding: 12px 16px; font-size: 12px; color: #5D6675; font-family: 'IBM Plex Mono', monospace; }
          td { padding: 12px 16px; font-size: 13px; border-top: 1px solid #DDE3EC; }
          .winner { color: #43B96B; font-weight: bold; background: #E7F7E9; }
          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #8A94A3; border-top: 1px solid #DDE3EC; padding-top: 16px; font-family: 'IBM Plex Mono', monospace; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">Obrix Location Intelligence</div>
            <div class="subtitle">Site Comparison & Feasibility Evaluation Report</div>
          </div>
          <div class="date">Generated: ${new Date().toLocaleString()}</div>
        </div>

        <div class="rec-box">
          <div class="rec-title">🏆 Recommendation: ${recommendedLoc} is Recommended (${recScore}/100)</div>
          <div class="rec-desc">This site demonstrates superior readiness score (${recScore} vs ${otherScore}), lower competitive pressure, and optimal accessibility.</div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-title">Location A (Primary)</div>
            <div class="card-value">${primaryResult.business_type ? primaryResult.business_type.toUpperCase() : 'SITE A'}</div>
            <div style="font-size: 12px; color: #8A94A3; margin-top: 4px; font-family: 'IBM Plex Mono', monospace;">${parseFloat(primaryResult.latitude || 23.0225).toFixed(4)}° N, ${parseFloat(primaryResult.longitude || 72.5714).toFixed(4)}° E</div>
          </div>
          <div class="card">
            <div class="card-title">Location B (Compared)</div>
            <div class="card-value">${secondaryResult.business_type ? secondaryResult.business_type.toUpperCase() : 'SITE B'}</div>
            <div style="font-size: 12px; color: #8A94A3; margin-top: 4px; font-family: 'IBM Plex Mono', monospace;">${parseFloat(secondaryResult.latitude || 23.0300).toFixed(4)}° N, ${parseFloat(secondaryResult.longitude || 72.5800).toFixed(4)}° E</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Metric Evaluated</th>
              <th style="text-align: center;">Location A</th>
              <th style="text-align: center;">Location B</th>
            </tr>
          </thead>
          <tbody>
            ${metrics.map(m => `
              <tr>
                <td><strong>${m.label}</strong></td>
                <td style="text-align: center;" class="${m.winner === 'primary' ? 'winner' : ''}">${m.pVal}</td>
                <td style="text-align: center;" class="${m.winner === 'secondary' ? 'winner' : ''}">${m.sVal}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          Obrix Location Intelligence Engine v1.0.0 &bull; Proprietary & Confidential Spatial Analysis
        </div>
      </body>
      </html>
    `

    const printWin = window.open('', '_blank')
    if (printWin) {
      printWin.document.write(reportHtml)
      printWin.document.close()
      setTimeout(() => {
        printWin.print()
      }, 500)
    }
  }

  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center bg-[#08111F]/70 backdrop-blur-sm p-4 font-sans">
      <div className="w-full max-w-3xl bg-white border border-[#DDE3EC] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] relative">

        {/* Toast notification */}
        {toastMsg && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[4500] px-4 py-2 bg-[#315CF5] text-white text-xs font-bold rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
            <Sparkles className="w-4 h-4" /> {toastMsg}
          </div>
        )}

        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDE3EC] bg-[#F6F8FC]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#E9EFFF] text-[#315CF5] border border-[#315CF5]/20">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#08111F] font-sans">Location Comparison Dashboard</h2>
              <p className="text-xs text-[#5D6675]">Side-by-side site readiness & infrastructure breakdown</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8A94A3] hover:text-[#08111F] hover:bg-[#E2E8F0] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Table & Winner Banner */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Winner Recommendation Banner */}
          <div className="p-4 rounded-xl bg-[#E7F7E9] border border-[#43B96B]/30 flex items-start gap-3.5 shadow-2xs">
            <div className="p-2 rounded-xl bg-white text-[#43B96B] border border-[#43B96B]/30 shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-[#43B96B]">
                  {recommendedLoc} is Recommended!
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white text-[#43B96B] border border-[#43B96B]/30">
                  Score: {recScore}/100
                </span>
              </div>
              <p className="text-xs text-[#08111F] mt-1 leading-relaxed">
                This location offers higher overall site readiness ({recScore} vs {otherScore}) with superior infrastructure accessibility and lower competitive risk.
              </p>
            </div>
          </div>

          {/* Sites Header Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#F6F8FC] border border-[#315CF5]/30 space-y-1 relative">
              <div className="text-[10px] font-mono font-bold tracking-wider text-[#315CF5] uppercase">
                Location A (Primary)
              </div>
              <div className="text-sm font-bold text-[#08111F] truncate font-sans">
                {primaryResult.business_type ? primaryResult.business_type.toUpperCase() : 'SITE A'}
              </div>
              <div className="text-xs text-[#8A94A3] font-mono">
                {parseFloat(primaryResult.latitude || 23.0225).toFixed(4)}° N, {parseFloat(primaryResult.longitude || 72.5714).toFixed(4)}° E
              </div>
              {pScoreNum >= sScoreNum && (
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E7F7E9] text-[#43B96B] border border-[#43B96B]/30 flex items-center gap-1">
                  <Award className="w-3 h-3" /> Winner
                </span>
              )}
            </div>

            <div className="p-4 rounded-xl bg-[#F6F8FC] border border-[#DDE3EC] space-y-1 relative">
              <div className="text-[10px] font-mono font-bold tracking-wider text-[#5D6675] uppercase">
                Location B (Compared)
              </div>
              <div className="text-sm font-bold text-[#08111F] truncate font-sans">
                {secondaryResult.business_type ? secondaryResult.business_type.toUpperCase() : 'SITE B'}
              </div>
              <div className="text-xs text-[#8A94A3] font-mono">
                {parseFloat(secondaryResult.latitude || 23.0300).toFixed(4)}° N, {parseFloat(secondaryResult.longitude || 72.5800).toFixed(4)}° E
              </div>
              {sScoreNum > pScoreNum && (
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E7F7E9] text-[#43B96B] border border-[#43B96B]/30 flex items-center gap-1">
                  <Award className="w-3 h-3" /> Winner
                </span>
              )}
            </div>
          </div>

          {/* Metrics Comparison Table */}
          <div className="border border-[#DDE3EC] rounded-xl overflow-hidden bg-white">
            <table className="w-full text-xs text-left border-collapse font-sans">
              <thead>
                <tr className="border-b border-[#DDE3EC] bg-[#F6F8FC] text-[#5D6675] font-mono font-semibold">
                  <th className="py-2.5 px-4">Metric</th>
                  <th className="py-2.5 px-4 text-center">Location A</th>
                  <th className="py-2.5 px-4 text-center">Location B</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE3EC]">
                {metrics.map((m, idx) => (
                  <tr key={idx} className="hover:bg-[#F6F8FC] transition-colors">
                    <td className="py-2.5 px-4 font-medium text-[#08111F]">{m.label}</td>
                    <td
                      className={`py-2.5 px-4 text-center font-mono font-bold ${
                        m.winner === 'primary' ? 'text-[#43B96B] bg-[#E7F7E9]' : 'text-[#08111F]'
                      }`}
                    >
                      {m.pVal}
                    </td>
                    <td
                      className={`py-2.5 px-4 text-center font-mono font-bold ${
                        m.winner === 'secondary' ? 'text-[#43B96B] bg-[#E7F7E9]' : 'text-[#08111F]'
                      }`}
                    >
                      {m.sVal}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions Bar */}
        <div className="px-6 py-3.5 border-t border-[#DDE3EC] bg-[#F6F8FC] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveComparison}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white border border-[#DDE3EC] text-[#08111F] hover:bg-[#E9EFFF] transition-all cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-[#43B96B]" /> Saved
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4 text-[#315CF5]" /> Save Comparison
                </>
              )}
            </button>

            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white border border-[#DDE3EC] text-[#08111F] hover:bg-[#E9EFFF] transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#315CF5]" /> Export PDF
            </button>

            <button
              onClick={handleAskObrixComparison}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#315CF5] hover:bg-[#2448D8] text-white transition-all cursor-pointer shadow-xs"
            >
              <Sparkles className="w-4 h-4" /> Discuss Comparison with Ask Obrix →
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-[#08111F] hover:bg-[#1E293B] text-white transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
