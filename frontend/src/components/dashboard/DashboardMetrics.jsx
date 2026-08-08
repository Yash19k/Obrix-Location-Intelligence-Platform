import { BarChart3, Bookmark, FileText } from 'lucide-react'

export default function DashboardMetrics({ totalAnalyses, totalSaved, totalReports, isLoading }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans">
      {/* Total Analyses Metric */}
      <div className="bg-white border border-[#DDE3EC] rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all duration-200 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-mono font-semibold tracking-wider text-[#8A94A3] uppercase mb-1">
            ANALYSES
          </div>
          <div className="text-3xl font-extrabold text-[#08111F] font-sans">
            {isLoading ? '...' : totalAnalyses}
          </div>
          <div className="text-xs text-[#5D6675] mt-1 font-medium">
            Evaluated sites
          </div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-[#E9EFFF] text-[#315CF5] flex items-center justify-center shrink-0">
          <BarChart3 className="w-6 h-6" />
        </div>
      </div>

      {/* Saved Locations Metric */}
      <div className="bg-white border border-[#DDE3EC] rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all duration-200 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-mono font-semibold tracking-wider text-[#8A94A3] uppercase mb-1">
            SAVED LOCATIONS
          </div>
          <div className="text-3xl font-extrabold text-[#08111F] font-sans">
            {isLoading ? '...' : totalSaved}
          </div>
          <div className="text-xs text-[#5D6675] mt-1 font-medium">
            Bookmarked opportunities
          </div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-[#E7F7E9] text-[#43B96B] flex items-center justify-center shrink-0">
          <Bookmark className="w-6 h-6" />
        </div>
      </div>

      {/* Reports Metric */}
      <div className="bg-white border border-[#DDE3EC] rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all duration-200 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-mono font-semibold tracking-wider text-[#8A94A3] uppercase mb-1">
            REPORTS
          </div>
          <div className="text-3xl font-extrabold text-[#08111F] font-sans">
            {isLoading ? '...' : totalReports}
          </div>
          <div className="text-xs text-[#5D6675] mt-1 font-medium">
            Generated deliverables
          </div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-[#F6F8FC] border border-[#DDE3EC] text-[#08111F] flex items-center justify-center shrink-0">
          <FileText className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}
