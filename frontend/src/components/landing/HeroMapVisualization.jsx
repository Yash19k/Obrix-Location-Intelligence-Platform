import { useState, useEffect } from 'react'
import { MapPin, Navigation, Building2, Crosshair, Sparkles, CheckCircle2 } from 'lucide-react'

export default function HeroMapVisualization() {
  const [score, setScore] = useState(0)
  const [animReady, setAnimReady] = useState(false)

  useEffect(() => {
    // Trigger staggered entrance animations
    const timer = setTimeout(() => {
      setAnimReady(true)
    }, 100)

    // Smooth score count-up to 84
    let current = 0
    const scoreInterval = setInterval(() => {
      current += 2
      if (current >= 84) {
        setScore(84)
        clearInterval(scoreInterval)
      } else {
        setScore(current)
      }
    }, 25)

    return () => {
      clearTimeout(timer)
      clearInterval(scoreInterval)
    }
  }, [])

  return (
    <div className="relative w-full max-w-xl mx-auto lg:max-w-none">
      {/* Background soft pale green radial glow behind candidate site */}
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-[#43B96B]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card — Light Theme */}
      <div
        className={`relative bg-white border border-[#DDE3EC] rounded-2xl shadow-xl overflow-hidden transition-all duration-700 transform ${
          animReady ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
        }`}
      >
        {/* Top Header Bar of Map Container */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#F6F8FC] border-b border-[#DDE3EC] text-xs font-mono text-[#8A94A3]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#43B96B] animate-pulse" />
            <span className="font-semibold text-[#08111F]">SITE / 042</span>
            <span className="text-[#8A94A3]">·</span>
            <span>23.0225° N, 72.5714° E</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-[#E9EFFF] text-[#315CF5] font-semibold px-2 py-0.5 rounded text-[10px]">
              1000m RADIUS
            </span>
            <span className="text-[#8A94A3]">OSM DATA</span>
          </div>
        </div>

        {/* Map Canvas Layer */}
        <div className="relative h-[380px] sm:h-[420px] bg-[#F8FAFC] overflow-hidden select-none">
          {/* Subtle GIS Map Grid lines */}
          <div className="absolute inset-0 bg-gis-grid-dense opacity-80" />

          {/* Stylized Vector Map Roads and Topography */}
          <svg className="absolute inset-0 w-full h-full text-[#E2E8F0]" stroke="currentColor">
            {/* Primary Arterial Road */}
            <path d="M -50 160 Q 150 180 320 120 T 650 90" fill="none" strokeWidth="12" stroke="#E2E8F0" />
            <path d="M -50 160 Q 150 180 320 120 T 650 90" fill="none" strokeWidth="8" stroke="#FFFFFF" />

            {/* Secondary Road */}
            <path d="M 220 -20 L 250 450" fill="none" strokeWidth="8" stroke="#E2E8F0" />
            <path d="M 220 -20 L 250 450" fill="none" strokeWidth="5" stroke="#FFFFFF" />

            {/* Connecting Loop */}
            <path d="M 120 300 Q 220 250 380 320" fill="none" strokeWidth="6" stroke="#E2E8F0" />
            <path d="M 120 300 Q 220 250 380 320" fill="none" strokeWidth="3" stroke="#FFFFFF" />

            {/* Subtle Building Footprints */}
            <rect x="80" y="80" width="35" height="40" rx="3" fill="#EDF2F7" stroke="#CBD5E1" strokeWidth="1" />
            <rect x="130" y="70" width="45" height="30" rx="3" fill="#EDF2F7" stroke="#CBD5E1" strokeWidth="1" />
            <rect x="70" y="220" width="50" height="35" rx="3" fill="#EDF2F7" stroke="#CBD5E1" strokeWidth="1" />
            <rect x="330" y="160" width="40" height="60" rx="3" fill="#EDF2F7" stroke="#CBD5E1" strokeWidth="1" />
            <rect x="390" y="210" width="30" height="30" rx="3" fill="#EDF2F7" stroke="#CBD5E1" strokeWidth="1" />
          </svg>

          {/* Dotted Buffer Measurement Radius Line */}
          <div className="absolute top-[48%] left-[42%] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            {/* Outer expanding radius ring */}
            <div className="w-[260px] h-[260px] rounded-full border-2 border-dashed border-[#315CF5]/30 bg-[#315CF5]/5 flex items-center justify-center animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] opacity-30" />
            <div className="absolute top-0 left-0 w-[260px] h-[260px] rounded-full border border-dashed border-[#315CF5]/40 bg-[#315CF5]/[0.02]" />

            {/* Radius measurement dimension line */}
            <div className="absolute top-1/2 left-1/2 w-[120px] h-[1px] bg-[#315CF5]/50 -translate-y-1/2 origin-left rotate-[35deg]">
              <span className="absolute -top-4 right-2 text-[10px] font-mono text-[#315CF5] bg-white px-1.5 py-0.5 rounded border border-[#DDE3EC] shadow-2xs">
                r = 1000m
              </span>
            </div>
          </div>

          {/* Candidate Site Main Pin */}
          <div className="absolute top-[48%] left-[42%] -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
            {/* Soft Green Target Pulse */}
            <div className="relative flex items-center justify-center">
              <div className="absolute w-12 h-12 rounded-full bg-[#43B96B]/20 animate-ping" />
              <div className="w-10 h-10 rounded-full bg-[#315CF5] text-white flex items-center justify-center shadow-lg border-2 border-white z-10">
                <MapPin className="w-5 h-5 fill-current" />
              </div>
            </div>
            {/* Candidate Site Tag */}
            <div className="mt-1 bg-[#08111F] text-white text-[11px] font-mono font-bold px-2 py-0.5 rounded shadow-md border border-[#DDE3EC]/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#43B96B]" />
              CANDIDATE SITE
            </div>
          </div>

          {/* POI Markers — Appearing Sequentially */}
          {/* POI 1: Hospital */}
          <div
            className={`absolute top-[22%] left-[22%] z-10 transition-all duration-500 transform ${
              animReady ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
            }`}
            style={{ transitionDelay: '300ms' }}
          >
            <div className="flex items-center gap-1.5 bg-white border border-[#DDE3EC] rounded-full px-2.5 py-1 shadow-sm text-xs font-medium text-[#08111F]">
              <span className="w-2 h-2 rounded-full bg-[#315CF5]" />
              <span>Hospital</span>
              <span className="text-[10px] font-mono text-[#8A94A3]">240m</span>
            </div>
          </div>

          {/* POI 2: School */}
          <div
            className={`absolute top-[72%] left-[28%] z-10 transition-all duration-500 transform ${
              animReady ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
            }`}
            style={{ transitionDelay: '500ms' }}
          >
            <div className="flex items-center gap-1.5 bg-white border border-[#DDE3EC] rounded-full px-2.5 py-1 shadow-sm text-xs font-medium text-[#08111F]">
              <span className="w-2 h-2 rounded-full bg-[#315CF5]" />
              <span>School</span>
              <span className="text-[10px] font-mono text-[#8A94A3]">410m</span>
            </div>
          </div>

          {/* POI 3: Transit */}
          <div
            className={`absolute top-[32%] left-[70%] z-10 transition-all duration-500 transform ${
              animReady ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
            }`}
            style={{ transitionDelay: '700ms' }}
          >
            <div className="flex items-center gap-1.5 bg-white border border-[#DDE3EC] rounded-full px-2.5 py-1 shadow-sm text-xs font-medium text-[#08111F]">
              <span className="w-2 h-2 rounded-full bg-[#315CF5]" />
              <span>Transit Station</span>
              <span className="text-[10px] font-mono text-[#8A94A3]">180m</span>
            </div>
          </div>

          {/* POI 4: Commercial Area */}
          <div
            className={`absolute top-[68%] left-[65%] z-10 transition-all duration-500 transform ${
              animReady ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
            }`}
            style={{ transitionDelay: '900ms' }}
          >
            <div className="flex items-center gap-1.5 bg-white border border-[#DDE3EC] rounded-full px-2.5 py-1 shadow-sm text-xs font-medium text-[#08111F]">
              <span className="w-2 h-2 rounded-full bg-[#315CF5]" />
              <span>Commercial Hub</span>
              <span className="text-[10px] font-mono text-[#8A94A3]">550m</span>
            </div>
          </div>

          {/* POI 5: Cafe */}
          <div
            className={`absolute top-[18%] left-[55%] z-10 transition-all duration-500 transform ${
              animReady ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
            }`}
            style={{ transitionDelay: '1100ms' }}
          >
            <div className="flex items-center gap-1.5 bg-white border border-[#DDE3EC] rounded-full px-2.5 py-1 shadow-sm text-xs font-medium text-[#08111F]">
              <span className="w-2 h-2 rounded-full bg-[#315CF5]" />
              <span>Cafe Cluster</span>
              <span className="text-[10px] font-mono text-[#8A94A3]">310m</span>
            </div>
          </div>
        </div>

        {/* OVERLAPPING FLOATING ANALYTICS CARD */}
        <div className="absolute bottom-4 right-4 left-4 sm:left-auto sm:w-[310px] z-30 bg-white border border-[#DDE3EC] rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-semibold tracking-wider text-[#8A94A3] uppercase">
              SITE ANALYSIS
            </span>
            <span className="inline-flex items-center gap-1 bg-[#E7F7E9] text-[#43B96B] text-[11px] font-semibold px-2 py-0.5 rounded-full border border-[#43B96B]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#43B96B]" />
              Strong Opportunity
            </span>
          </div>

          <div className="mb-3">
            <h4 className="text-sm font-bold text-[#08111F]">Satellite, Ahmedabad</h4>
            <p className="text-[11px] font-mono text-[#8A94A3]">23.0225° N, 72.5714° E</p>
          </div>

          {/* Large Readiness Score Display */}
          <div className="flex items-baseline justify-between py-2 px-3 bg-[#F6F8FC] rounded-lg border border-[#DDE3EC] mb-3">
            <span className="text-xs font-medium text-[#5D6675]">Site Readiness Score</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-[#08111F] font-mono">{score}</span>
              <span className="text-xs text-[#8A94A3] font-mono">/ 100</span>
            </div>
          </div>

          {/* Thin Progress Indicators for Score Breakdown */}
          <div className="space-y-2 text-xs">
            <div>
              <div className="flex justify-between text-[11px] font-medium mb-1">
                <span className="text-[#5D6675]">Accessibility</span>
                <span className="font-mono text-[#08111F] font-semibold">91</span>
              </div>
              <div className="h-1.5 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#315CF5] rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${animReady ? 91 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-medium mb-1">
                <span className="text-[#5D6675]">Catchment</span>
                <span className="font-mono text-[#08111F] font-semibold">87</span>
              </div>
              <div className="h-1.5 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#315CF5] rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${animReady ? 87 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-medium mb-1">
                <span className="text-[#5D6675]">Competition</span>
                <span className="font-mono text-[#08111F] font-semibold">74</span>
              </div>
              <div className="h-1.5 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#315CF5] rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${animReady ? 74 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-medium mb-1">
                <span className="text-[#5D6675]">Infrastructure</span>
                <span className="font-mono text-[#08111F] font-semibold">82</span>
              </div>
              <div className="h-1.5 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#315CF5] rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${animReady ? 82 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
