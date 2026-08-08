import { useNavigate } from 'react-router-dom'
import { MapPin, ArrowRight, Bookmark, GitCompare, MessageSquareText, FileText, CheckCircle2, AlertTriangle, Layers, Navigation } from 'lucide-react'

export default function AnalyzeShowcase() {
  const navigate = useNavigate()

  return (
    <section id="product" className="py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#DDE3EC]">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F6F8FC] border border-[#DDE3EC] rounded-full">
            <span className="text-xs font-mono font-semibold tracking-wider text-[#315CF5] uppercase">
              SITE INTELLIGENCE
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#08111F] tracking-tight font-sans">
            See what surrounds your opportunity.
          </h2>

          <p className="text-base sm:text-lg text-[#5D6675] font-sans">
            Turn hundreds of nearby geographic signals into an understandable view of site feasibility.
          </p>
        </div>

        {/* Realistic SaaS Application Mockup Window */}
        <div className="bg-white border border-[#DDE3EC] rounded-2xl shadow-2xl overflow-hidden">
          {/* Mockup Window Titlebar */}
          <div className="bg-[#F6F8FC] border-b border-[#DDE3EC] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#E2E8F0]" />
                <span className="w-3 h-3 rounded-full bg-[#E2E8F0]" />
                <span className="w-3 h-3 rounded-full bg-[#E2E8F0]" />
              </div>
              <span className="text-xs font-mono text-[#8A94A3] ml-3">
                obrix.app/analyze/req-042
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#5D6675]">
              <span className="bg-[#E7F7E9] text-[#43B96B] font-semibold px-2 py-0.5 rounded border border-[#43B96B]/20">
                LIVE ANALYTICS ENGINE
              </span>
            </div>
          </div>

          {/* SaaS Interface Body Grid (2 Columns: Map on Left, Analysis Panel on Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
            {/* LEFT: Large Interactive Map Surface */}
            <div className="lg:col-span-7 bg-[#F8FAFC] relative overflow-hidden border-b lg:border-b-0 lg:border-r border-[#DDE3EC] min-h-[360px] flex flex-col">
              {/* Map Top Bar */}
              <div className="p-3 bg-white/80 backdrop-blur border-b border-[#DDE3EC] flex items-center justify-between z-10 text-xs font-mono">
                <div className="flex items-center gap-2 text-[#08111F] font-semibold">
                  <Navigation className="w-3.5 h-3.5 text-[#315CF5]" />
                  <span>Candidate Site: Satellite, Ahmedabad</span>
                </div>
                <div className="text-[#8A94A3]">
                  BUFFER: 1000m
                </div>
              </div>

              {/* Map Vector Graphic */}
              <div className="relative flex-1 bg-gis-grid-dense flex items-center justify-center">
                {/* SVG Vector Map Roads */}
                <svg className="absolute inset-0 w-full h-full text-[#CBD5E1]" stroke="currentColor">
                  <path d="M 0 200 Q 250 150 600 220" fill="none" strokeWidth="10" stroke="#E2E8F0" />
                  <path d="M 0 200 Q 250 150 600 220" fill="none" strokeWidth="6" stroke="#FFFFFF" />
                  <path d="M 300 0 L 320 500" fill="none" strokeWidth="8" stroke="#E2E8F0" />
                  <path d="M 300 0 L 320 500" fill="none" strokeWidth="5" stroke="#FFFFFF" />
                  <circle cx="310" cy="210" r="140" fill="rgba(49,92,245,0.04)" stroke="#315CF5" strokeDasharray="4 4" strokeWidth="1.5" />
                </svg>

                {/* Candidate Marker */}
                <div className="absolute top-[48%] left-[50%] -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full bg-[#315CF5] text-white flex items-center justify-center shadow-lg border-2 border-white">
                    <MapPin className="w-4 h-4 fill-current" />
                  </div>
                  <span className="mt-1 bg-[#08111F] text-white text-[10px] font-mono px-2 py-0.5 rounded shadow">
                    SITE / 042 (84/100)
                  </span>
                </div>

                {/* Nearby POI Labels on Map */}
                <div className="absolute top-[28%] left-[25%] bg-white border border-[#DDE3EC] rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-[#08111F] shadow-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#315CF5]" /> Hospital
                </div>

                <div className="absolute top-[65%] left-[32%] bg-white border border-[#DDE3EC] rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-[#08111F] shadow-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#315CF5]" /> Transit Metro
                </div>

                <div className="absolute top-[32%] left-[68%] bg-white border border-[#DDE3EC] rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-[#08111F] shadow-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#315CF5]" /> Retail Hub
                </div>

                {/* Map Bottom Coordinates Overlay */}
                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur border border-[#DDE3EC] px-3 py-1.5 rounded-lg text-[11px] font-mono text-[#5D6675]">
                  LAT: 23.0225° N | LNG: 72.5714° E | ELEV: 53m
                </div>
              </div>
            </div>

            {/* RIGHT: Analysis Results Panel */}
            <div className="lg:col-span-5 p-6 bg-white flex flex-col justify-between space-y-6">
              <div>
                {/* Header & Main Score */}
                <div className="flex items-center justify-between pb-4 border-b border-[#DDE3EC]">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-[#8A94A3] uppercase tracking-wider">
                      FEASIBILITY REPORT
                    </span>
                    <h3 className="text-xl font-extrabold text-[#08111F] font-sans">
                      Pharmacy Feasibility
                    </h3>
                  </div>

                  <div className="text-right">
                    <div className="flex items-baseline gap-1 justify-end">
                      <span className="text-3xl font-extrabold text-[#08111F] font-mono">84</span>
                      <span className="text-xs font-mono text-[#8A94A3]">/ 100</span>
                    </div>
                    <span className="inline-block bg-[#E7F7E9] text-[#43B96B] text-[11px] font-semibold px-2 py-0.5 rounded-full border border-[#43B96B]/20">
                      Strong Opportunity
                    </span>
                  </div>
                </div>

                {/* Factor Scores Breakdown */}
                <div className="py-4 space-y-3">
                  <h4 className="text-xs font-mono font-bold text-[#5D6675] uppercase">
                    Factor Score Index
                  </h4>

                  {[
                    { label: 'Accessibility', val: 91 },
                    { label: 'Catchment', val: 87 },
                    { label: 'Competition', val: 74 },
                    { label: 'Infrastructure', val: 82 },
                    { label: 'Environment', val: 86 },
                  ].map((factor) => (
                    <div key={factor.label} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-[#08111F]">
                        <span>{factor.label}</span>
                        <span className="font-mono font-semibold">{factor.val}</span>
                      </div>
                      <div className="h-2 w-full bg-[#F1F5F9] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#315CF5] rounded-full"
                          style={{ width: `${factor.val}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Top Positives & Risks */}
                <div className="py-3 space-y-2 border-t border-[#DDE3EC]">
                  <div className="flex items-start gap-2 text-xs text-[#08111F]">
                    <CheckCircle2 className="w-4 h-4 text-[#43B96B] shrink-0 mt-0.5" />
                    <span><strong>Top Positive:</strong> High density of healthcare amenities (3 hospitals within 800m).</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-[#08111F]">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span><strong>Top Risk:</strong> Moderate pharmacy competition along main arterial road.</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="pt-4 border-t border-[#DDE3EC] grid grid-cols-2 gap-2">
                <button
                  onClick={() => navigate('/analyze')}
                  className="flex items-center justify-center gap-1.5 bg-[#F6F8FC] hover:bg-[#E2E8F0] text-[#08111F] border border-[#DDE3EC] text-xs font-semibold py-2 px-3 rounded-lg transition-colors cursor-pointer"
                >
                  <Bookmark className="w-3.5 h-3.5" /> Save Location
                </button>
                <button
                  onClick={() => navigate('/analyze')}
                  className="flex items-center justify-center gap-1.5 bg-[#F6F8FC] hover:bg-[#E2E8F0] text-[#08111F] border border-[#DDE3EC] text-xs font-semibold py-2 px-3 rounded-lg transition-colors cursor-pointer"
                >
                  <GitCompare className="w-3.5 h-3.5" /> Compare
                </button>
                <button
                  onClick={() => navigate('/ask-obrix')}
                  className="flex items-center justify-center gap-1.5 bg-[#315CF5] hover:bg-[#2448D8] text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors cursor-pointer"
                >
                  <MessageSquareText className="w-3.5 h-3.5" /> Ask Obrix
                </button>
                <button
                  onClick={() => navigate('/reports')}
                  className="flex items-center justify-center gap-1.5 bg-[#08111F] hover:bg-[#1E293B] text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" /> Generate Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
