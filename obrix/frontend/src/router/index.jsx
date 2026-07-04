/**
 * Application router — React Router v6.
 *
 * Phase 1: All routes are publicly accessible (no auth enforcement).
 *          Auth guards will be activated in Phase 2.
 *
 * Route guards (Phase 2 activation):
 *  - PublicRoute:    Redirect to /dashboard if already logged in
 *  - ProtectedRoute: Redirect to /auth/login if not authenticated
 */

import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import Spinner from '@/components/ui/Spinner'

// ── Lazy-loaded pages ────────────────────────────────────────────────────────
const Landing      = lazy(() => import('@/pages/Landing'))
const Login        = lazy(() => import('@/pages/auth/Login'))
const Register     = lazy(() => import('@/pages/auth/Register'))
const Dashboard    = lazy(() => import('@/pages/dashboard/Dashboard'))
const Analyze      = lazy(() => import('@/pages/analysis/Analyze'))
const Results      = lazy(() => import('@/pages/analysis/Results'))
const Reports      = lazy(() => import('@/pages/reports/Reports'))
const ReportDetail = lazy(() => import('@/pages/reports/ReportDetail'))
const Settings     = lazy(() => import('@/pages/settings/Settings'))

// ── Page suspense fallback ───────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-900">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-white/30 text-sm animate-pulse">Loading...</p>
      </div>
    </div>
  )
}

// ── Router definition ────────────────────────────────────────────────────────
// Phase 1: No auth guards — all routes open for verification
// Phase 2: Add PublicRoute and ProtectedRoute wrappers
const router = createBrowserRouter([
  {
    // Public landing page
    path: '/',
    element: (
      <Suspense fallback={<PageLoader />}>
        <Landing />
      </Suspense>
    ),
  },
  {
    // Auth pages (no shell layout)
    path: '/auth/login',
    element: (
      <Suspense fallback={<PageLoader />}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: '/auth/register',
    element: (
      <Suspense fallback={<PageLoader />}>
        <Register />
      </Suspense>
    ),
  },
  {
    // App shell wraps all dashboard-level pages
    element: <AppShell />,
    children: [
      {
        path: '/dashboard',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Dashboard />
          </Suspense>
        ),
      },
      {
        path: '/analyze',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Analyze />
          </Suspense>
        ),
      },
      {
        path: '/analyze/:requestId/results',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Results />
          </Suspense>
        ),
      },
      {
        path: '/reports',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Reports />
          </Suspense>
        ),
      },
      {
        path: '/reports/:reportId',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ReportDetail />
          </Suspense>
        ),
      },
      {
        path: '/settings',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Settings />
          </Suspense>
        ),
      },
    ],
  },
  // Fallback — redirect unknown paths to landing
  { path: '*', element: <Navigate to="/" replace /> },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
