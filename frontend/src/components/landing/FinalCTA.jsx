import { useNavigate } from 'react-router-dom'
import { ArrowRight, Compass, MapPin } from 'lucide-react'

export default function FinalCTA() {
  const navigate = useNavigate()

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#DDE3EC] relative overflow-hidden">
      <div className="max-w-5xl mx-auto bg-[#F6F8FC] bg-gis-grid border border-[#DDE3EC] rounded-3xl p-8 sm:p-16 text-center shadow-xl relative overflow-hidden">
        {/* Subtle SVG Map Radius Background Vector */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <svg className="w-[500px] h-[500px] text-[#315CF5]" stroke="currentColor" fill="none">
            <circle cx="250" cy="250" r="100" strokeWidth="1" strokeDasharray="4 4" />
            <circle cx="250" cy="250" r="180" strokeWidth="1" />
            <circle cx="250" cy="250" r="240" strokeWidth="1" strokeDasharray="6 6" />
            <line x1="50" y1="250" x2="450" y2="250" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="250" y1="50" x2="250" y2="450" strokeWidth="1" strokeDasharray="2 2" />
          </svg>
        </div>

        <div className="relative z-10 space-y-6 max-w-3xl mx-auto">
          {/* Logo Pin Icon */}
          <div className="w-14 h-14 rounded-2xl bg-[#315CF5] text-white flex items-center justify-center shadow-md mx-auto">
            <Compass className="w-7 h-7 text-white" />
          </div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#08111F] tracking-tight font-sans">
            Stop guessing where to open next.
          </h2>

          {/* Supporting Copy */}
          <p className="text-base sm:text-xl text-[#5D6675] max-w-xl mx-auto font-sans font-normal">
            Evaluate your next commercial location with data-backed site intelligence.
          </p>

          {/* Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => navigate('/analyze')}
              id="final-cta-analyze-btn"
              className="inline-flex items-center justify-center gap-2 bg-[#315CF5] hover:bg-[#2448D8] text-white text-base font-semibold px-8 py-3.5 rounded-full transition-all duration-200 hover:-translate-y-0.5 shadow-md active:translate-y-0 cursor-pointer"
            >
              <span>Analyze a Location</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/ask-obrix')}
              id="final-cta-ask-btn"
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-[#F8FAFC] text-[#08111F] border border-[#DDE3EC] text-base font-semibold px-8 py-3.5 rounded-full transition-all duration-200 hover:-translate-y-0.5 shadow-2xs active:translate-y-0 cursor-pointer"
            >
              <span>Ask Obrix</span>
            </button>
          </div>

          {/* Coordinate Decorative Line */}
          <div className="pt-6 text-xs font-mono text-[#8A94A3] tracking-widest uppercase">
            OBRIX / LOCATION INTELLIGENCE / READY
          </div>
        </div>
      </div>
    </section>
  )
}
