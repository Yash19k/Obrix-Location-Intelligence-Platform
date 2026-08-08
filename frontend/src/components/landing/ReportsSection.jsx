import { useNavigate } from 'react-router-dom'
import { FileText, Download, CheckCircle2, ArrowRight, Compass, Shield } from 'lucide-react'

export default function ReportsSection() {
  const navigate = useNavigate()

  return (
    <section id="reports" className="py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#DDE3EC]">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F6F8FC] border border-[#DDE3EC] rounded-full">
            <span className="text-xs font-mono font-semibold tracking-wider text-[#315CF5] uppercase">
              REPORTS
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#08111F] tracking-tight font-sans">
            Turn analysis into something you can present.
          </h2>

          <p className="text-base sm:text-lg text-[#5D6675] font-sans">
            Generate executive site feasibility reports structured for stakeholders, investors, and location committees.
          </p>
        </div>

        {/* Polished Document / Consulting Deliverable Preview */}
        <div className="max-w-4xl mx-auto bg-[#F6F8FC] border border-[#DDE3EC] rounded-2xl p-6 sm:p-10 shadow-lg">
          <div className="bg-white border border-[#DDE3EC] rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
            {/* Report Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#DDE3EC] gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#315CF5] text-white flex items-center justify-center font-bold">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-mono font-semibold text-[#8A94A3] block">
                    OBRIX EXECUTIVE REPORT · REF-2026-042
                  </span>
                  <h3 className="text-xl font-extrabold text-[#08111F] font-sans">
                    Commercial Location Feasibility Study
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/reports')}
                  className="inline-flex items-center gap-1.5 bg-[#F6F8FC] hover:bg-[#E2E8F0] text-[#08111F] border border-[#DDE3EC] text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" /> View Report
                </button>
                <button
                  onClick={() => navigate('/reports')}
                  className="inline-flex items-center gap-1.5 bg-[#315CF5] hover:bg-[#2448D8] text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Export PDF
                </button>
              </div>
            </div>

            {/* Document Table of Contents / Executive Sections Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-sans">
              <div className="p-4 bg-[#F8FAFC] border border-[#DDE3EC] rounded-xl space-y-2">
                <span className="text-[11px] font-mono text-[#315CF5] font-bold">SECTION 01</span>
                <h4 className="font-bold text-[#08111F]">1. Executive Summary</h4>
                <p className="text-xs text-[#5D6675]">
                  Overview of site evaluation score (84/100), key feasibility drivers, and investment thesis.
                </p>
              </div>

              <div className="p-4 bg-[#F8FAFC] border border-[#DDE3EC] rounded-xl space-y-2">
                <span className="text-[11px] font-mono text-[#315CF5] font-bold">SECTION 02</span>
                <h4 className="font-bold text-[#08111F]">2. Location & Infrastructure</h4>
                <p className="text-xs text-[#5D6675]">
                  Road hierarchy, arterial accessibility (91/100), nearby transit, and parking capacity analysis.
                </p>
              </div>

              <div className="p-4 bg-[#F8FAFC] border border-[#DDE3EC] rounded-xl space-y-2">
                <span className="text-[11px] font-mono text-[#315CF5] font-bold">SECTION 03</span>
                <h4 className="font-bold text-[#08111F]">3. Competition & Catchment</h4>
                <p className="text-xs text-[#5D6675]">
                  Detailed spatial mapping of 3 competing facilities within 1000m radius and catchment volume.
                </p>
              </div>

              <div className="p-4 bg-[#F8FAFC] border border-[#DDE3EC] rounded-xl space-y-2">
                <span className="text-[11px] font-mono text-[#315CF5] font-bold">SECTION 04</span>
                <h4 className="font-bold text-[#08111F]">4. SWOT & Final Verdict</h4>
                <p className="text-xs text-[#5D6675]">
                  Strengths, Weaknesses, Opportunities, Threats and final site acquisition recommendation.
                </p>
              </div>
            </div>

            {/* Document Signature / Verdict Line */}
            <div className="p-4 bg-[#E7F7E9] border border-[#43B96B]/30 rounded-xl flex items-center justify-between text-xs font-sans text-[#08111F]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#43B96B]" />
                <span><strong>Verdict:</strong> Approved for commercial site acquisition.</span>
              </div>
              <span className="font-mono text-[#43B96B] font-bold">FEASIBILITY PASS</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
