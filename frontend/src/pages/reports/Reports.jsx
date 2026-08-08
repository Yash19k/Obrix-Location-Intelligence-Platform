import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Search, Filter, SortAsc, Eye, Download, RefreshCw, Trash2, Sparkles, Award, MapPin, ArrowRight } from 'lucide-react'
import useReportStore from '@/store/reportStore'
import Spinner from '@/components/ui/Spinner'
import ReportViewerModal from '@/components/reports/ReportViewerModal'

function getScoreBadge(scoreVal) {
  const num = parseFloat(scoreVal)
  if (isNaN(num)) return null

  if (num >= 80) {
    return {
      label: 'Strong Opportunity',
      bg: 'bg-[#E7F7E9]',
      text: 'text-[#43B96B]',
      border: 'border-[#43B96B]/30',
      scoreText: `${num.toFixed(1)} / 100`,
    }
  } else if (num >= 60) {
    return {
      label: 'Promising',
      bg: 'bg-[#E9EFFF]',
      text: 'text-[#315CF5]',
      border: 'border-[#315CF5]/30',
      scoreText: `${num.toFixed(1)} / 100`,
    }
  } else if (num >= 40) {
    return {
      label: 'Moderate',
      bg: 'bg-[#FEF3C7]',
      text: 'text-amber-800',
      border: 'border-amber-300',
      scoreText: `${num.toFixed(1)} / 100`,
    }
  } else {
    return {
      label: 'Weak',
      bg: 'bg-[#FEE2E2]',
      text: 'text-red-700',
      border: 'border-red-200',
      scoreText: `${num.toFixed(1)} / 100`,
    }
  }
}

function getGradeColor(grade) {
  const g = String(grade || 'B').toUpperCase()
  if (g.startsWith('A')) return 'text-[#43B96B]'
  if (g.startsWith('B')) return 'text-[#315CF5]'
  if (g.startsWith('C')) return 'text-amber-800'
  return 'text-red-600'
}

