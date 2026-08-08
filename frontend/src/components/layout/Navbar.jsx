import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LogOut, User, ChevronDown, Settings, Plus } from 'lucide-react'
import useAuthStore from '@/store/authStore'

export default function Navbar() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const displayName = user?.full_name || 'Guest User'
  const displayEmail = user?.email || 'Not signed in'
  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  const handleLogout = async () => {
    const { logout } = useAuthStore.getState()
    await logout()
    navigate('/auth/login')
  }

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-[#DDE3EC] flex-shrink-0 relative z-[4000] font-sans">
      {/* Left: Contextual Breadcrumb & Title */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-mono font-semibold text-[#8A94A3] uppercase tracking-wider bg-[#F6F8FC] px-2.5 py-1 rounded border border-[#DDE3EC]">
          OBRIX / OVERVIEW
        </span>
        <span className="hidden sm:inline-block text-xs font-medium text-[#5D6675]">
          {user ? `Signed in as ${user.full_name.split(' ')[0]}` : 'Location Intelligence Command Center'}
        </span>
      </div>

      {/* Right: Actions & User Avatar */}
      <div className="flex items-center gap-3 relative z-[4500]">
        <button
          onClick={() => navigate('/analyze')}
          id="navbar-analyze-btn"
          className="inline-flex items-center gap-1.5 bg-[#315CF5] hover:bg-[#2448D8] text-white text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all duration-200 shadow-2xs hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Analysis</span>
        </button>

        {/* User Dropdown Button */}
        <div className="relative">
          <button
            id="navbar-user-menu-btn"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2.5 bg-[#F6F8FC] hover:bg-[#E9EFFF] border border-[#DDE3EC] px-3 py-1.5 transition-all duration-150 rounded-full cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-[#315CF5] flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
              {initials}
            </div>
            <span className="hidden md:block text-xs font-semibold text-[#08111F]">
              {displayName}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#8A94A3] transition-transform duration-200 ${
                menuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-[4800]"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-[#DDE3EC] py-1.5 z-[5000] rounded-xl shadow-xl">
                <div className="px-4 py-2 border-b border-[#DDE3EC]">
                  <p className="text-xs font-bold text-[#08111F] font-sans truncate">{displayName}</p>
                  <p className="text-[10px] text-[#8A94A3] font-mono truncate">{displayEmail}</p>
                </div>

                <Link
                  to="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-medium text-[#5D6675] hover:text-[#08111F] hover:bg-[#F6F8FC] transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-[#8A94A3]" />
                  Settings
                </Link>

                <div className="border-t border-[#DDE3EC] my-1" />

                {user ? (
                  <button
                    id="navbar-logout-btn"
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign out
                  </button>
                ) : (
                  <Link
                    to="/auth/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-medium text-[#315CF5] hover:bg-[#E9EFFF] transition-colors"
                  >
                    <User className="w-3.5 h-3.5" />
                    Sign in
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
