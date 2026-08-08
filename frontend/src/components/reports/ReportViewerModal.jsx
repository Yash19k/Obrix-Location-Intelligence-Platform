import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Sparkles, Download, RefreshCw, Award, CheckCircle, AlertTriangle, ShieldCheck, FileText, TrendingUp, Building2, MapPin } from 'lucide-react'
import useReportStore from '@/store/reportStore'
import Spinner from '@/components/ui/Spinner'

export default function ReportViewerModal({ isOpen, onClose, report }) {
  const { regenerateReport, isGenerating } = useReportStore()
  const [toastMsg, setToastMsg] = useState(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

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

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)

  const handleDownloadPdf = () => {
    setIsDownloadingPdf(true)

    setTimeout(() => {
      try {
        const reportHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Location_Report</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; background: #ffffff; color: #08111f; padding: 40px; margin: 0; }
              .header { border-bottom: 2px solid #315cf5; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-start; }
              .title { font-size: 26px; font-weight: bold; color: #315cf5; }
              .subtitle { font-size: 14px; color: #5d6675; margin-top: 6px; }
              .badge { background: #e9efff; color: #315cf5; border: 1px solid rgba(49,92,245,0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
              .section { background: #f6f8fc; border: 1px solid #dde3ec; border-radius: 16px; padding: 20px; margin-bottom: 20px; page-break-inside: avoid; }
              .section-title { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #315cf5; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #dde3ec; padding-bottom: 6px; }
              .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
              .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; }
              .rec-box { background: #e7f7e9; border: 1px solid rgba(67,185,107,0.3); padding: 20px; border-radius: 16px; margin-bottom: 24px; }
              .rec-grade { font-size: 28px; font-weight: bold; color: #43b96b; }
              .footer { border-top: 1px solid #dde3ec; padding-top: 20px; text-align: center; font-size: 11px; color: #8a94a3; margin-top: 40px; }
              ul { margin: 6px 0; padding-left: 20px; }
              li { margin-bottom: 4px; font-size: 13px; color: #08111f; }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <div class="title">${report.title || 'AI Location Feasibility Report'}</div>
                <div class="subtitle">Location: ${lat}° N, ${lon}° E &bull; Business: ${bizType} &bull; Date: ${new Date(report.created_at || Date.now()).toLocaleDateString()}</div>
              </div>
              <div class="badge">OBRIX REPORT</div>
            </div>

            <div class="rec-box">
              <div class="section-title">1. Location Executive Summary</div>
              <p style="font-size: 13px; line-height: 1.6; color: #08111f;">${ai.executive_summary || 'Detailed site analysis summary.'}</p>
            </div>

            <div class="section">
              <div class="section-title">2. Primary Value Drivers</div>
              <ul>${(ai.primary_value_drivers || []).map(d => `<li>${d}</li>`).join('')}</ul>
            </div>

            <div class="section">
              <div class="section-title">3. SWOT Analysis</div>
              <div class="grid-2">
                <div>
                  <strong style="color: #43b96b; font-size: 12px; display: block; margin-bottom: 4px;">STRENGTHS</strong>
                  <ul>${(swot.strengths || []).map(s => `<li>${s}</li>`).join('')}</ul>
                </div>
                <div>
                  <strong style="color: #ef4444; font-size: 12px; display: block; margin-bottom: 4px;">WEAKNESSES</strong>
                  <ul>${(swot.weaknesses || []).map(w => `<li>${w}</li>`).join('')}</ul>
                </div>
              </div>
              <div class="grid-2" style="margin-top: 14px;">
                <div>
                  <strong style="color: #315cf5; font-size: 12px; display: block; margin-bottom: 4px;">OPPORTUNITIES</strong>
                  <ul>${(swot.opportunities || []).map(o => `<li>${o}</li>`).join('')}</ul>
                </div>
                <div>
                  <strong style="color: #d97706; font-size: 12px; display: block; margin-bottom: 4px;">THREATS</strong>
                  <ul>${(swot.threats || []).map(t => `<li>${t}</li>`).join('')}</ul>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">4. Demographic & Catchment Analysis</div>
              <p style="font-size: 13px; color: #08111f;">${ai.demographic_analysis || ''}</p>
            </div>

            <div class="section">
              <div class="section-title">5. Foot Traffic & Accessibility Analysis</div>
              <p style="font-size: 13px; color: #08111f;">${ai.foot_traffic_analysis || ''}</p>
            </div>

            <div class="section">
              <div class="section-title">6. Competition & Saturation Analysis</div>
              <p style="font-size: 13px; color: #08111f;">${ai.competition_analysis || ''}</p>
            </div>

            <div class="section">
              <div class="section-title">7. Infrastructure & Nearby Anchors</div>
              <p style="font-size: 13px; color: #08111f;">${ai.infrastructure_analysis || ''}</p>
            </div>

            <div class="section">
              <div class="section-title">8. Risk Assessment</div>
              <ul style="list-style: none; padding: 0;">
                <li><strong>Business Risks:</strong> ${risks.business_risks || 'Standard risks.'}</li>
                <li><strong>Accessibility Risks:</strong> ${risks.accessibility_risks || 'Traffic delay risk.'}</li>
              </ul>
            </div>

            <div class="section">
              <div class="section-title">9. Business Strategy Advice</div>
              <p style="font-size: 13px; color: #08111f;"><strong>Target Customers:</strong> ${strat.target_customers || ''}</p>
              <p style="font-size: 13px; color: #08111f; margin-top: 6px;"><strong>Operating Hours:</strong> ${strat.best_operating_hours || ''}</p>
              <strong style="color: #315cf5; font-size: 12px; display: block; margin-top: 10px;">MARKETING INITIATIVES:</strong>
              <ul>${(strat.marketing_ideas || []).map(m => `<li>${m}</li>`).join('')}</ul>
            </div>

            <div class="section">
              <div class="section-title">10. Final Executive Conclusion</div>
              <p style="font-size: 13px; line-height: 1.6; color: #08111f;">${ai.final_conclusion || ''}</p>
            </div>

            <div class="footer">
              Obrix Spatial Intelligence Engine &bull; Confidential Business Consulting Report &bull; Generated for ${report.user || 'Client'}
            </div>
          </body>
          </html>
        `

        const iframe = document.createElement('iframe')
        iframe.style.position = 'fixed'
        iframe.style.right = '0'
        iframe.style.bottom = '0'
        iframe.style.width = '0'
        iframe.style.height = '0'
        iframe.style.border = '0'
        document.body.appendChild(iframe)

        iframe.contentWindow.document.open()
        iframe.contentWindow.document.write(reportHtml)
        iframe.contentWindow.document.close()

        iframe.onload = () => {
          iframe.contentWindow.focus()
          iframe.contentWindow.print()
          
          setIsDownloadingPdf(false)
          setToastMsg('PDF downloaded successfully')
          setTimeout(() => setToastMsg(null), 3000)
          
          setTimeout(() => {
            document.body.removeChild(iframe)
          }, 1000)
        }
      } catch (err) {
        setIsDownloadingPdf(false)
        setToastMsg('⚠ Error: ' + err.message)
        setTimeout(() => setToastMsg(null), 4000)
      }
    }, 1200)
  }

  return createPortal(
    <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-[#08111F]/60 backdrop-blur-md p-4 md:p-6 font-sans">
      <div className="w-full max-w-4xl bg-white border border-[#DDE3EC] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] relative">
        
        {/* Toast Feedback */}
        {toastMsg && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[5500] px-4 py-2 bg-[#43B96B] text-white text-xs font-bold rounded-full shadow-xl flex items-center gap-2 animate-bounce">
            <Sparkles className="w-4 h-4" /> {toastMsg}
          </div>
        )}

        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDE3EC] bg-[#F6F8FC]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#E9EFFF] border border-[#315CF5]/20 text-[#315CF5]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-[#08111F] font-sans">{report.title || 'AI Consulting Report'}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#E9EFFF] text-[#315CF5] border border-[#315CF5]/20">
                  LOCATION INTELLIGENCE REPORT
                </span>
              </div>
              <p className="text-xs text-[#5D6675] font-mono font-medium mt-0.5">
                {bizType} &bull; Coordinates: {lat}° N, {lon}° E &bull; Date: {new Date(report.created_at || Date.now()).toLocaleDateString()}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8A94A3] hover:text-[#08111F] hover:bg-[#E8ECF2] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content Scroll Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-[#08111F]">

          {/* Investment Grade & Recommendation Banner */}
          <div className="p-5 rounded-2xl bg-[#E7F7E9] border border-[#43B96B]/30 flex items-center justify-between shadow-2xs">
            <div className="space-y-1">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#43B96B]">
                INVESTMENT RECOMMENDATION
              </div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-extrabold text-[#43B96B] font-sans">
                  GRADE {rec.grade || 'A'} &mdash; {rec.recommendation || 'YES'}
                </h3>
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-white text-[#315CF5] border border-[#315CF5]/20">
                  Score: {score.toFixed(1)}/100
                </span>
              </div>
              <p className="text-xs text-[#08111F] max-w-xl leading-relaxed mt-1 font-sans font-medium">
                {rec.reasoning}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-[#43B96B]/20 text-center shrink-0 shadow-2xs">
              <Award className="w-8 h-8 text-[#43B96B] mx-auto" />
              <span className="text-[10px] font-mono font-bold text-[#43B96B] block mt-1">Verified Feasibility</span>
            </div>
          </div>

          {/* Section 1: Executive Summary */}
          <div className="p-4 rounded-2xl bg-[#F6F8FC] border border-[#DDE3EC] space-y-1.5">
            <h4 className="text-[10px] font-mono font-bold text-[#315CF5] uppercase tracking-wider">1. EXECUTIVE SUMMARY</h4>
            <p className="leading-relaxed text-[#08111F] font-sans text-xs">{ai.executive_summary}</p>
          </div>

          {/* Section 2 & 3: Location Overview & Readiness Score Interpretation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#F6F8FC] border border-[#DDE3EC] space-y-1.5">
              <h4 className="text-[10px] font-mono font-bold text-[#315CF5] uppercase tracking-wider">2. LOCATION OVERVIEW</h4>
              <p className="leading-relaxed text-[#08111F] font-sans text-xs">{ai.location_overview}</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F6F8FC] border border-[#DDE3EC] space-y-1.5">
              <h4 className="text-[10px] font-mono font-bold text-[#315CF5] uppercase tracking-wider">3. SITE READINESS INTERPRETATION</h4>
              <p className="leading-relaxed text-[#08111F] font-sans text-xs">{ai.readiness_interpretation}</p>
            </div>
          </div>

          {/* Section 4 & 5: Infrastructure & Accessibility */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#F6F8FC] border border-[#DDE3EC] space-y-1.5">
              <h4 className="text-[10px] font-mono font-bold text-[#315CF5] uppercase tracking-wider">4. INFRASTRUCTURE ANALYSIS</h4>
              <p className="leading-relaxed text-[#08111F] font-sans text-xs">{ai.infrastructure_analysis}</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F6F8FC] border border-[#DDE3EC] space-y-1.5">
              <h4 className="text-[10px] font-mono font-bold text-[#315CF5] uppercase tracking-wider">5. ACCESSIBILITY ANALYSIS</h4>
              <p className="leading-relaxed text-[#08111F] font-sans text-xs">{ai.accessibility_analysis}</p>
            </div>
          </div>

          {/* Section 6 & 7: Competitor Analysis & Market Saturation */}
          <div className="p-4 rounded-2xl bg-[#F6F8FC] border border-[#DDE3EC] space-y-1.5">
            <h4 className="text-[10px] font-mono font-bold text-[#315CF5] uppercase tracking-wider">6. COMPETITOR ANALYSIS & MARKET SATURATION</h4>
            <p className="leading-relaxed text-[#08111F] font-sans text-xs">{ai.competitor_analysis}</p>
          </div>

          {/* Section 8: SWOT Analysis Matrix */}
          <div className="p-5 rounded-2xl bg-[#F6F8FC] border border-[#DDE3EC] space-y-3">
            <h4 className="text-[10px] font-mono font-bold text-[#315CF5] uppercase tracking-wider">7. SWOT ANALYSIS MATRIX</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-sans">
              <div className="p-3 rounded-xl bg-[#E7F7E9] border border-[#43B96B]/30 space-y-1">
                <span className="font-bold text-[#43B96B] block text-xs">Strengths</span>
                <ul className="space-y-1 text-[#08111F] list-disc list-inside text-[11px]">
                  {(swot.strengths || []).map((s, idx) => <li key={idx}>{s}</li>)}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-[#FEE2E2] border border-red-200 space-y-1">
                <span className="font-bold text-red-700 block text-xs">Weaknesses</span>
                <ul className="space-y-1 text-[#08111F] list-disc list-inside text-[11px]">
                  {(swot.weaknesses || []).map((w, idx) => <li key={idx}>{w}</li>)}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-[#E9EFFF] border border-[#315CF5]/20 space-y-1">
                <span className="font-bold text-[#315CF5] block text-xs">Opportunities</span>
                <ul className="space-y-1 text-[#08111F] list-disc list-inside text-[11px]">
                  {(swot.opportunities || []).map((o, idx) => <li key={idx}>{o}</li>)}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-[#FEF3C7] border border-amber-300 space-y-1">
                <span className="font-bold text-amber-800 block text-xs">Threats</span>
                <ul className="space-y-1 text-[#08111F] list-disc list-inside text-[11px]">
                  {(swot.threats || []).map((t, idx) => <li key={idx}>{t}</li>)}
                </ul>
              </div>
            </div>
          </div>

          {/* Section 9: Risk Assessment */}
          <div className="p-4 rounded-2xl bg-[#F6F8FC] border border-[#DDE3EC] space-y-3">
            <h4 className="text-[10px] font-mono font-bold text-[#315CF5] uppercase tracking-wider">8. RISK ASSESSMENT</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-sans">
              <div className="p-3 rounded-xl bg-white border border-[#DDE3EC]">
                <span className="font-bold text-[#08111F]">Business Risks:</span>
                <p className="text-[#5D6675] mt-1">{risks.business_risks}</p>
              </div>
              <div className="p-3 rounded-xl bg-white border border-[#DDE3EC]">
                <span className="font-bold text-[#08111F]">Accessibility Risks:</span>
                <p className="text-[#5D6675] mt-1">{risks.accessibility_risks}</p>
              </div>
            </div>
          </div>

          {/* Section 10 & 11: Strategy & Growth */}
          <div className="p-5 rounded-2xl bg-[#F6F8FC] border border-[#DDE3EC] space-y-3 font-sans">
            <h4 className="text-[10px] font-mono font-bold text-[#315CF5] uppercase tracking-wider">9. BUSINESS STRATEGY & ACTION PLAN</h4>
            <p><strong className="text-[#08111F]">Target Customers:</strong> {strat.target_customers}</p>
            <p><strong className="text-[#08111F]">Best Operating Hours:</strong> {strat.best_operating_hours}</p>
            <div>
              <strong className="text-[#315CF5] block mb-1">Marketing Initiatives:</strong>
              <ul className="list-disc list-inside space-y-0.5 text-[#08111F]">
                {(strat.marketing_ideas || []).map((m, idx) => <li key={idx}>{m}</li>)}
              </ul>
            </div>
          </div>

          {/* Section 12 & 13: Final Conclusion */}
          <div className="p-4 rounded-2xl bg-[#F6F8FC] border border-[#DDE3EC] space-y-1.5 font-sans">
            <h4 className="text-[10px] font-mono font-bold text-[#315CF5] uppercase tracking-wider">10. EXECUTIVE CONCLUSION</h4>
            <p className="leading-relaxed text-[#08111F] font-sans text-xs">{ai.final_conclusion}</p>
          </div>

        </div>

        {/* Footer Actions Bar */}
        <div className="px-6 py-4 border-t border-[#DDE3EC] bg-[#F6F8FC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#315CF5] hover:bg-[#2448D8] text-white shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {isDownloadingPdf ? (
                <>
                  <Spinner size="sm" className="border-t-white" /> Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Download PDF Report
                </>
              )}
            </button>
            <button
              onClick={handleRegenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white border border-[#DDE3EC] text-[#5D6675] hover:bg-[#F3F6FF] hover:text-[#315CF5] hover:border-[#315CF5]/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-[#315CF5] ${isGenerating ? 'animate-spin' : ''}`} />
              Regenerate
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold rounded-xl bg-white border border-[#DDE3EC] text-[#08111F] hover:bg-[#F6F8FC] transition-all cursor-pointer"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
