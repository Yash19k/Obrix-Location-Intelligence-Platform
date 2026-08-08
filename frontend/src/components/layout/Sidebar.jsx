import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, MapPin, Sparkles, FileText, Bookmark, Settings, Compass, ChevronLeft, ChevronRight, LogOut, User
} from 'lucide-react'
import useAuthStore from '@/store/authStore'

const NAV_ITEMS = [
  { to: '/dashboard',       label: 'Overview',        Icon: LayoutDashboard },
  { to: '/analyze',         label: 'Analyze',         Icon: MapPin },
  { to: '/saved-locations', label: 'Saved Locations', Icon: Bookmark },
  { to: '/reports',         label: 'Reports',         Icon: FileText },
  { to: '/ask-obrix',       label: 'Ask Obrix',       Icon: Sparkles, badge: '' },
  { to: '/settings',        label: 'Settings',        Icon: Settings },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true'
  })

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', isCollapsed)
    window.dispatchEvent(new Event('resize'))
  }, [isCollapsed])

  const handleLogout = async () => {
    await logout()
    navigate('/auth/login')
  }

  const displayName = user?.full_name || 'Guest User'
  const displayEmail = user?.email || 'User Account'
  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <aside
      className={`flex-shrink-0 flex flex-col bg-white border-r border-[#DDE3EC] transition-all duration-300 relative z-30 font-sans select-none ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Top Logo & Toggle Header */}
      <div className={`flex items-center justify-between border-b border-[#DDE3EC] h-[76px] ${
        isCollapsed ? 'px-2.5' : 'px-5'
      }`}>
        <Link
          to="/"
          aria-label="Go to Obrix home"
          className="flex items-center min-w-0 overflow-hidden group focus:outline-none focus:ring-2 focus:ring-[#315CF5]/20 rounded-lg"
        >
          {isCollapsed ? (
            <img
              src="/obrix-symbol.png"
              alt="Obrix Symbol"
              className="w-8.5 h-8.5 object-contain shrink-0 select-none transition-transform duration-200 group-hover:scale-105 mx-auto"
            />
          ) : (
            <img
              src="/obrix-logo.png"
              alt="Obrix"
              className="w-[155px] h-auto object-contain shrink-0 select-none transition-opacity duration-200 group-hover:opacity-95"
            />
          )}
        </Link>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-xl text-[#8A94A3] hover:text-[#08111F] hover:bg-[#F6F8FC] transition-colors cursor-pointer shrink-0 ml-1"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            title={isCollapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-[#E9EFFF] text-[#315CF5] border border-[#315CF5]/20 shadow-2xs'
                  : 'text-[#5D6675] hover:text-[#08111F] hover:bg-[#F6F8FC]'
              } ${isCollapsed ? 'justify-center px-0' : ''}`
            }
          >
            <div className="flex items-center gap-3 min-w-0">
              <Icon className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span className="truncate">{label}</span>}
            </div>

            {!isCollapsed && badge && (
              <span className="text-[10px] font-mono font-extrabold bg-[#E9EFFF] text-[#315CF5] px-1.5 py-0.5 rounded border border-[#315CF5]/20">
                {badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom User Account Section */}
      <div className="p-3 border-t border-[#DDE3EC] bg-[#F6F8FC]">
        {isCollapsed ? (
          <div className="flex justify-center">
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="w-9 h-9 rounded-full bg-white border border-[#DDE3EC] text-[#5D6675] hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 bg-white border border-[#DDE3EC] rounded-xl p-2.5 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#315CF5] text-white flex items-center justify-center text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-[#08111F] truncate font-sans">
                  {displayName}
                </span>
                <span className="text-[10px] text-[#8A94A3] font-mono truncate">
                  {displayEmail}
                </span>
              </div>
            </div>

            {user && (
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-1.5 rounded-lg text-[#8A94A3] hover:text-red-600 hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
