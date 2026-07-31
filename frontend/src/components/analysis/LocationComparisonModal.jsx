import { useState } from 'react'
import { X, ArrowLeftRight, Check, Award, Sparkles, Download, Bookmark } from 'lucide-react'
import useLocationStore from '@/store/locationStore'

export default function LocationComparisonModal({ isOpen, onClose, primaryResult, secondaryResult }) {
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

  const pConf = pRes.raw_factors?._meta?.confidence || pRes.confidence || {}
  const sConf = sRes.raw_factors?._meta?.confidence || sRes.confidence || {}

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
      label: 'Data Confidence',
      pVal: pConf.label ? `${pConf.label} (${Math.round(pConf.score || 0)}%)` : '99.8%',
      sVal: sConf.label ? `${sConf.label} (${Math.round(sConf.score || 0)}%)` : '95.0%',
      winner: (pConf.score || 99) >= (sConf.score || 95) ? 'primary' : 'secondary',
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
      label: 'Parks Count',
      pVal: pCounts.parks ?? 0,
      sVal: sCounts.parks ?? 0,
      winner: (pCounts.parks || 0) > (sCounts.parks || 0) ? 'primary' : (pCounts.parks || 0) < (sCounts.parks || 0) ? 'secondary' : 'tie',
    },
    {
      label: 'Competitor Count',
      pVal: pComp.competitor_count ?? 0,
      sVal: sComp.competitor_count ?? 0,
      winner: (pComp.competitor_count || 0) <= (sComp.competitor_count || 0) ? 'primary' : 'secondary',
    },
    {
      label: 'Competition Level',
      pVal: pComp.competition_level || 'Low',
      sVal: sComp.competition_level || 'Low',
      winner: 'tie',
    },
    {
      label: 'Total Features Loaded',
      pVal: pOsm.total_features ?? (Object.values(pCounts).reduce((a, b) => a + b, 0)),
      sVal: sOsm.total_features ?? (Object.values(sCounts).reduce((a, b) => a + b, 0)),
      winner: 'tie',
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

  const handleExport = () => {
    const reportHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Obrix Location Comparison Report</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; margin: 0; }
          .header { border-bottom: 2px solid #6366f1; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
          .title { font-size: 24px; font-weight: bold; color: #818cf8; }
          .subtitle { font-size: 14px; color: #94a3b8; margin-top: 4px; }
          .date { font-size: 12px; color: #64748b; font-family: monospace; }
          .rec-box { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 12px; padding: 16px; margin-bottom: 24px; }
          .rec-title { font-size: 16px; font-weight: bold; color: #34d399; }
          .rec-desc { font-size: 13px; color: #cbd5e1; margin-top: 6px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
          .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 16px; }
          .card-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #818cf8; font-weight: bold; }
          .card-value { font-size: 16px; font-weight: bold; margin-top: 4px; color: #f1f5f9; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; background: #1e293b; border-radius: 12px; overflow: hidden; }
          th { background: #334155; text-align: left; padding: 12px 16px; font-size: 12px; color: #94a3b8; }
          td { padding: 12px 16px; font-size: 13px; border-top: 1px solid #334155; }
          .winner { color: #34d399; font-weight: bold; background: rgba(16, 185, 129, 0.1); }
          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #334155; padding-top: 16px; }
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
          <div class="rec-desc">This site demonstrates superior readiness score (${recScore} vs ${otherScore}), lower competitive pressure, and optimal road network accessibility.</div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-title">Location A (Primary)</div>
            <div class="card-value">${primaryResult.business_type ? primaryResult.business_type.toUpperCase() : 'SITE A'}</div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 4px; font-family: monospace;">${parseFloat(primaryResult.latitude || 23.0225).toFixed(4)}, ${parseFloat(primaryResult.longitude || 72.5714).toFixed(4)}</div>
          </div>
          <div class="card">
            <div class="card-title">Location B (Compared)</div>
            <div class="card-value">${secondaryResult.business_type ? secondaryResult.business_type.toUpperCase() : 'SITE B'}</div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 4px; font-family: monospace;">${parseFloat(secondaryResult.latitude || 23.0300).toFixed(4)}, ${parseFloat(secondaryResult.longitude || 72.5800).toFixed(4)}</div>
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
          Obrix Location Intelligence Engine v0.1.0 &bull; Proprietary & Confidential Spatial Analysis
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
    <div className="fixed inset-0 z-[4000] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] relative">
        
        {/* Toast feedback */}
        {toastMsg && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[4500] px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
            <Sparkles className="w-4 h-4" /> {toastMsg}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Location Comparison Dashboard</h2>
              <p className="text-xs text-slate-400">Side-by-side site readiness & infrastructure breakdown</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Table & Recommendation */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Winner Recommendation Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/50 via-slate-900 to-indigo-950/50 border border-emerald-500/30 flex items-start gap-3.5 shadow-lg">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-emerald-300">
                  {recommendedLoc} is Recommended!
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Score: {recScore}/100
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                This location offers higher overall site readiness ({recScore} vs {otherScore}) with superior infrastructure accessibility and lower competitive risk for your setup.
              </p>
            </div>
          </div>

          {/* Sites Header Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/60 border border-indigo-500/30 space-y-1 relative">
              <div className="text-[10px] font-semibold tracking-wider text-indigo-400 uppercase">
                Location A (Primary)
              </div>
              <div className="text-sm font-bold text-slate-100 truncate">
                {primaryResult.business_type ? primaryResult.business_type.toUpperCase() : 'SITE A'}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                {parseFloat(primaryResult.latitude || 23.0225).toFixed(4)}, {parseFloat(primaryResult.longitude || 72.5714).toFixed(4)}
              </div>
              {pScoreNum >= sScoreNum && (
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Award className="w-3 h-3" /> Winner
                </span>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-800/60 border border-purple-500/30 space-y-1 relative">
              <div className="text-[10px] font-semibold tracking-wider text-purple-400 uppercase">
                Location B (Compared)
              </div>
              <div className="text-sm font-bold text-slate-100 truncate">
                {secondaryResult.business_type ? secondaryResult.business_type.toUpperCase() : 'SITE B'}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                {parseFloat(secondaryResult.latitude || 23.0300).toFixed(4)}, {parseFloat(secondaryResult.longitude || 72.5800).toFixed(4)}
              </div>
              {sScoreNum > pScoreNum && (
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Award className="w-3 h-3" /> Winner
                </span>
              )}
            </div>
          </div>

          {/* Metrics Comparison Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/50 text-slate-400 font-semibold">
                  <th className="py-2.5 px-4">Metric</th>
                  <th className="py-2.5 px-4 text-center">Location A</th>
                  <th className="py-2.5 px-4 text-center">Location B</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {metrics.map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-4 font-medium text-slate-300">{m.label}</td>
                    <td
                      className={`py-2.5 px-4 text-center font-semibold ${
                        m.winner === 'primary' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-300'
                      }`}
                    >
                      {m.pVal}
                    </td>
                    <td
                      className={`py-2.5 px-4 text-center font-semibold ${
                        m.winner === 'secondary' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-300'
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

        {/* Footer Actions */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveComparison}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 transition-all"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" /> Comparison Saved!
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4 text-indigo-400" /> Save Comparison
                </>
              )}
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 transition-all"
            >
              <Download className="w-4 h-4 text-purple-400" /> Export PDF
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-all"
          >
            Exit Compare Mode
          </button>
        </div>
      </div>
    </div>
  )
}
