import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Compass, ArrowRight } from 'lucide-react'

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4 pb-2 transition-all duration-300 pointer-events-none">
      <nav
        className={`pointer-events-auto flex items-center justify-between w-full max-w-6xl bg-white border border-[#DDE3EC] rounded-full transition-all duration-300 ${
          scrolled
            ? 'py-2 px-5 shadow-md border-[#CBD5E1]'
            : 'py-3 px-6 shadow-sm'
        }`}
      >
        {/* LEFT: Obrix Logo */}
        <Link
          to="/"
          aria-label="Obrix Home"
          className="flex items-center shrink-0 group focus:outline-none focus:ring-2 focus:ring-[#315CF5]/20 rounded-lg"
        >
          <img
            src="/obrix-logo.png"
            alt="Obrix"
            className="w-[115px] sm:w-[120px] h-auto object-contain select-none transition-opacity duration-200 group-hover:opacity-90"
          />
        </Link>

        {/* CENTER: Navigation links */}
        <div className="hidden md:flex items-center gap-7 text-sm font-medium text-[#5D6675]">
          <button
            onClick={() => scrollToSection('product')}
            className="hover:text-[#08111F] transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-[#315CF5] hover:after:w-full after:transition-all cursor-pointer"
          >
            Product
          </button>
          <button
            onClick={() => scrollToSection('how-it-works')}
            className="hover:text-[#08111F] transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-[#315CF5] hover:after:w-full after:transition-all cursor-pointer"
          >
            How It Works
          </button>
          <button
            onClick={() => scrollToSection('use-cases')}
            className="hover:text-[#08111F] transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-[#315CF5] hover:after:w-full after:transition-all cursor-pointer"
          >
            Use Cases
          </button>
          <button
            onClick={() => scrollToSection('ask-obrix')}
            className="hover:text-[#08111F] transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-[#315CF5] hover:after:w-full after:transition-all cursor-pointer"
          >
            Ask Obrix
          </button>
        </div>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-3">
          <Link
            to="/auth/login"
            id="nav-signin-link"
            className="text-xs sm:text-sm font-semibold text-[#5D6675] hover:text-[#08111F] px-3 py-1.5 transition-colors"
          >
            Sign In
          </Link>
          <button
            onClick={() => navigate('/analyze')}
            id="nav-analyze-btn"
            className="inline-flex items-center gap-2 bg-[#315CF5] hover:bg-[#2448D8] text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-full transition-all duration-200 hover:-translate-y-0.5 shadow-sm active:translate-y-0 cursor-pointer"
          >
            <span>Analyze Location</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>
    </header>
  )
}
