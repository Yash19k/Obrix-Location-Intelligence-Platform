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
import useAuthStore from '@/store/authStore'

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
const AskObrix      = lazy(() => import('@/pages/ai/AskObrix'))


// ── Page suspense fallback ───────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F8FC] bg-gis-grid font-sans">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-[#8A94A3] font-mono text-xs font-bold animate-pulse">OBRIX / LOADING PAGE...</p>
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
    <div className="min-h-screen flex items-center justify-center bg-[#F6F8FC] bg-gis-grid p-6 font-sans">
      <div className="max-w-md w-full p-7 rounded-2xl bg-white border border-[#DDE3EC] shadow-xl text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#FEE2E2] border border-red-200 text-red-600 flex items-center justify-center mx-auto shadow-2xs">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-mono font-bold text-[#8A94A3] uppercase tracking-wider block">
            OBRIX / SYSTEM ERROR
          </span>
          <h2 className="text-lg font-extrabold text-[#08111F]">Something went wrong</h2>
          <p className="text-xs text-[#5D6675]">
            We couldn't load this page. Please try refreshing or return to the dashboard.
          </p>
        </div>
        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-[#F6F8FC] text-[#5D6675] border border-[#DDE3EC] transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Try Again
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#315CF5] hover:bg-[#2448D8] text-white shadow-md transition-all cursor-pointer"
          >
            <LayoutDashboard className="w-3.5 h-3.5" /> Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Protected & Public Route Guards ──────────────────────────────────────────
function ProtectedRoute() {
  const { accessToken } = useAuthStore()
  if (!accessToken) {
    return <Navigate to="/auth/login" replace />
  }
  return <AppShell />
}

function PublicOnlyRoute({ children }) {
  const { accessToken } = useAuthStore()
  if (accessToken) {
    return <Navigate to="/dashboard" replace />
  }
  return children
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
    // Auth pages — restricted to unauthenticated guests
    path: '/auth/login',
    errorElement: <RouteErrorElement />,
    element: (
      <PublicOnlyRoute>
        <Suspense fallback={<PageLoader />}>
          <Login />
        </Suspense>
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/auth/register',
    errorElement: <RouteErrorElement />,
    element: (
      <PublicOnlyRoute>
        <Suspense fallback={<PageLoader />}>
          <Register />
        </Suspense>
      </PublicOnlyRoute>
    ),
  },
  {
    // App shell wraps protected workspace routes
    element: <ProtectedRoute />,
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
        path: '/ask-obrix',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AskObrix />
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

