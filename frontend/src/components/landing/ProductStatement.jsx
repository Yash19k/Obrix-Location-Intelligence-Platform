import { Compass, Network } from 'lucide-react'

export default function ProductStatement() {
  return (
    <section className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-white border-y border-[#DDE3EC] overflow-hidden">
      {/* Faint map background pattern */}
      <div className="absolute inset-0 bg-gis-grid opacity-60 pointer-events-none" />

      <div className="relative max-w-4xl mx-auto text-center space-y-6">
        {/* Label */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F6F8FC] border border-[#DDE3EC] rounded-full">
          <span className="text-xs font-mono font-semibold tracking-wider text-[#315CF5] uppercase">
            LOCATION DECISIONS, EXPLAINED.
          </span>
        </div>

        {/* Headline */}
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#08111F] tracking-tight leading-tight font-sans">
          A location is more than a pin on a map.
        </h2>

        {/* Supporting Copy */}
        <p className="text-lg sm:text-xl text-[#5D6675] max-w-2xl mx-auto leading-relaxed font-sans font-normal">
          Obrix evaluates the environment surrounding a potential business site and turns complex spatial signals into clear, understandable intelligence.
        </p>

        {/* Micro-detail coordinate watermark */}
        <div className="pt-6 flex justify-center items-center gap-4 text-xs font-mono text-[#8A94A3]">
          <span>SPATIAL SIGNAL DECODER</span>
          <span>·</span>
          <span>SYS/FEASIBILITY</span>
        </div>
      </div>
    </section>
  )
}
