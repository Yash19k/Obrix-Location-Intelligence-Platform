import { useEffect, useState } from 'react'
import { FileText, Search, Filter, SortAsc, Eye, Download, RefreshCw, Trash2, Sparkles, AlertCircle, Award, MapPin } from 'lucide-react'
import useReportStore from '@/store/reportStore'
import Spinner from '@/components/ui/Spinner'
import ReportViewerModal from '@/components/reports/ReportViewerModal'

export default function Reports() {
  const { reports, fetchReports, deleteReport, regenerateReport, isLoading, activeReport, setActiveReport, closeReportViewer } = useReportStore()
  
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date-desc')
  const [toastMsg, setToastMsg] = useState(null)

  useEffect(() => {
    fetchReports()
  }, [])

  const handleDownloadPdf = (report) => {
    const ai = report.ai_report_json || {}
    const bizType = (report.business_type || 'retail').toUpperCase()
    const lat = parseFloat(report.latitude || 23.0225).toFixed(4)
    const lon = parseFloat(report.longitude || 72.5714).toFixed(4)
    const score = Number(report.score || 65.0)

    const swot = ai.swot || { strengths: [], weaknesses: [], opportunities: [], threats: [] }
    const risks = ai.risk_assessment || {}
    const rec = ai.investment_recommendation || { grade: 'B', recommendation: 'MAYBE', reasoning: 'Moderate readiness.' }
    const strat = ai.business_strategy || { marketing_ideas: [], business_improvements: [] }

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
          <div class="section-title">2. Location Overview</div>
          <p style="font-size: 13px; line-height: 1.6; color: #cbd5e1;">${ai.location_overview || ''}</p>
        </div>

        <div class="section">
          <div class="section-title">3. Site Readiness Interpretation</div>
          <p style="font-size: 13px; line-height: 1.6; color: #cbd5e1;">${ai.readiness_interpretation || ''}</p>
        </div>

        <div class="grid-2">
          <div class="section">
            <div class="section-title">4. Infrastructure Analysis</div>
            <p style="font-size: 13px; line-height: 1.6; color: #cbd5e1;">${ai.infrastructure_analysis || ''}</p>
          </div>
          <div class="section">
            <div class="section-title">5. Accessibility Analysis</div>
            <p style="font-size: 13px; line-height: 1.6; color: #cbd5e1;">${ai.accessibility_analysis || ''}</p>
          </div>
        </div>

        <div class="section">
          <div class="section-title">6. Competitor Analysis</div>
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
            <li><strong>Business Risks:</strong> ${risks.business_risks || 'Standard risks.'}</li>
            <li><strong>Accessibility Risks:</strong> ${risks.accessibility_risks || 'Traffic delay risk.'}</li>
          </ul>
        </div>

        <div class="footer">
          Obrix Spatial Intelligence Engine &bull; Confidential Business Consulting Report
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

  // Filter and Sort logic
  const filteredReports = reports
    .filter((r) => {
      const matchSearch = r.title.toLowerCase().includes(search.toLowerCase())
      const matchType = typeFilter === 'all' || r.business_type === typeFilter
      return matchSearch && matchType
    })
    .sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.created_at) - new Date(a.created_at)
      if (sortBy === 'date-asc') return new Date(a.created_at) - new Date(b.created_at)
      if (sortBy === 'score-desc') return b.score - a.score
      if (sortBy === 'score-asc') return a.score - b.score
      return a.title.localeCompare(b.title)
    })

  const uniqueTypes = Array.from(new Set(reports.map((r) => r.business_type).filter(Boolean)))

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      
      {/* Toast Feedback */}
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[6000] px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4" /> {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-100">AI Generated Consulting Reports</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Access and manage your McKinsey/Deloitte-style location intelligence feasibility reports
          </p>
        </div>
      </div>

      {/* Filters & Actions Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-900 border border-white/10 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Filter Type */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-900 border border-white/10 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
            style={{ colorScheme: 'dark' }}
          >
            <option value="all">All Business Types</option>
            {uniqueTypes.map((t) => (
              <option key={t} value={t}>{t.toUpperCase()}</option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="relative">
          <SortAsc className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-900 border border-white/10 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
            style={{ colorScheme: 'dark' }}
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="score-desc">Highest Score</option>
            <option value="score-asc">Lowest Score</option>
          </select>
        </div>
      </div>

      {/* Reports Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Spinner size="lg" />
          <p className="text-xs mt-3">Loading reports...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="py-20 rounded-2xl border border-white/5 bg-slate-900/40 flex flex-col items-center justify-center text-center p-6 space-y-3">
          <div className="p-4 rounded-full bg-slate-800/80 text-slate-500 border border-white/5">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200">No Reports Found</h3>
          <p className="text-xs text-slate-400 max-w-md">
            Go to the Analyze page, run a spatial feasibility check, and click "Generate AI Report" to create consulting reports.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((report) => {
            const dateStr = new Date(report.created_at).toLocaleDateString()
            const lat = parseFloat(report.latitude || 23.0225).toFixed(3)
            const lon = parseFloat(report.longitude || 72.5714).toFixed(3)
            const ai = report.ai_report_json || {}
            const recGrade = ai.investment_recommendation?.grade || 'B'

            return (
              <div
                key={report.id}
                className="group p-5 rounded-2xl bg-slate-900/60 border border-white/10 hover:border-indigo-500/40 hover:bg-slate-900/90 transition-all flex flex-col justify-between space-y-4 shadow-lg"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-100 truncate group-hover:text-indigo-400 transition-colors">
                        {report.title}
                      </h3>
                      <span className="text-[10px] font-bold text-indigo-400 tracking-wider">
                        {report.business_type?.toUpperCase()} &bull; GRADE {recGrade}
                      </span>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Award className="w-3 h-3" /> {report.score?.toFixed(1) ?? '65.0'}/100
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2">
                    {ai.executive_summary || 'No summary available.'}
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-500 font-mono text-[10px] pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-indigo-400" /> {lat}, {lon}
                    </span>
                    <span>{dateStr}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setActiveReport(report)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    <button
                      onClick={() => handleDownloadPdf(report)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" /> PDF
                    </button>
                    <button
                      onClick={() => regenerateReport(report.id)}
                      className="p-1.5 text-slate-500 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
                      title="Regenerate Report"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => deleteReport(report.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Delete Report"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Report Viewer Modal */}
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
