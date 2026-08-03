import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, MapPin, FileText, Bookmark, Settings, Zap, ChevronLeft, ChevronRight
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/dashboard',       label: 'Dashboard',       Icon: LayoutDashboard },
  { to: '/analyze',         label: 'Analyze',         Icon: MapPin },
  { to: '/reports',         label: 'Reports',         Icon: FileText },
  { to: '/saved-locations', label: 'Saved Locations', Icon: Bookmark },
  { to: '/settings',        label: 'Settings',        Icon: Settings },
]

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true'
  })

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', isCollapsed)
    // Dispatch custom event so MapResizeBridge updates Leaflet size
    window.dispatchEvent(new Event('resize'))
  }, [isCollapsed])

  return (
    <aside
      className={`flex-shrink-0 flex flex-col bg-surface-900 border-r border-white/5 transition-all duration-300 relative z-30 ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Logo & Toggle */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/5 h-16">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center shadow-glow shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          {!isCollapsed && (
            <span className="text-lg font-bold text-gradient whitespace-nowrap">Obrix</span>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={isCollapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              } ${isCollapsed ? 'justify-center px-0' : ''}`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer version tag */}
      <div className="px-4 py-3 border-t border-white/5 text-center">
        <p className="text-[10px] text-white/20 font-mono">
          {isCollapsed ? 'v1.0' : 'obrix v1.0.0'}
        </p>
      </div>
    </aside>
  )
}
