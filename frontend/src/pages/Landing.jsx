import LandingNavbar from '@/components/landing/LandingNavbar'
import HeroSection from '@/components/landing/HeroSection'
import ProductStatement from '@/components/landing/ProductStatement'
import HowItWorks from '@/components/landing/HowItWorks'
import AnalyzeShowcase from '@/components/landing/AnalyzeShowcase'
import BusinessIntelligence from '@/components/landing/BusinessIntelligence'
import LocationComparison from '@/components/landing/LocationComparison'
import AskObrixSection from '@/components/landing/AskObrixSection'
import ReportsSection from '@/components/landing/ReportsSection'
import WorkspacePreview from '@/components/landing/WorkspacePreview'
import FinalCTA from '@/components/landing/FinalCTA'
import LandingFooter from '@/components/landing/LandingFooter'

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#F6F8FC] text-[#08111F] font-sans antialiased selection:bg-[#315CF5] selection:text-white">
      {/* Floating Header Navbar */}
      <LandingNavbar />

      <main>
        {/* Hero Section */}
        <HeroSection />

        {/* Transition / Product Statement */}
        <ProductStatement />

        {/* How Obrix Works */}
        <HowItWorks />

        {/* Product Showcase — Analyze */}
        <AnalyzeShowcase />

        {/* Business-Specific Intelligence */}
        <BusinessIntelligence />

        {/* Location Comparison */}
        <LocationComparison />

        {/* Ask Obrix Section (Dark Mode Feature Section) */}
        <AskObrixSection />

        {/* Professional Reports */}
        <ReportsSection />

        {/* Workspace Preview */}
        <WorkspacePreview />

        {/* Final Call To Action */}
        <FinalCTA />
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  )
}
