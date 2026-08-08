import { useState } from 'react'
import { MapPin, Crosshair, Sparkles, Building2, Store, Coffee, ShoppingBag, BookOpen } from 'lucide-react'

const BUSINESS_TYPES = [
  {
    id: 'pharmacy',
    name: 'Pharmacy',
    score: 84,
    tier: 'Strong Opportunity',
    badgeBg: 'bg-[#E7F7E9]',
    badgeText: 'text-[#43B96B]',
    border: 'border-[#43B96B]',
    icon: Store,
    reason: 'High density of nearby hospitals, clinics, and residential catchment.',
    position: 'top-left',
  },
  {
    id: 'cafe',
    name: 'Cafe',
    score: 71,
    tier: 'Moderate Opportunity',
    badgeBg: 'bg-[#FEF3C7]',
    badgeText: 'text-amber-700',
    border: 'border-amber-400',
    icon: Coffee,
    reason: 'Moderate foot-traffic; near corporate offices, but high competitor saturation.',
    position: 'top-right',
  },
  {
    id: 'grocery',
    name: 'Grocery',
    score: 77,
    tier: 'Good Opportunity',
    badgeBg: 'bg-[#E9EFFF]',
    badgeText: 'text-[#315CF5]',
    border: 'border-[#315CF5]',
    icon: ShoppingBag,
    reason: 'Strong residential population density and good road accessibility.',
    position: 'bottom-left',
  },
  {
    id: 'stationery',
    name: 'Stationery',
    score: 62,
    tier: 'Fair Opportunity',
    badgeBg: 'bg-[#F1F5F9]',
    badgeText: 'text-[#5D6675]',
    border: 'border-[#CBD5E1]',
    icon: BookOpen,
    reason: 'Limited proximity to schools or universities within immediate 1km buffer.',
    position: 'bottom-right',
  },
]

export default function BusinessIntelligence() {
  const [selectedBiz, setSelectedBiz] = useState('pharmacy')

  return (
    <section id="use-cases" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#F6F8FC] bg-gis-grid border-b border-[#DDE3EC]">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#DDE3EC] rounded-full">
            <span className="text-xs font-mono font-semibold tracking-wider text-[#315CF5] uppercase">
              BUSINESS-SPECIFIC SCORING
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#08111F] tracking-tight font-sans">
            The right location depends on the business.
          </h2>

          <p className="text-base sm:text-lg text-[#5D6675] font-sans">
            Obrix evaluates surrounding features differently based on what you're planning to open.
          </p>
        </div>

        {/* Centralized Spatial Interactive Concept Map */}
        <div className="bg-white border border-[#DDE3EC] rounded-2xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
          {/* Top Banner Tagline */}
          <div className="text-center mb-8">
            <span className="inline-block bg-[#08111F] text-white font-mono text-xs sm:text-sm font-bold px-4 py-2 rounded-full shadow">
              Same location. Different business. Different opportunity.
            </span>
          </div>

          {/* Central Map & Business Orbit Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Business Cards Grid (Left/Around) */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {BUSINESS_TYPES.map((biz) => {
                const Icon = biz.icon
                const isSelected = selectedBiz === biz.id

                return (
                  <div
                    key={biz.id}
                    onClick={() => setSelectedBiz(biz.id)}
                    className={`p-5 rounded-xl border-2 transition-all duration-300 cursor-pointer bg-white ${
                      isSelected
                        ? `${biz.border} shadow-md -translate-y-1`
                        : 'border-[#DDE3EC] hover:border-[#CBD5E1] hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isSelected ? 'bg-[#315CF5] text-white' : 'bg-[#F6F8FC] text-[#08111F]'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-base text-[#08111F] font-sans">
                          {biz.name}
                        </h4>
                      </div>

                      <div className="flex items-baseline gap-0.5">
                        <span className="text-2xl font-extrabold font-mono text-[#08111F]">
                          {biz.score}
                        </span>
                        <span className="text-xs font-mono text-[#8A94A3]">/100</span>
                      </div>
                    </div>

                    <span className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full mb-2 ${biz.badgeBg} ${biz.badgeText}`}>
                      {biz.tier}
                    </span>

                    <p className="text-xs text-[#5D6675] leading-relaxed font-sans font-normal">
                      {biz.reason}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Central Location Pin Visualization (Right) */}
            <div className="lg:col-span-5 bg-[#F8FAFC] border border-[#DDE3EC] rounded-xl p-6 relative overflow-hidden flex flex-col items-center justify-center text-center min-h-[320px]">
              <div className="absolute inset-0 bg-gis-grid-dense opacity-80" />

              {/* Pulsing Location Pin Target */}
              <div className="relative z-10 space-y-4">
                <div className="relative mx-auto w-16 h-16 rounded-full bg-white border border-[#DDE3EC] shadow-md flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-[#315CF5]/10 border border-[#315CF5]/30 flex items-center justify-center animate-pulse">
                    <MapPin className="w-7 h-7 text-[#315CF5] fill-current" />
                  </div>
                </div>

                <div>
                  <span className="text-xs font-mono text-[#8A94A3] block font-semibold">
                    SINGLE CANDIDATE SITE
                  </span>
                  <h4 className="text-lg font-bold text-[#08111F] font-sans">
                    Satellite, Ahmedabad
                  </h4>
                  <p className="text-xs font-mono text-[#5D6675] mt-0.5">
                    23.0225° N, 72.5714° E
                  </p>
                </div>

                <div className="pt-2">
                  <div className="inline-flex items-center gap-2 bg-white border border-[#DDE3EC] px-4 py-2 rounded-xl text-xs text-[#08111F] font-medium shadow-xs">
                    <span>Selected: <strong>{BUSINESS_TYPES.find(b => b.id === selectedBiz)?.name}</strong></span>
                    <span className="font-mono font-bold text-[#315CF5]">
                      {BUSINESS_TYPES.find(b => b.id === selectedBiz)?.score} / 100
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
