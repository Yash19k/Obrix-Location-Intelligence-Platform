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
import { MousePointerClick, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import useMapStore from '@/store/mapStore'
import MapView from '@/components/map/MapView'
import LocationSidebar from '@/components/analysis/LocationSidebar'
import AnalysisPanel from '@/components/analysis/AnalysisPanel'

export default function Analyze() {
  const { showPanel, selectedLat } = useMapStore()
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

        {/* Leaflet map fills the entire center column */}
        <MapView />

        {/* Hint — shown until first marker is placed */}
        {selectedLat === null && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
            <div className="flex items-center gap-2.5 px-4 py-2.5
                            bg-[#0d1526]/90 backdrop-blur border border-white/10
                            rounded-full shadow-lg whitespace-nowrap">
              <MousePointerClick className="w-4 h-4 text-brand-400 flex-shrink-0" />
              <span className="text-xs text-white/60 font-medium">
                Click anywhere on the map to place a marker
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Right analysis panel — slides open by expanding width ────────── */}
      <div
        className="flex-shrink-0 overflow-hidden border-l border-white/[0.07]
                   bg-[#0d1526] transition-all duration-[380ms] ease-in-out"
        style={{ width: showPanel ? '380px' : '0px' }}
      >
        {/* Fixed inner width prevents content squish during transition */}
        <div className="w-[380px] h-full overflow-y-auto">
          <AnalysisPanel />
        </div>
      </div>
    </div>
  )
}
