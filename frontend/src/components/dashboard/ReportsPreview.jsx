import { useNavigate } from 'react-router-dom'
import { FileText, ArrowRight, Compass } from 'lucide-react'

export default function ReportsPreview({ reports, isLoading }) {
  const navigate = useNavigate()

  return (
    <div className="bg-white border border-[#DDE3EC] rounded-2xl p-5 shadow-2xs font-sans flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F6F8FC] border border-[#DDE3EC] text-[#08111F] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#08111F]">Recent Reports</h3>
              <p className="text-xs text-[#5D6675]">Generated deliverables</p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-[#8A94A3] bg-[#F6F8FC] px-2 py-0.5 rounded border border-[#DDE3EC]">
            {reports.length} DOCS
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-2 py-2">
            <div className="h-12 bg-[#F6F8FC] rounded-xl animate-pulse" />
            <div className="h-12 bg-[#F6F8FC] rounded-xl animate-pulse" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-6 px-3 bg-[#F6F8FC] border border-[#DDE3EC] rounded-xl my-2">
            <p className="text-xs text-[#5D6675] font-medium">No reports generated yet.</p>
            <p className="text-[11px] text-[#8A94A3] mt-0.5">Generate 13-section AI reports after analyzing a site.</p>
          </div>
        ) : (
          <div className="space-y-2 my-2">
            {reports.slice(0, 3).map((rep) => {
              const formattedBiz = rep.business_type
                ? rep.business_type.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                : 'Executive Study'

              return (
                <div
                  key={rep.id}
                  onClick={() => navigate('/reports')}
                  className="flex items-center justify-between p-3 bg-[#F6F8FC] hover:bg-[#E9EFFF]/60 border border-[#DDE3EC] hover:border-[#315CF5]/30 rounded-xl transition-all duration-150 cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-white border border-[#DDE3EC] text-[#315CF5] flex items-center justify-center shrink-0">
                      <Compass className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-[#08111F] truncate block font-sans">
                        {rep.title || `${formattedBiz} Feasibility`}
                      </span>
                      <span className="text-[10px] text-[#5D6675] font-mono block">
                        {formattedBiz}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {rep.score && (
                      <span className="text-xs font-mono font-bold text-[#315CF5] bg-[#E9EFFF] px-2 py-0.5 rounded-full border border-[#315CF5]/20">
                        {Math.round(parseFloat(rep.score))} / 100
                      </span>
                    )}
                    <ArrowRight className="w-3.5 h-3.5 text-[#8A94A3] group-hover:text-[#315CF5] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <button
        onClick={() => navigate('/reports')}
        className="mt-4 pt-3 border-t border-[#DDE3EC] text-xs font-semibold text-[#315CF5] hover:text-[#2448D8] flex items-center justify-between transition-colors cursor-pointer w-full"
      >
        <span>View all reports</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
