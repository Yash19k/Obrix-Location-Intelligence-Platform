/**
 * AppShell — the persistent layout wrapper for all authenticated pages.
 * Renders Navbar + Sidebar + main content area (Outlet).
 */

import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

export default function AppShell() {
  const { pathname } = useLocation()
  const isMapPage = pathname === '/analyze' || pathname.startsWith('/analyze/')

  return (
    <div className="flex h-screen bg-surface-900 overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar />
        <main className={`flex-1 overflow-hidden ${
          isMapPage ? '' : 'overflow-y-auto p-6'
        }`}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
