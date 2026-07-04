/**
 * Landing page — public entry point for Obrix.
 *
 * Phase 1 requirements:
 *  - Show "Obrix" heading
 *  - Show "Intelligent Location Intelligence Platform" tagline
 *  - Button that navigates directly to /dashboard (no auth in Phase 1)
 *
 * Phase 2 will add real Sign In / Register CTAs with auth guards.
 */

import { Link } from 'react-router-dom'
import { MapPin, Zap, BarChart2, Shield, ArrowRight, CheckCircle, Activity } from 'lucide-react'

const FEATURES = [
  {
    icon: MapPin,
    title: 'Geospatial Analysis',
    desc: 'Analyze any location using real-world OpenStreetMap data — roads, buildings, and nearby amenities.',
    color: 'text-brand-400',
    bg: 'bg-brand-500/10',
    border: 'border-brand-500/20',
  },
  {
    icon: BarChart2,
    title: 'Site Readiness Score',
    desc: 'Get a 0–100 composite score across 5 factors: accessibility, population, competition, infrastructure & land use.',
    color: 'text-accent-400',
    bg: 'bg-accent-500/10',
    border: 'border-accent-500/20',
  },
  {
    icon: Zap,
    title: 'AI-Powered Insights',
    desc: 'Receive prioritized recommendations and actionable insights tailored to your specific business type.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  {
    icon: Shield,
    title: 'Multiple Business Types',
    desc: 'Custom scoring profiles for retail, hospitals, EV stations, warehouses, telecom towers and more.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
]

const STATS = [
  { value: '5+', label: 'Geospatial Factors' },
  { value: '0–100', label: 'Site Readiness Score' },
  { value: '7', label: 'Business Types' },
  { value: 'Real', label: 'OSM Data' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-surface-900 overflow-x-hidden">

      {/* ── Top Navigation ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-surface-900/90 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black text-gradient tracking-tight">Obrix</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/auth/login"
            id="nav-login-btn"
            className="btn-ghost text-sm py-2 px-4"
          >
            Sign in
          </Link>
          <Link
            to="/dashboard"
            id="nav-dashboard-btn"
            className="btn-primary text-sm py-2 px-4"
          >
            Open Dashboard
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* ── Hero Section ───────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center min-h-screen text-center px-6 pt-20">

        {/* Ambient background glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-brand-600/10 rounded-full blur-[130px]" />
          <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] bg-accent-500/5 rounded-full blur-[80px]" />
          <div className="absolute top-1/3 right-1/4 w-[250px] h-[250px] bg-purple-500/5 rounded-full blur-[80px]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto animate-slide-up">
          {/* Status badge */}
          <div className="inline-flex items-center gap-2 glass-card px-4 py-1.5 mb-8 text-sm text-brand-400 border border-brand-500/20">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>AI-Powered Location Intelligence · Phase 1</span>
          </div>

          {/* Main heading — the two required lines */}
          <h1 className="text-6xl sm:text-8xl font-black tracking-tight mb-4 leading-[0.9]">
            <span className="text-gradient">Obrix</span>
          </h1>

          <p className="text-xl sm:text-2xl font-medium text-white/60 mb-4 tracking-wide">
            Intelligent Location Intelligence Platform
          </p>

          <p className="text-base text-white/35 max-w-2xl mx-auto mb-12 leading-relaxed">
            Analyze any location on Earth with AI-powered geospatial insights. Input coordinates,
            get a Site Readiness Score, and receive actionable recommendations — in seconds.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/dashboard"
              id="hero-open-dashboard-btn"
              className="btn-primary text-base px-8 py-3.5 animate-pulse-glow"
            >
              <MapPin className="w-5 h-5" />
              Open Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/analyze"
              id="hero-analyze-btn"
              className="btn-ghost text-base px-8 py-3.5"
            >
              Try Analysis Now
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20 animate-bounce">
          <span className="text-xs tracking-widest uppercase">Explore</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/20 to-transparent" />
        </div>
      </section>

      {/* ── Stats Row ──────────────────────────────────────────────────────── */}
      <section className="py-12 px-6 border-y border-white/5">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-black text-gradient mb-1">{value}</p>
              <p className="text-xs text-white/30 uppercase tracking-widest">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature Grid ───────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything you need for{' '}
              <span className="text-gradient">smarter site selection</span>
            </h2>
            <p className="text-white/35 max-w-xl mx-auto text-base">
              From raw GPS coordinates to a full intelligence report — powered by real geospatial data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, color, bg, border }) => (
              <div
                key={title}
                className={`glass-card p-7 hover:bg-white/8 transition-all duration-300 group border ${border}`}
              >
                <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <h3 className="text-lg font-bold mb-2">{title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">
            Three steps to your <span className="text-gradient">Site Readiness Score</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Drop a Pin', desc: 'Enter coordinates or click any location on the interactive map.' },
              { step: '02', title: 'Choose Type', desc: 'Select your business type — retail, hospital, EV station, and more.' },
              { step: '03', title: 'Get Insights', desc: 'Receive a 0–100 Site Readiness Score with AI-powered recommendations.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="relative">
                <div className="text-5xl font-black text-white/5 mb-3 font-mono">{step}</div>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-white/35 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto gradient-border glass-card p-14 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-glow-lg mx-auto mb-6">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black mb-4">
            Ready to find your<br />
            <span className="text-gradient">ideal location?</span>
          </h2>
          <p className="text-white/35 mb-8 text-base">
            Start analyzing locations with real geospatial intelligence.
          </p>
          <Link
            to="/dashboard"
            id="cta-dashboard-btn"
            className="btn-primary text-base px-10 py-4"
          >
            <MapPin className="w-5 h-5" />
            Go to Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-brand flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-gradient">Obrix</span>
          </div>
          <p className="text-white/20 text-sm">
            © 2026 Obrix — Intelligent Location Intelligence Platform
          </p>
          <p className="text-white/15 text-xs font-mono">Phase 1 · Foundation</p>
        </div>
      </footer>

    </div>
  )
}
