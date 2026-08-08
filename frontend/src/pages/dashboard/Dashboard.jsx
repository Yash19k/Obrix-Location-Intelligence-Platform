import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Sparkles, ArrowRight, Compass } from 'lucide-react'
import useAnalysisStore from '@/store/analysisStore'
import useLocationStore from '@/store/locationStore'
import useReportStore from '@/store/reportStore'
import useAuthStore from '@/store/authStore'

import DashboardMetrics from '@/components/dashboard/DashboardMetrics'
import RecentAnalysesTable from '@/components/dashboard/RecentAnalysesTable'
import TopOpportunitySpotlight from '@/components/dashboard/TopOpportunitySpotlight'
import AskObrixModule from '@/components/dashboard/AskObrixModule'
import SavedLocationsPreview from '@/components/dashboard/SavedLocationsPreview'
import ReportsPreview from '@/components/dashboard/ReportsPreview'
import DashboardQuickActions from '@/components/dashboard/DashboardQuickActions'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { requests, fetchList, isLoading: isAnalysisLoading } = useAnalysisStore()
  const { savedLocations, fetchLocations, isLoading: isLocLoading } = useLocationStore()
  const { reports, fetchReports, isLoading: isRepLoading } = useReportStore()

  useEffect(() => {
    fetchList()
    fetchLocations()
    fetchReports()
  }, [])

  return (
    <div className="max-w-7xl mx-auto space-y-8 font-sans pb-12 animate-fade-in">
      {/* ── 1. Workspace Header / Hero Banner ────────────────────────────────── */}
      <div className="bg-white border border-[#DDE3EC] rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Faint subtle grid background pattern */}
        <div className="absolute inset-0 bg-gis-grid opacity-50 pointer-events-none" />

        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F6F8FC] border border-[#DDE3EC] rounded-full">
            <span className="w-2 h-2 rounded-full bg-[#315CF5] animate-pulse" />
            <span className="text-xs font-mono font-bold tracking-wider text-[#315CF5] uppercase">
              LOCATION INTELLIGENCE WORKSPACE
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#08111F] tracking-tight font-sans">
            Your location intelligence,<br className="hidden sm:inline" /> at a glance.
          </h1>

          <p className="text-sm sm:text-base text-[#5D6675] font-sans font-normal leading-relaxed">
            Review recent site analyses, revisit bookmarked opportunities, and continue evaluating new commercial locations.
          </p>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <button
            onClick={() => navigate('/analyze')}
            id="dashboard-hero-analyze-btn"
            className="inline-flex items-center justify-center gap-2 bg-[#315CF5] hover:bg-[#2448D8] text-white text-sm font-semibold px-6 py-3 rounded-full transition-all duration-200 shadow-md hover:-translate-y-0.5 cursor-pointer"
          >
            <span>Analyze New Location</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => navigate('/ask-obrix')}
            id="dashboard-hero-ask-btn"
            className="inline-flex items-center justify-center gap-2 bg-[#E9EFFF] hover:bg-[#315CF5] text-[#315CF5] hover:text-white border border-[#315CF5]/20 text-sm font-semibold px-5 py-3 rounded-full transition-all duration-200 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ask Obrix</span>
          </button>
        </div>
      </div>

      {/* ── 2. Top Summary Metrics ──────────────────────────────────────────── */}
      <DashboardMetrics
        totalAnalyses={requests.length}
        totalSaved={savedLocations.length}
        totalReports={reports.length}
        isLoading={isAnalysisLoading}
      />

      {/* ── 3. Top Opportunity Spotlight (If Completed Analyses Exist) ──────── */}
      <TopOpportunitySpotlight requests={requests} />

      {/* ── 4. Main Section Grid: Recent Analyses & Ask Obrix Module ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <RecentAnalysesTable requests={requests} isLoading={isAnalysisLoading} />
        </div>
        <div className="lg:col-span-4">
          <AskObrixModule />
        </div>
      </div>

      {/* ── 5. Lower Section Grid: Saved Locations & Recent Reports ────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <SavedLocationsPreview savedLocations={savedLocations} isLoading={isLocLoading} />
        <ReportsPreview reports={reports} isLoading={isRepLoading} />
      </div>

      {/* ── 6. Quick Platform Actions ───────────────────────────────────────── */}
      <DashboardQuickActions />
    </div>
  )
}
