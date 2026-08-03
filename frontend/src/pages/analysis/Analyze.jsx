/**
 * Analyze — Phase 2 core experience page.
 *
 * Layout (flex-row, no absolute stacking):
 * ┌──────────────┬────────────────────────┬─────────────┐
 * │ Left Sidebar │      Leaflet Map       │  Analysis   │
 * │  (300px)     │     (flex-1 center)    │  Panel      │
 * │              │                        │ (0→380px)   │
 * └──────────────┴────────────────────────┴─────────────┘
 *
 * All three columns are flex siblings — nothing is hidden behind the map.
 * AppShell removes p-6 padding for /analyze (see AppShell.jsx).
 */

import { useState } from 'react'
import { MousePointerClick, PanelLeftClose, PanelLeftOpen, ArrowLeftRight, X, MapPin } from 'lucide-react'
import useMapStore from '@/store/mapStore'
import MapView from '@/components/map/MapView'
import MapStyleControl from '@/components/map/MapStyleControl'
import LocationSidebar from '@/components/analysis/LocationSidebar'
import AnalysisPanel from '@/components/analysis/AnalysisPanel'
import LocationComparisonModal from '@/components/analysis/LocationComparisonModal'

export default function Analyze() {
  const {
    showPanel, selectedLat, isAnalyzing,
    compareMode, compareStep, locationA, locationB, exitCompareMode, setCompareStep,
  } = useMapStore()
  // Sidebar collapsed state for tablet/small screens
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-full overflow-hidden bg-[#0b1120]">

      {/* ── Left sidebar — always rendered, never behind the map ─────────── */}
      <aside
        className="flex-shrink-0 overflow-hidden border-r border-white/[0.07]
                   bg-[#0d1526] transition-all duration-300 ease-in-out"
        style={{ width: sidebarOpen ? '300px' : '0px' }}
      >
        {/* Fixed-width inner so content doesn't squish during transition */}
        <div className="w-[300px] h-full overflow-y-auto overflow-x-visible">
          <LocationSidebar />
        </div>
      </aside>

      {/* ── Center: map + floating overlays ─────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden min-w-0">

        {/* Sidebar toggle — sits above map, always clickable */}
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="absolute top-3 left-3 z-20 flex items-center justify-center
                     w-9 h-9 rounded-xl bg-[#0d1526]/90 backdrop-blur
                     border border-white/10 text-white/50 hover:text-white
                     hover:bg-white/10 transition-all duration-150 shadow-lg"
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen
            ? <PanelLeftClose className="w-4 h-4" />
            : <PanelLeftOpen  className="w-4 h-4" />
          }
        </button>

        {/* Interactive Compare Mode Banner Overlay */}
        {compareMode && (
          <div className="absolute top-3 left-16 z-30 flex items-center gap-3 px-4 py-2 bg-[#0d1526]/95 border border-indigo-500/40 rounded-xl shadow-2xl backdrop-blur-md">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <div className="font-bold text-slate-100 flex items-center gap-1.5">
                <span>Compare Mode</span>
                <span className="px-2 py-0.2 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 font-mono">
                  {compareStep === 'select_a' ? 'Step 1 of 2' : compareStep === 'select_b' ? 'Step 2 of 2' : 'Complete'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                {compareStep === 'select_a' && 'Click anywhere on the map to set Location A.'}
                {compareStep === 'select_b' && 'Location A set! Now click anywhere on map to set Location B.'}
                {compareStep === 'complete' && 'Locations selected! Opening comparison dashboard...'}
              </p>
            </div>
            <button
              onClick={exitCompareMode}
              className="p-1 text-slate-400 hover:text-slate-200 transition-colors ml-2"
              title="Exit Compare Mode"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Right Map Controls Overlay (Map Styles Control) */}
        <div className="absolute top-3 right-3 z-[3000] flex items-center gap-2">
          <MapStyleControl />
        </div>

        {/* Leaflet map fills the entire center column */}
        <MapView />

        {/* Hint — shown until first marker is placed */}
        {!compareMode && selectedLat === null && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[2500] pointer-events-none">
            <div className="flex items-center gap-2.5 px-4 py-2.5
                            bg-[#0d1526]/95 backdrop-blur-md border border-indigo-500/30
                            rounded-full shadow-2xl whitespace-nowrap">
              <MousePointerClick className="w-4 h-4 text-indigo-400 flex-shrink-0 animate-bounce" />
              <span className="text-xs text-slate-200 font-semibold tracking-wide">
                Click anywhere on the map to place a marker
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Compare Mode Modal */}
      <LocationComparisonModal
        isOpen={compareMode && compareStep === 'complete' && !!locationA && !!locationB}
        onClose={exitCompareMode}
        primaryResult={locationA}
        secondaryResult={locationB}
      />

      {/* ── Right analysis panel — slides open by expanding width ────────── */}
      <div
        className="flex-shrink-0 overflow-hidden border-l border-white/[0.07]
                   bg-[#0d1526] transition-all duration-[380ms] ease-in-out"
        style={{ width: (showPanel || isAnalyzing) ? '380px' : '0px' }}
      >
        {/* Fixed inner width prevents content squish during transition */}
        <div className="w-[380px] h-full overflow-y-auto">
          <AnalysisPanel />
        </div>
      </div>
    </div>
  )
}
