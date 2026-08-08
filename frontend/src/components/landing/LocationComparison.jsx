import { useNavigate } from 'react-router-dom'
import { MapPin, ArrowRight, CheckCircle2, GitCompare, ShieldCheck } from 'lucide-react'

export default function LocationComparison() {
  const navigate = useNavigate()

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#DDE3EC]">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F6F8FC] border border-[#DDE3EC] rounded-full">
            <span className="text-xs font-mono font-semibold tracking-wider text-[#315CF5] uppercase">
              LOCATION COMPARISON
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#08111F] tracking-tight font-sans">
            Two locations. One better decision.
          </h2>

          <p className="text-base sm:text-lg text-[#5D6675] font-sans">
            Compare candidate sites side-by-side on accessibility, catchment, and competitive density.
          </p>
        </div>

        {/* Side-by-Side Comparison Container */}
        <div className="relative">
          {/* Subtle connecting map line indicator (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-[#F6F8FC] border border-[#DDE3EC] shadow-md z-20 flex items-center justify-center text-[#315CF5]">
            <GitCompare className="w-6 h-6" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
            {/* LOCATION A — RECOMMENDED */}
            <div className="bg-white border-2 border-[#43B96B] rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col justify-between">
              {/* Recommended Badge Banner */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#DDE3EC]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#8A94A3] uppercase">
                    LOCATION A
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-[#E7F7E9] text-[#43B96B] text-xs font-extrabold px-3 py-1 rounded-full border border-[#43B96B]/30">
                    <CheckCircle2 className="w-3.5 h-3.5" /> RECOMMENDED
                  </span>
                </div>
                <span className="text-xs font-mono text-[#8A94A3]">23.0225° N, 72.5714° E</span>
              </div>

              {/* Title & Score */}
              <div className="flex items-baseline justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-extrabold text-[#08111F] font-sans">
                    Satellite, Ahmedabad
                  </h3>
                  <p className="text-xs text-[#5D6675] font-medium">Primary Commercial Corridor</p>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold font-mono text-[#08111F]">84</span>
                    <span className="text-sm font-mono text-[#8A94A3]">/ 100</span>
                  </div>
                  <span className="text-xs font-semibold text-[#43B96B]">Strong Opportunity</span>
                </div>
              </div>

              {/* Factors Comparison */}
              <div className="space-y-4 py-4 border-t border-[#F1F5F9] text-sm">
                <div>
                  <div className="flex justify-between font-medium mb-1">
                    <span className="text-[#5D6675]">Accessibility</span>
                    <span className="font-mono font-bold text-[#08111F]">91 / 100</span>
                  </div>
                  <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div className="h-full bg-[#43B96B] w-[91%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-medium mb-1">
                    <span className="text-[#5D6675]">Catchment</span>
                    <span className="font-mono font-bold text-[#08111F]">87 / 100</span>
                  </div>
                  <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div className="h-full bg-[#43B96B] w-[87%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-medium mb-1">
                    <span className="text-[#5D6675]">Competition</span>
                    <span className="font-mono font-bold text-[#08111F]">74 / 100</span>
                  </div>
                  <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div className="h-full bg-[#43B96B] w-[74%]" />
                  </div>
                </div>
              </div>
            </div>

            {/* LOCATION B */}
            <div className="bg-[#F6F8FC] border border-[#DDE3EC] rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#DDE3EC]">
                <span className="text-xs font-mono font-bold text-[#8A94A3] uppercase">
                  LOCATION B
                </span>
                <span className="text-xs font-mono text-[#8A94A3]">23.0365° N, 72.5611° E</span>
              </div>

              {/* Title & Score */}
              <div className="flex items-baseline justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-extrabold text-[#08111F] font-sans">
                    Navrangpura, Ahmedabad
                  </h3>
                  <p className="text-xs text-[#5D6675] font-medium">Secondary Urban District</p>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold font-mono text-[#5D6675]">76</span>
                    <span className="text-sm font-mono text-[#8A94A3]">/ 100</span>
                  </div>
                  <span className="text-xs font-semibold text-[#5D6675]">Good Opportunity</span>
                </div>
              </div>

              {/* Factors Comparison */}
              <div className="space-y-4 py-4 border-t border-[#DDE3EC] text-sm">
                <div>
                  <div className="flex justify-between font-medium mb-1">
                    <span className="text-[#5D6675]">Accessibility</span>
                    <span className="font-mono font-bold text-[#08111F]">86 / 100</span>
                  </div>
                  <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                    <div className="h-full bg-[#5D6675] w-[86%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-medium mb-1">
                    <span className="text-[#5D6675]">Catchment</span>
                    <span className="font-mono font-bold text-[#08111F]">73 / 100</span>
                  </div>
                  <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                    <div className="h-full bg-[#5D6675] w-[73%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-medium mb-1">
                    <span className="text-[#5D6675]">Competition</span>
                    <span className="font-mono font-bold text-[#08111F]">65 / 100</span>
                  </div>
                  <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                    <div className="h-full bg-[#5D6675] w-[65%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-10 text-center">
            <button
              onClick={() => navigate('/analyze')}
              id="compare-cta-btn"
              className="inline-flex items-center gap-2 bg-[#315CF5] hover:bg-[#2448D8] text-white font-semibold text-base px-8 py-3.5 rounded-full transition-all duration-200 hover:-translate-y-0.5 shadow-md active:translate-y-0 cursor-pointer"
            >
              <span>Compare Locations</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
