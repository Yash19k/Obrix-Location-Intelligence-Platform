import { useNavigate } from 'react-router-dom'
import { ArrowRight, Compass } from 'lucide-react'
import HeroGlobeVisualization from './HeroGlobeVisualization'
import KineticText from '@/components/ui/KineticText'

export default function HeroSection() {
  const navigate = useNavigate()

  const scrollToHowItWorks = () => {
    const el = document.getElementById('how-it-works')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative min-h-screen pt-28 pb-16 px-4 sm:px-6 lg:px-8 bg-[#F6F8FC] bg-gis-grid overflow-hidden flex flex-col justify-center">
      {/* Decorative Technical Geographic Corner Micro-Annotations */}
      <div className="absolute top-24 left-8 hidden xl:flex flex-col gap-1 text-[11px] font-mono text-[#8A94A3] select-none pointer-events-none">
        <span className="text-[#315CF5] font-semibold">LOCATION SIGNAL</span>
        <span>LAT: 23.0225° N</span>
        <span>LNG: 72.5714° E</span>
        <span>GRID: SYS-849</span>
      </div>

      <div className="absolute top-24 right-8 hidden xl:flex flex-col items-end gap-1 text-[11px] font-mono text-[#8A94A3] select-none pointer-events-none">
        <span>RADIUS: 1000m</span>
        <span>SOURCE: OSM DATA</span>
        <span className="text-[#43B96B] font-semibold">STATUS: ACTIVE</span>
      </div>

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        {/* LEFT COLUMN — Text & CTAs */}
        <div className="lg:col-span-6 space-y-6 text-left">
          {/* Eyebrow status badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#DDE3EC] rounded-full shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#315CF5] animate-pulse" />
            <span className="text-xs font-mono font-semibold tracking-wider text-[#08111F]">
              LOCATION INTELLIGENCE PLATFORM
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-[72px] font-extrabold text-[#08111F] tracking-tight leading-[1.05] font-sans">
            <KineticText as="span" text="Make better location" />
            <br className="hidden sm:inline" />
            <KineticText as="span" text="decisions " />
            <KineticText as="span" text="with intelligence." className="text-[#315CF5]" />
          </h1>

          {/* Supporting Copy */}
          <p className="text-base sm:text-lg text-[#5D6675] max-w-xl leading-relaxed font-sans font-normal">
            Evaluate commercial locations using geospatial data, nearby infrastructure, competition signals and AI-powered insights — before you make the move.
          </p>

          {/* CTA Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <button
              onClick={() => navigate('/analyze')}
              id="hero-primary-cta"
              className="inline-flex items-center justify-center gap-2 bg-[#315CF5] hover:bg-[#2448D8] text-white text-base font-semibold px-7 py-3.5 rounded-full transition-all duration-200 hover:-translate-y-0.5 shadow-md hover:shadow-lg active:translate-y-0 cursor-pointer"
            >
              <span>Analyze a Location</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={scrollToHowItWorks}
              id="hero-secondary-cta"
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-[#F8FAFC] text-[#08111F] border border-[#DDE3EC] text-base font-semibold px-7 py-3.5 rounded-full transition-all duration-200 hover:-translate-y-0.5 shadow-2xs active:translate-y-0 cursor-pointer"
            >
              <span>See how it works</span>
            </button>
          </div>

          {/* Understated metadata line */}
          <div className="pt-4 flex items-center gap-2 text-xs font-mono text-[#8A94A3]">
            <span>OpenStreetMap data</span>
            <span>·</span>
            <span>Business-specific scoring</span>
            <span>·</span>
            <span>AI-assisted insights</span>
          </div>
        </div>

        {/* RIGHT COLUMN — Product Visualization */}
        <div className="lg:col-span-6 w-full flex items-center justify-center">
          <HeroGlobeVisualization />
        </div>
      </div>
    </section>
  )
}
