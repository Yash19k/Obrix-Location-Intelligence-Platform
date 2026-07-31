import { useState } from 'react'
import { X, Sparkles, Download, RefreshCw, Award, CheckCircle, AlertTriangle, ShieldCheck, FileText, TrendingUp, Building2, MapPin } from 'lucide-react'
import useReportStore from '@/store/reportStore'

export default function ReportViewerModal({ isOpen, onClose, report }) {
  const { regenerateReport, isGenerating } = useReportStore()
  const [toastMsg, setToastMsg] = useState(null)

  if (!isOpen || !report) return null

  const ai = report.ai_report_json || {}
  const lat = parseFloat(report.latitude || 23.0225).toFixed(4)
  const lon = parseFloat(report.longitude || 72.5714).toFixed(4)
  const bizType = (report.business_type || 'retail').toUpperCase()
  const score = Number(report.score || 65.0)

  const swot = ai.swot || { strengths: [], weaknesses: [], opportunities: [], threats: [] }
  const risks = ai.risk_assessment || {}
  const rec = ai.investment_recommendation || { grade: 'B', recommendation: 'MAYBE', reasoning: 'Moderate readiness score.' }
  const strat = ai.business_strategy || { marketing_ideas: [], business_improvements: [] }

  const handleRegenerate = async () => {
    const res = await regenerateReport(report.id)
    if (res.success) {
      setToastMsg('✓ AI Report regenerated successfully!')
      setTimeout(() => setToastMsg(null), 3000)
    }
  }

  const handleDownloadPdf = () => {
    const reportHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Obrix_AI_Report_Ahmedabad_${bizType}.pdf</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; background: #0b1120; color: #f8fafc; padding: 40px; margin: 0; }
          .header { border-bottom: 2px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-start; }
          .title { font-size: 26px; font-weight: bold; color: #818cf8; }
          .subtitle { font-size: 14px; color: #94a3b8; margin-top: 6px; }
          .badge { background: #1e1b4b; color: #818cf8; border: 1px solid #4338ca; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          .section { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 20px; margin-bottom: 20px; }
          .section-title { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #818cf8; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #334155; padding-bottom: 6px; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; }
          .rec-box { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); padding: 20px; border-radius: 16px; margin-bottom: 24px; }
          .rec-grade { font-size: 28px; font-weight: bold; color: #34d399; }
          .footer { border-top: 1px solid #334155; padding-top: 20px; text-align: center; font-size: 11px; color: #64748b; margin-top: 40px; }
          ul { margin: 6px 0; padding-left: 20px; }
          li { margin-bottom: 4px; font-size: 13px; color: #cbd5e1; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">Obrix Location Intelligence</div>
            <div class="subtitle">AI Business Consulting & Spatial Feasibility Report — ${bizType}</div>
          </div>
          <div>
            <span class="badge">McKinsey-Grade Analytics</span>
            <div style="font-size: 11px; color: #64748b; margin-top: 8px; font-family: monospace;">Date: ${new Date(report.created_at || Date.now()).toLocaleDateString()}</div>
          </div>
        </div>

        <div class="rec-box">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #34d399; font-weight: bold;">Investment Recommendation</div>
              <div class="rec-grade">GRADE ${rec.grade || 'A'} &mdash; ${rec.recommendation || 'YES'}</div>
            </div>
            <div style="font-size: 24px; font-weight: bold; color: #fbbf24;">Score: ${score.toFixed(1)}/100</div>
          </div>
          <div style="font-size: 13px; color: #e2e8f0; margin-top: 10px;">${rec.reasoning || ''}</div>
        </div>

        <div class="section">
          <div class="section-title">1. Executive Summary</div>
          <p style="font-size: 13px; line-height: 1.6; color: #cbd5e1;">${ai.executive_summary || ''}</p>
        </div>

        <div class="section">
          <div class="section-title">2. Location & Spatial Setting</div>
          <p style="font-size: 13px; line-height: 1.6; color: #cbd5e1;">${ai.location_overview || ''}</p>
        </div>

        <div class="section">
          <div class="section-title">3. Site Readiness Interpretation</div>
          <p style="font-size: 13px; line-height: 1.6; color: #cbd5e1;">${ai.readiness_interpretation || ''}</p>
        </div>

        <div class="grid-2">
          <div class="section">
            <div class="section-title">4. Infrastructure & Connectivity</div>
            <p style="font-size: 13px; line-height: 1.6; color: #cbd5e1;">${ai.infrastructure_analysis || ''}</p>
          </div>
          <div class="section">
            <div class="section-title">5. Accessibility Analysis</div>
            <p style="font-size: 13px; line-height: 1.6; color: #cbd5e1;">${ai.accessibility_analysis || ''}</p>
          </div>
        </div>

        <div class="section">
          <div class="section-title">6. Competitor Analysis & Saturation</div>
          <p style="font-size: 13px; line-height: 1.6; color: #cbd5e1;">${ai.competitor_analysis || ''}</p>
        </div>

        <div class="section">
          <div class="section-title">7. SWOT Analysis Matrix</div>
          <div class="grid-2">
            <div>
              <strong style="color: #34d399; font-size: 12px;">STRENGTHS</strong>
              <ul>${(swot.strengths || []).map(s => `<li>${s}</li>`).join('')}</ul>
            </div>
            <div>
              <strong style="color: #f87171; font-size: 12px;">WEAKNESSES</strong>
              <ul>${(swot.weaknesses || []).map(w => `<li>${w}</li>`).join('')}</ul>
            </div>
            <div style="margin-top: 10px;">
              <strong style="color: #60a5fa; font-size: 12px;">OPPORTUNITIES</strong>
              <ul>${(swot.opportunities || []).map(o => `<li>${o}</li>`).join('')}</ul>
            </div>
            <div style="margin-top: 10px;">
              <strong style="color: #fbbf24; font-size: 12px;">THREATS</strong>
              <ul>${(swot.threats || []).map(t => `<li>${t}</li>`).join('')}</ul>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">8. Risk Assessment</div>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Business Risks:</strong> ${risks.business_risks || 'Standard commercial risks.'}</li>
            <li style="margin-top: 6px;"><strong>Accessibility Risks:</strong> ${risks.accessibility_risks || 'Traffic bottlenecks during peak hours.'}</li>
            <li style="margin-top: 6px;"><strong>Market Saturation Risks:</strong> ${risks.market_risks || 'Competitive pressure within 1km.'}</li>
          </ul>
        </div>

        <div class="section">
          <div class="section-title">9. Strategic Business Recommendations</div>
          <p style="font-size: 13px; color: #cbd5e1;"><strong>Target Customers:</strong> ${strat.target_customers || ''}</p>
          <p style="font-size: 13px; color: #cbd5e1; margin-top: 6px;"><strong>Operating Hours:</strong> ${strat.best_operating_hours || ''}</p>
          <strong style="color: #818cf8; font-size: 12px; display: block; margin-top: 10px;">MARKETING INITIATIVES:</strong>
          <ul>${(strat.marketing_ideas || []).map(m => `<li>${m}</li>`).join('')}</ul>
        </div>

        <div class="section">
          <div class="section-title">10. Final Executive Conclusion</div>
          <p style="font-size: 13px; line-height: 1.6; color: #cbd5e1;">${ai.final_conclusion || ''}</p>
        </div>

        <div class="footer">
          Obrix Spatial Intelligence Engine &bull; Confidential Business Consulting Report &bull; Generated for ${report.user || 'Client'}
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
    <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4 md:p-6">
      <div className="w-full max-w-4xl bg-[#0d1526] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] relative">
        
        {/* Toast feedback */}
        {toastMsg && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[5500] px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
            <Sparkles className="w-4 h-4" /> {toastMsg}
          </div>
        )}

        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0b1120]/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">{report.title || 'AI Consulting Report'}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  McKinsey Style
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {bizType} &bull; Coordinates: {lat}, {lon} &bull; Date: {new Date(report.created_at || Date.now()).toLocaleDateString()}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content Scroll Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">

          {/* Investment Grade & Recommendation Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 border border-emerald-500/40 flex items-center justify-between shadow-xl">
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Investment Recommendation
              </div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-extrabold text-emerald-300">
                  GRADE {rec.grade || 'A'} &mdash; {rec.recommendation || 'YES'}
                </h3>
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Score: {score.toFixed(1)}/100
                </span>
              </div>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed mt-1">
                {rec.reasoning}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center shrink-0">
              <Award className="w-8 h-8 text-emerald-400 mx-auto" />
              <span className="text-[10px] font-bold text-emerald-300 block mt-1">Verified Feasibility</span>
            </div>
          </div>

          {/* Section 1: Executive Summary */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-2">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">1. Executive Summary</h4>
            <p className="leading-relaxed text-slate-200">{ai.executive_summary}</p>
          </div>

          {/* Section 2 & 3: Location Overview & Readiness Score Interpretation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-2">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">2. Location Overview</h4>
              <p className="leading-relaxed text-slate-300">{ai.location_overview}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-2">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">3. Site Readiness Interpretation</h4>
              <p className="leading-relaxed text-slate-300">{ai.readiness_interpretation}</p>
            </div>
          </div>

          {/* Section 4 & 5: Infrastructure & Accessibility */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-2">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">4. Infrastructure Analysis</h4>
              <p className="leading-relaxed text-slate-300">{ai.infrastructure_analysis}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-2">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">5. Accessibility Analysis</h4>
              <p className="leading-relaxed text-slate-300">{ai.accessibility_analysis}</p>
            </div>
          </div>

          {/* Section 6 & 7: Competitor Analysis & Amenities Summary */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-2">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">6. Competitor Analysis & Market Saturation</h4>
            <p className="leading-relaxed text-slate-200">{ai.competitor_analysis}</p>
          </div>

          {/* Section 8: SWOT Analysis Matrix */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-4">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">7. SWOT Analysis Matrix</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-1.5">
                <span className="font-bold text-emerald-400 block">Strengths</span>
                <ul className="space-y-1 text-slate-300 list-disc list-inside text-[11px]">
                  {(swot.strengths || []).map((s, idx) => <li key={idx}>{s}</li>)}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 space-y-1.5">
                <span className="font-bold text-rose-400 block">Weaknesses</span>
                <ul className="space-y-1 text-slate-300 list-disc list-inside text-[11px]">
                  {(swot.weaknesses || []).map((w, idx) => <li key={idx}>{w}</li>)}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 space-y-1.5">
                <span className="font-bold text-blue-400 block">Opportunities</span>
                <ul className="space-y-1 text-slate-300 list-disc list-inside text-[11px]">
                  {(swot.opportunities || []).map((o, idx) => <li key={idx}>{o}</li>)}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 space-y-1.5">
                <span className="font-bold text-amber-400 block">Threats</span>
                <ul className="space-y-1 text-slate-300 list-disc list-inside text-[11px]">
                  {(swot.threats || []).map((t, idx) => <li key={idx}>{t}</li>)}
                </ul>
              </div>
            </div>
          </div>

          {/* Section 9: Risk Assessment */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-3">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">8. Risk Assessment</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-800/40 border border-white/5">
                <span className="font-bold text-slate-200">Business Risks:</span>
                <p className="text-slate-300 mt-1">{risks.business_risks}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/40 border border-white/5">
                <span className="font-bold text-slate-200">Accessibility Risks:</span>
                <p className="text-slate-300 mt-1">{risks.accessibility_risks}</p>
              </div>
            </div>
          </div>

          {/* Section 10 & 11: Strategy & Growth */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">9. Business Strategy & Action Plan</h4>
            <p><strong className="text-slate-200">Target Customers:</strong> {strat.target_customers}</p>
            <p><strong className="text-slate-200">Best Operating Hours:</strong> {strat.best_operating_hours}</p>
            <div>
              <strong className="text-indigo-300 block mb-1">Marketing Ideas:</strong>
              <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                {(strat.marketing_ideas || []).map((m, idx) => <li key={idx}>{m}</li>)}
              </ul>
            </div>
          </div>

          {/* Section 12 & 13: Final Conclusion */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-indigo-500/20 space-y-2">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">10. Executive Conclusion</h4>
            <p className="leading-relaxed text-slate-200">{ai.final_conclusion}</p>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#0b1120]/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Download className="w-4 h-4" /> Download PDF Report
            </button>
            <button
              onClick={handleRegenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-purple-400 ${isGenerating ? 'animate-spin' : ''}`} />
              Regenerate
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 transition-all"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  )
}
