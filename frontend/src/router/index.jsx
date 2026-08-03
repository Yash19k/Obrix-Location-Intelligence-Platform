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
import { createBrowserRouter, RouterProvider, Navigate, Outlet, useRouteError, useNavigate } from 'react-router-dom'
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react'
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
const SavedLocations = lazy(() => import('@/pages/saved/SavedLocations'))
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

// ── Production Route Error Boundary ──────────────────────────────────────────
function RouteErrorElement() {
  const error = useRouteError()
  const navigate = useNavigate()

  if (error) {
    console.error('Route ErrorBoundary caught an exception:', error)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
      <div className="max-w-md w-full p-6 rounded-2xl bg-slate-900 border border-white/10 shadow-2xl text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-100">Something went wrong</h2>
          <p className="text-xs text-slate-400">
            We couldn't load this page. Please try refreshing or return to the dashboard.
          </p>
        </div>
        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Try Again
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/30 transition-all cursor-pointer"
          >
            <LayoutDashboard className="w-3.5 h-3.5" /> Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Router definition ────────────────────────────────────────────────────────
const router = createBrowserRouter([
  {
    // Public landing page
    path: '/',
    errorElement: <RouteErrorElement />,
    element: (
      <Suspense fallback={<PageLoader />}>
        <Landing />
      </Suspense>
    ),
  },
  {
    // Auth pages (no shell layout)
    path: '/auth/login',
    errorElement: <RouteErrorElement />,
    element: (
      <Suspense fallback={<PageLoader />}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: '/auth/register',
    errorElement: <RouteErrorElement />,
    element: (
      <Suspense fallback={<PageLoader />}>
        <Register />
      </Suspense>
    ),
  },
  {
    // App shell wraps all dashboard-level pages
    element: <AppShell />,
    errorElement: <RouteErrorElement />,
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
        path: '/saved-locations',
        element: (
          <Suspense fallback={<PageLoader />}>
            <SavedLocations />
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

