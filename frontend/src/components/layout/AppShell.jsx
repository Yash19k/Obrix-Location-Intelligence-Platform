/**
 * AppShell — the persistent layout wrapper for all authenticated pages.
 * Renders Navbar + Sidebar + main content area (Outlet).
 */

import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

export default function AppShell() {
  const { pathname } = useLocation()
  const isFullHeightPage = pathname === '/analyze' || pathname.startsWith('/analyze/') || pathname === '/ask-obrix'

  return (
    <div className="flex h-screen bg-[#F6F8FC] text-[#08111F] font-sans antialiased overflow-hidden selection:bg-[#315CF5] selection:text-white">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar />
        <main className={`flex-1 overflow-hidden ${
          isFullHeightPage ? '' : 'overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gis-grid'
        }`}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