export default function Reports() {
  const navigate = useNavigate()
  const { reports, fetchReports, deleteReport, regenerateReport, isLoading, activeReport, setActiveReport, closeReportViewer } = useReportStore()
  
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date-desc')
  const [toastMsg, setToastMsg] = useState(null)

  useEffect(() => {
    fetchReports()
  }, [])

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [downloadingReportId, setDownloadingReportId] = useState(null)

  const handleDownloadPdf = (report) => {
    setIsDownloadingPdf(true)
    setDownloadingReportId(report.id)

    setTimeout(() => {
      try {
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
                <div class="title">Obrix Location Intelligence</div>
                <div class="subtitle">AI Business Consulting & Spatial Feasibility Report — ${bizType}</div>
              </div>
              <div>
                <span class="badge">Executive Feasibility Analytics</span>
                <div style="font-size: 11px; color: #5d6675; margin-top: 8px; font-family: monospace;">Date: ${new Date(report.created_at || Date.now()).toLocaleDateString()}</div>
              </div>
            </div>

            <div class="rec-box">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #43b96b; font-weight: bold;">Investment Recommendation</div>
                  <div class="rec-grade">GRADE ${rec.grade || 'A'} &mdash; ${rec.recommendation || 'YES'}</div>
                </div>
                <div style="font-size: 24px; font-weight: bold; color: #315cf5;">Score: ${score.toFixed(1)}/100</div>
              </div>
              <div style="font-size: 13px; color: #08111f; margin-top: 10px;">${rec.reasoning || ''}</div>
            </div>

            <div class="section">
              <div class="section-title">1. Executive Summary</div>
              <p style="font-size: 13px; line-height: 1.6; color: #08111f;">${ai.executive_summary || ''}</p>
            </div>

            <div class="section">
              <div class="section-title">2. Location Overview</div>
              <p style="font-size: 13px; line-height: 1.6; color: #08111f;">${ai.location_overview || ''}</p>
            </div>

            <div class="section">
              <div class="section-title">3. Site Readiness Interpretation</div>
              <p style="font-size: 13px; line-height: 1.6; color: #08111f;">${ai.readiness_interpretation || ''}</p>
            </div>

            <div class="grid-2">
              <div class="section">
                <div class="section-title">4. Infrastructure Analysis</div>
                <p style="font-size: 13px; line-height: 1.6; color: #08111f;">${ai.infrastructure_analysis || ''}</p>
              </div>
              <div class="section">
                <div class="section-title">5. Accessibility Analysis</div>
                <p style="font-size: 13px; line-height: 1.6; color: #08111f;">${ai.accessibility_analysis || ''}</p>
              </div>
            </div>

            <div class="section">
              <div class="section-title">6. Competitor Analysis</div>
              <p style="font-size: 13px; line-height: 1.6; color: #08111f;">${ai.competitor_analysis || ''}</p>
            </div>

            <div class="section">
              <div class="section-title">7. SWOT Analysis Matrix</div>
              <div class="grid-2">
                <div>
                  <strong style="color: #43b96b; font-size: 12px;">STRENGTHS</strong>
                  <ul>${(swot.strengths || []).map(s => `<li>${s}</li>`).join('')}</ul>
                </div>
                <div>
                  <strong style="color: #ef4444; font-size: 12px;">WEAKNESSES</strong>
                  <ul>${(swot.weaknesses || []).map(w => `<li>${w}</li>`).join('')}</ul>
                </div>
                <div style="margin-top: 10px;">
                  <strong style="color: #315cf5; font-size: 12px;">OPPORTUNITIES</strong>
                  <ul>${(swot.opportunities || []).map(o => `<li>${o}</li>`).join('')}</ul>
                </div>
                <div style="margin-top: 10px;">
                  <strong style="color: #d97706; font-size: 12px;">THREATS</strong>
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

        const iframe = document.createElement('iframe')
        iframe.style.position = 'fixed'
        iframe.style.right = '0'
        iframe.style.bottom = '0'
        iframe.style.width = '0'
        iframe.style.height = '0'
        iframe.style.border = '0'
        document.body.appendChild(iframe)

        const doc = iframe.contentWindow.document
        doc.open()
        doc.write(reportHtml)
        doc.close()

        iframe.contentWindow.onload = () => {
          iframe.contentWindow.document.title = 'Location_Report'
          iframe.contentWindow.focus()
          iframe.contentWindow.print()
          
          setIsDownloadingPdf(false)
          setDownloadingReportId(null)
          setToastMsg('PDF downloaded successfully')
          setTimeout(() => setToastMsg(null), 3000)
          
          setTimeout(() => {
            document.body.removeChild(iframe)
          }, 1000)
        }
      } catch (err) {
        setIsDownloadingPdf(false)
        setDownloadingReportId(null)
        setToastMsg('⚠ Error: ' + err.message)
        setTimeout(() => setToastMsg(null), 4000)
      }
    }, 1200)
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans relative">
      
      {/* Toast Feedback */}
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[6000] px-4 py-2 bg-[#315CF5] text-white text-xs font-bold rounded-full shadow-xl flex items-center gap-2 animate-bounce font-sans">
          <Sparkles className="w-4 h-4 text-white" /> {toastMsg}
        </div>
      )}

      {/* ── Page Header Bar ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#DDE3EC] rounded-2xl p-6 shadow-2xs relative overflow-hidden">
        <div className="space-y-1 z-10">
          <span className="text-[10px] font-mono font-bold text-[#315CF5] uppercase tracking-wider block">
            REPORT LIBRARY / AI CONSULTING
          </span>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#E9EFFF] border border-[#315CF5]/20 text-[#315CF5] flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#08111F] font-sans">
              AI Generated Consulting Reports
            </h1>
          </div>
          <p className="text-xs text-[#5D6675] font-sans font-normal leading-relaxed">
            Access and manage your McKinsey/Deloitte-style location intelligence feasibility reports.
          </p>
        </div>

        <button
          onClick={() => navigate('/analyze')}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold rounded-xl bg-[#315CF5] hover:bg-[#2448D8] text-white shadow-md transition-all duration-200 cursor-pointer shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>New Feasibility Report</span>
        </button>
      </div>

      {/* ── Filters & Search Controls Bar (Light SaaS Controls) ─────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Search Input */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A94A3]" />
          <input
            type="text"
            placeholder="Search reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-[44px] pl-10 pr-4 text-xs rounded-xl bg-white border border-[#DDE3EC] text-[#08111F] placeholder-[#8A94A3] focus:outline-none focus:ring-2 focus:ring-[#315CF5]/20 focus:border-[#315CF5] hover:border-[#315CF5]/35 transition-all font-sans font-medium shadow-2xs"
          />
        </div>

        {/* Filter Business Type */}
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5D6675]" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full h-[44px] pl-10 pr-8 text-xs rounded-xl bg-white border border-[#DDE3EC] text-[#08111F] focus:outline-none focus:ring-2 focus:ring-[#315CF5]/20 focus:border-[#315CF5] hover:border-[#315CF5]/35 transition-all font-sans font-medium appearance-none shadow-2xs cursor-pointer"
          >
            <option value="all">All Business Types</option>
            {uniqueTypes.map((t) => (
              <option key={t} value={t}>{t.toUpperCase()}</option>
            ))}
          </select>
        </div>

        {/* Sort Control */}
        <div className="relative">
          <SortAsc className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5D6675]" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full h-[44px] pl-10 pr-8 text-xs rounded-xl bg-white border border-[#DDE3EC] text-[#08111F] focus:outline-none focus:ring-2 focus:ring-[#315CF5]/20 focus:border-[#315CF5] hover:border-[#315CF5]/35 transition-all font-sans font-medium appearance-none shadow-2xs cursor-pointer"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="score-desc">Highest Score</option>
            <option value="score-asc">Lowest Score</option>
          </select>
        </div>
      </div>

      {/* ── Reports Grid / Loading / Empty State ───────────────────────────── */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-[#5D6675] font-sans">
          <Spinner size="lg" />
          <p className="text-xs font-medium mt-3 text-[#8A94A3]">Loading consulting reports...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="py-16 rounded-2xl border border-[#DDE3EC] bg-white flex flex-col items-center justify-center text-center p-8 space-y-4 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-[#E9EFFF] text-[#315CF5] border border-[#315CF5]/20 flex items-center justify-center mx-auto shadow-2xs">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="text-base font-extrabold text-[#08111F] font-sans">No consulting reports found</h3>
            <p className="text-xs text-[#5D6675] leading-relaxed">
              Generate an AI consulting report after analyzing a location on the map to build your executive report library.
            </p>
          </div>
          <button
            onClick={() => navigate('/analyze')}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#315CF5] hover:bg-[#2448D8] rounded-xl shadow-md transition-all cursor-pointer"
          >
            <span>Analyze a Location</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredReports.map((report) => {
            const dateStr = new Date(report.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
            const lat = parseFloat(report.latitude || 23.0225).toFixed(4)
            const lon = parseFloat(report.longitude || 72.5714).toFixed(4)
            const ai = report.ai_report_json || {}
            const recGrade = ai.investment_recommendation?.grade || 'B'
            const scoreVal = report.score ?? 65.0
            const scoreBadge = getScoreBadge(scoreVal)
            const gradeClass = getGradeColor(recGrade)

            return (
              <div
                key={report.id}
                onClick={() => setActiveReport(report)}
                className="group p-5 rounded-2xl bg-white border border-[#DDE3EC] hover:border-[#315CF5]/35 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4 shadow-2xs cursor-pointer relative overflow-hidden"
              >
                <div className="space-y-3">
                  {/* Top Title & Score Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-wider uppercase mb-1">
                        <span className="text-[#315CF5]">{report.business_type?.toUpperCase()}</span>
                        <span className="text-[#8A94A3]">•</span>
                        <span className={gradeClass}>GRADE {recGrade}</span>
                      </div>
                      <h3 className="text-sm font-extrabold text-[#08111F] truncate font-sans group-hover:text-[#315CF5] transition-colors leading-snug">
                        {report.title}
                      </h3>
                    </div>

                    {scoreBadge && (
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border shrink-0 ${scoreBadge.bg} ${scoreBadge.text} ${scoreBadge.border}`}>
                        ● {scoreBadge.scoreText}
                      </span>
                    )}
                  </div>

                  {/* Executive Summary Preview */}
                  <p className="text-xs text-[#5D6675] font-sans font-medium line-clamp-2 leading-relaxed">
                    {ai.executive_summary || 'Comprehensive spatial feasibility & commercial site intelligence report.'}
                  </p>

                  {/* Technical Coordinates & Date */}
                  <div className="flex items-center justify-between text-xs text-[#8A94A3] pt-1 border-t border-[#E8ECF2]/60">
                    <span className="flex items-center gap-1 font-mono font-bold text-[11px] text-[#5D6675]">
                      <MapPin className="w-3.5 h-3.5 text-[#315CF5]" />
                      {lat}° N · {lon}° E
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-[#8A94A3]">
                      {dateStr}
                    </span>
                  </div>
                </div>

                {/* Card Actions Bar */}
                <div className="pt-3 border-t border-[#E8ECF2] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setActiveReport(report); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#E9EFFF] border border-[#315CF5]/20 text-[#315CF5] hover:bg-[#315CF5] hover:text-white transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Report
                    </button>

                    <button
                      onClick={(e) => { e.stopPropagation(); handleDownloadPdf(report); }}
                      disabled={isDownloadingPdf}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-[#DDE3EC] text-[#5D6675] hover:bg-[#F3F6FF] hover:text-[#315CF5] hover:border-[#315CF5]/30 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isDownloadingPdf && downloadingReportId === report.id ? (
                        <>
                          <Spinner size="sm" className="border-t-[#315CF5]" /> PDF...
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" /> PDF
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); regenerateReport(report.id); }}
                      className="p-1.5 text-[#8A94A3] hover:text-[#315CF5] hover:bg-[#F3F6FF] rounded-lg transition-colors cursor-pointer"
                      title="Regenerate Report"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteReport(report.id); }}
                      className="p-1.5 text-[#8A94A3] hover:text-red-600 hover:bg-[#FEE2E2] rounded-lg transition-colors cursor-pointer"
                      title="Delete Report"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
