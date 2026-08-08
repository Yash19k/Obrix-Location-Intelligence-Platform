import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'

export default function LandingFooter() {
  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <footer className="bg-white border-t border-[#DDE3EC] py-12 px-4 sm:px-6 lg:px-8 text-[#5D6675]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-[#F1F5F9]">
        {/* Left Column: Brand */}
        <div className="md:col-span-5 space-y-4">
          <Link to="/" className="inline-block">
            <img src="/obrix-logo.png" alt="Obrix Logo" className="h-8 w-auto object-contain" />
          </Link>

          <p className="text-sm text-[#5D6675] max-w-sm font-sans font-normal leading-relaxed">
            Location intelligence for better business decisions.
          </p>
        </div>

        {/* Right Columns: Links */}
        <div className="md:col-span-7 grid grid-cols-3 gap-6 text-sm font-sans">
          {/* Product */}
          <div className="space-y-3">
            <h4 className="font-bold text-[#08111F] text-xs font-mono uppercase tracking-wider">
              Product
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/analyze" className="hover:text-[#08111F] transition-colors">
                  Analyze
                </Link>
              </li>
              <li>
                <Link to="/ask-obrix" className="hover:text-[#08111F] transition-colors">
                  Ask Obrix
                </Link>
              </li>
              <li>
                <Link to="/reports" className="hover:text-[#08111F] transition-colors">
                  Reports
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform */}
          <div className="space-y-3">
            <h4 className="font-bold text-[#08111F] text-xs font-mono uppercase tracking-wider">
              Platform
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => scrollToSection('how-it-works')}
                  className="hover:text-[#08111F] transition-colors cursor-pointer text-left"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('use-cases')}
                  className="hover:text-[#08111F] transition-colors cursor-pointer text-left"
                >
                  Use Cases
                </button>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div className="space-y-3">
            <h4 className="font-bold text-[#08111F] text-xs font-mono uppercase tracking-wider">
              Account
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/auth/login" className="hover:text-[#08111F] transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/auth/register" className="hover:text-[#08111F] transition-colors">
                  Create Account
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#8A94A3]">
        <div>© Obrix Location Intelligence. All rights reserved.</div>
        <div className="flex items-center gap-4">
          <span>LAT/LNG ENGINE</span>
          <span>·</span>
          <span>GEOSPATIAL SAAS</span>
        </div>
      </div>
    </footer>
  )
}
