import { useState } from 'react'
import { MousePointerClick, ArrowLeftRight, X } from 'lucide-react'
import useMapStore from '@/store/mapStore'
import MapView from '@/components/map/MapView'
import MapStyleControl from '@/components/map/MapStyleControl'
import LocationSidebar from '@/components/analysis/LocationSidebar'
import AnalysisPanel from '@/components/analysis/AnalysisPanel'
import LocationComparisonModal from '@/components/analysis/LocationComparisonModal'
import ObrixAIWorkspace from '@/components/ai/ObrixAIWorkspace'

export default function Analyze() {
  const {
    showPanel, selectedLat, isAnalyzing, analysisResult, analysisError,
    compareMode, compareStep, locationA, locationB, exitCompareMode
  } = useMapStore()

  const hasResultOrActive = showPanel || isAnalyzing || analysisResult !== null || analysisError !== null

  return (
    <div className="flex h-full overflow-hidden bg-[#F6F8FC] font-sans relative">

      {/* ── 1. LEFT CONTROL SIDEBAR (~370px permanent width) ──────────────── */}
      <aside className="w-[370px] flex-shrink-0 border-r border-[#DDE3EC] bg-white h-full overflow-hidden z-20 flex flex-col">
        <LocationSidebar />
      </aside>

      {/* ── 2. CENTER MAP CANVAS (Flexible middle column) ─────────────────── */}
      <div className="flex-1 relative overflow-hidden h-full min-w-0 bg-[#F6F8FC]">

        {/* Interactive Compare Mode Banner Overlay */}
        {compareMode && (
          <div className="absolute top-4 left-4 z-[3000] flex items-center gap-3 px-4 py-2.5 bg-white/95 border border-[#315CF5]/40 rounded-2xl shadow-xl backdrop-blur-md text-xs font-sans">
            <div className="p-1.5 rounded-lg bg-[#E9EFFF] text-[#315CF5]">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-[#08111F] flex items-center gap-2">
                <span>Compare Mode</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#E9EFFF] text-[#315CF5] font-mono font-bold">
                  {compareStep === 'select_a' ? 'Step 1 of 2' : compareStep === 'select_b' ? 'Step 2 of 2' : 'Complete'}
                </span>
              </div>
              <p className="text-[11px] text-[#5D6675]">
                {compareStep === 'select_a' && 'Click anywhere on the map to set Location A.'}
                {compareStep === 'select_b' && 'Location A set! Now click anywhere on the map to set Location B.'}
                {compareStep === 'complete' && 'Locations selected! Opening comparison dashboard...'}
              </p>
            </div>
            <button
              onClick={exitCompareMode}
              className="p-1 text-[#8A94A3] hover:text-[#08111F] transition-colors ml-2 cursor-pointer"
              title="Exit Compare Mode"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Right Map Tile Layer Controls */}
        <div className="absolute top-4 right-4 z-[3000]">
          <MapStyleControl />
        </div>

        {/* Leaflet Map Canvas */}
        <MapView />

        {/* Map Click Instruction Hint */}
        {!compareMode && selectedLat === null && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[2500] pointer-events-none">
            <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white/95 backdrop-blur-md border border-[#DDE3EC] rounded-full shadow-lg text-xs text-[#08111F] font-bold">
              <MousePointerClick className="w-4 h-4 text-[#315CF5] animate-bounce shrink-0" />
              <span>Click anywhere on the map or search to place a candidate site pin</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Interactive Compare Mode Modal ───────────────────────────────── */}
      <LocationComparisonModal
        isOpen={compareMode && compareStep === 'complete' && !!locationA && !!locationB}
        onClose={exitCompareMode}
        primaryResult={locationA}
        secondaryResult={locationB}
      />

      {/* ── Obrix AI Location Consultant Workspace ─────────────────────── */}
      <ObrixAIWorkspace />

      {/* ── 3. RIGHT ANALYSIS RESULT PANEL (~450px width when active) ────── */}
      <div
        className="flex-shrink-0 overflow-hidden border-l border-[#DDE3EC] bg-white transition-all duration-[350ms] ease-in-out z-20 h-full"
        style={{ width: hasResultOrActive ? '450px' : '0px' }}
      >
        <div className="w-[450px] h-full overflow-y-auto">
          <AnalysisPanel />
        </div>
      </div>
    </div>
  )
}
