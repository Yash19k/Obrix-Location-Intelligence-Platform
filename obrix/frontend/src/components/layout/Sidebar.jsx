/**
 * Sidebar — collapsible navigation panel.
 * Active route is highlighted via NavLink's isActive prop.
 */

import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, MapPin, FileText, Settings, Zap
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard',  Icon: LayoutDashboard },
  { to: '/analyze',   label: 'Analyze',    Icon: MapPin },
  { to: '/reports',   label: 'Reports',    Icon: FileText },
  { to: '/settings',  label: 'Settings',   Icon: Settings },
]

export default function Sidebar() {
  return (
    <aside className="w-60 flex-shrink-0 flex flex-col bg-surface-900 border-r border-white/5">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center shadow-glow">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="text-lg font-bold text-gradient">Obrix</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'nav-item-active' : ''}`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer version tag */}
      <div className="px-5 py-3 border-t border-white/5">
        <p className="text-xs text-white/20 font-mono">obrix v0.1.0</p>
      </div>
    </aside>
  )
}
