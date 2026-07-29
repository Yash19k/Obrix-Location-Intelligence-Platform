/**
 * Dashboard — shows recent analyses and quick stats.
 *
 * Phase 1: Works without authentication. Handles API errors gracefully.
 * Phase 2: Will require a valid JWT token via ProtectedRoute.
 */

import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Plus, TrendingUp, BarChart2, Clock, ArrowRight, Zap } from 'lucide-react'
import useAnalysisStore from '@/store/analysisStore'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'

export default function Dashboard() {
  const { requests, fetchList, isLoading } = useAnalysisStore()

  useEffect(() => {
    // Attempt to fetch — will silently fail without auth in Phase 1
    fetchList()
  }, [])

  const completedRequests = requests.filter((r) => r.status === 'completed')
  const avgScore =
    completedRequests.length > 0
      ? Math.round(
          completedRequests.reduce(
            (s, r) => s + parseFloat(r.result?.site_readiness_score || 0),
            0
          ) / completedRequests.length
        )
      : null

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Dashboard</h1>
          <p className="text-white/40 text-sm mt-1">
            {requests.length > 0
              ? `${requests.length} ${requests.length === 1 ? 'analysis' : 'analyses'} found`
              : 'Welcome to Obrix — start your first analysis'}
          </p>
        </div>
        <Link to="/analyze" id="dashboard-new-analysis-btn" className="btn-primary">
          <Plus className="w-4 h-4" />
          New Analysis
        </Link>
      </div>

      {/* ── Stats Row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
            <BarChart2 className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{requests.length}</p>
            <p className="text-xs text-white/40">Total Analyses</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-accent-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{avgScore ?? '—'}</p>
            <p className="text-xs text-white/40">Average Score</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{completedRequests.length}</p>
            <p className="text-xs text-white/40">Completed</p>
          </div>
        </Card>
      </div>

      {/* ── Quick Actions ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/analyze"
          id="dashboard-quick-analyze-btn"
          className="glass-card p-5 flex items-center gap-4 hover:bg-white/10 transition-all duration-200 group border-brand-500/20 hover:border-brand-500/40"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
            <MapPin className="w-5 h-5 text-brand-400" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Analyze a Location</p>
            <p className="text-xs text-white/35 mt-0.5">Enter coordinates and get a Site Readiness Score</p>
          </div>
          <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-brand-400 transition-colors" />
        </Link>

        <Link
          to="/reports"
          id="dashboard-quick-reports-btn"
          className="glass-card p-5 flex items-center gap-4 hover:bg-white/10 transition-all duration-200 group"
        >
          <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Zap className="w-5 h-5 text-accent-400" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">View Reports</p>
            <p className="text-xs text-white/35 mt-0.5">Comparison reports and PDF exports</p>
          </div>
          <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-accent-400 transition-colors" />
        </Link>
      </div>

      {/* ── Recent Analyses ──────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Analyses</h2>
          <Link
            to="/analyze"
            className="text-brand-400 hover:text-brand-300 text-sm flex items-center gap-1 transition-colors"
          >
            New <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : requests.length === 0 ? (
          <Card className="text-center py-16">
            <MapPin className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm font-medium">No analyses yet</p>
            <p className="text-white/20 text-xs mt-1 mb-5">
              Run your first location analysis to see results here.
            </p>
            <Link to="/analyze" id="dashboard-empty-analyze-btn" className="btn-primary text-sm py-2">
              <Plus className="w-3.5 h-3.5" />
              Start First Analysis
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {requests.slice(0, 8).map((req) => (
              <Link
                key={req.id}
                to={`/analyze/${req.id}/results`}
                className="glass-card p-4 flex items-center gap-4 hover:bg-white/10 transition-all duration-200 group"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {req.business_type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())} ·{' '}
                    <span className="text-white/40 font-mono text-xs">
                      {parseFloat(req.latitude).toFixed(4)},{' '}
                      {parseFloat(req.longitude).toFixed(4)}
                    </span>
                  </p>
                  <p className="text-xs text-white/30 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {new Date(req.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {req.result?.site_readiness_score && (
                    <>
                      <span className="text-xl font-bold text-gradient">
                        {parseFloat(req.result.site_readiness_score).toFixed(0)}
                      </span>
                      <Badge score={parseFloat(req.result.site_readiness_score)} />
                    </>
                  )}
                  {req.status !== 'completed' && (
                    <span className="badge-fair capitalize">{req.status}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
