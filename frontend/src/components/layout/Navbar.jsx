/**
 * Navbar — top bar with user avatar and navigation.
 *
 * Phase 1: Shows "Guest" when no user is logged in.
 * Phase 2: Will show real user info from authStore after JWT login.
 */

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LogOut, User, ChevronDown, Settings } from 'lucide-react'
import useAuthStore from '@/store/authStore'

export default function Navbar() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const displayName = user?.full_name || 'Guest'
  const displayEmail = user?.email || 'Not signed in'
  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'G'

  const handleLogout = async () => {
    const { logout } = useAuthStore.getState()
    await logout()
    navigate('/auth/login')
  }

  return (
    <header className="flex items-center justify-between px-6 py-3.5 border-b border-white/5 bg-surface-900/80 backdrop-blur-sm flex-shrink-0">
      {/* Left: greeting */}
      <div>
        <p className="text-xs text-white/30 uppercase tracking-widest">Location Intelligence</p>
        <p className="text-sm font-semibold text-white">
          {user ? `Welcome, ${user.full_name.split(' ')[0]}` : 'Obrix Dashboard'}
        </p>
      </div>

      {/* Right: user avatar dropdown */}
      <div className="relative">
        <button
          id="navbar-user-menu-btn"
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2.5 glass-card px-3 py-1.5 hover:bg-white/10 transition-all duration-200 rounded-xl"
        >
          {/* Avatar */}
          <div className="w-7 h-7 rounded-full bg-gradient-brand flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {initials}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-medium text-white/80 leading-tight">{displayName}</p>
            <p className="text-[10px] text-white/30 leading-tight">{displayEmail}</p>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-white/40 transition-transform duration-200 ${
              menuOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Dropdown menu */}
        {menuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 top-full mt-2 w-48 glass-card py-1.5 z-50 animate-fade-in rounded-xl shadow-card">
              <Link
                to="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                Settings
              </Link>

              <div className="border-t border-white/5 my-1" />

              {user ? (
                <button
                  id="navbar-logout-btn"
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out
                </button>
              ) : (
                <Link
                  to="/auth/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-brand-400 hover:text-brand-300 hover:bg-brand-500/10 transition-colors"
                >
                  <User className="w-3.5 h-3.5" />
                  Sign in
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  )
}
