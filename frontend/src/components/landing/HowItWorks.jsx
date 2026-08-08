import { MapPin, Layers, BarChart3, MessageSquareText, ArrowRight } from 'lucide-react'

const STEPS = [
  {
    num: '01',
    coord: 'POS: 23.0225, 72.5714',
    title: 'Choose a Location',
    desc: 'Select any candidate site directly from the map.',
    icon: MapPin,
  },
  {
    num: '02',
    coord: 'SIG: OSM_POIS_1000M',
    title: 'Analyze the Surroundings',
    desc: 'Obrix evaluates nearby infrastructure, accessibility, competitors and relevant POIs.',
    icon: Layers,
  },
  {
    num: '03',
    coord: 'SCORE: 0-100 INDEX',
    title: 'Understand the Score',
    desc: 'Receive a Site Readiness Score with clear factor breakdowns.',
    icon: BarChart3,
  },
  {
    num: '04',
    coord: 'AI: CONVERSATIONAL',
    title: 'Ask Obrix',
    desc: 'Continue the analysis with an AI location intelligence consultant.',
    icon: MessageSquareText,
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#F6F8FC] bg-gis-grid border-b border-[#DDE3EC]">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#DDE3EC] rounded-full">
            <span className="text-xs font-mono font-semibold tracking-wider text-[#315CF5] uppercase">
              WORKFLOW
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#08111F] tracking-tight font-sans">
            From location to decision.
          </h2>

          <p className="text-base sm:text-lg text-[#5D6675] font-sans">
            Obrix transforms nearby geographic signals into actionable site intelligence.
          </p>
        </div>

        {/* Connected 4-Step Process */}
        <div className="relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden lg:block absolute top-[4.5rem] left-[10%] right-[10%] h-[2px] bg-dashed border-b-2 border-dashed border-[#CBD5E1] z-0" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {STEPS.map((step, idx) => {
              const Icon = step.icon
              return (
                <div
                  key={step.num}
                  className="bg-white border border-[#DDE3EC] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between"
                >
                  <div>
                    {/* Step Top Row: Number & Icon */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-extrabold font-mono text-[#08111F] bg-[#F6F8FC] border border-[#DDE3EC] w-12 h-12 rounded-xl flex items-center justify-center group-hover:bg-[#315CF5] group-hover:text-white group-hover:border-[#315CF5] transition-colors">
                        {step.num}
                      </span>
                      <div className="w-10 h-10 rounded-lg bg-[#E9EFFF] text-[#315CF5] flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Micro Technical Coordinate tag */}
                    <div className="text-[10px] font-mono text-[#8A94A3] mb-2 font-semibold tracking-wider">
                      {step.coord}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-[#08111F] mb-2 font-sans">
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-[#5D6675] leading-relaxed font-sans font-normal">
                      {step.desc}
                    </p>
                  </div>

                  {/* Flow Arrow Indicator */}
                  {idx < STEPS.length - 1 && (
                    <div className="mt-6 pt-4 border-t border-[#F1F5F9] flex items-center justify-between text-xs font-mono text-[#8A94A3]">
                      <span>NEXT STEP</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#315CF5]" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
