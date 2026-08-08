/** Login page — Obrix Light Design System */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react'
import useAuthStore from '@/store/authStore'

export default function Login() {
  const navigate = useNavigate()
  const { login, isLoading, error, clearError } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })

  const handleChange = (e) => {
    clearError()
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await login(form.email, form.password)
    if (result.success) navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F6F8FC] bg-gis-grid px-4 py-12 font-sans relative overflow-hidden">
      
      {/* Background Soft Radial Aura */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="w-[600px] h-[600px] bg-[#315CF5]/5 rounded-full blur-[100px]" />
      </div>

      {/* Decorative Technical GIS Annotations */}
      <div className="absolute top-6 left-8 font-mono text-[9px] font-bold text-[#8A94A3] tracking-widest opacity-60 pointer-events-none hidden sm:block">
        23.0225° N · 72.5714° E
      </div>
      <div className="absolute top-6 right-8 font-mono text-[9px] font-bold text-[#8A94A3] tracking-widest opacity-60 pointer-events-none hidden sm:block">
        OBRIX / SECURE ACCESS
      </div>
      <div className="absolute bottom-6 left-8 font-mono text-[9px] font-bold text-[#8A94A3] tracking-widest opacity-60 pointer-events-none hidden sm:block">
        LOCATION INTELLIGENCE PLATFORM
      </div>

      <div className="relative w-full max-w-[450px] z-10 space-y-6">
        
        {/* Brand Mark & Header */}
        <div className="flex flex-col items-center text-center">
          <Link to="/" className="mb-3">
            <img src="/obrix-logo.png" alt="Obrix Logo" className="h-10 w-auto object-contain" />
          </Link>
          <span className="text-[10px] font-mono font-bold text-[#315CF5] uppercase tracking-wider block mb-1">
            OBRIX / SECURE ACCESS
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#08111F] font-sans tracking-tight">
            Welcome back
          </h1>
          <p className="text-xs sm:text-sm text-[#5D6675] font-sans mt-1 font-normal">
            Sign in to your Obrix account
          </p>
        </div>

        {/* Auth Form Card */}
        <div className="bg-white border border-[#DDE3EC] rounded-2xl p-7 sm:p-8 shadow-md">
          {error && (
            <div className="bg-[#FEE2E2] border border-red-200 text-red-700 text-xs font-semibold px-4 py-3 rounded-xl mb-5 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="login-email" className="block text-xs font-extrabold text-[#08111F]">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full h-[46px] px-4 text-xs rounded-xl bg-[#F8FAFC] border border-[#DDE3EC] text-[#08111F] placeholder-[#8A94A3] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#315CF5]/20 focus:border-[#315CF5] hover:border-[#315CF5]/35 transition-all font-sans font-medium shadow-2xs"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="login-password" className="block text-xs font-extrabold text-[#08111F]">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full h-[46px] px-4 text-xs rounded-xl bg-[#F8FAFC] border border-[#DDE3EC] text-[#08111F] placeholder-[#8A94A3] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#315CF5]/20 focus:border-[#315CF5] hover:border-[#315CF5]/35 transition-all font-sans font-medium shadow-2xs"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[48px] rounded-xl bg-[#315CF5] hover:bg-[#2448D8] disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-[#315CF5]/20 flex items-center justify-center gap-2 transition-all cursor-pointer font-sans mt-3"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Account Switch Link Footer */}
          <div className="border-t border-[#E8ECF2] pt-4 mt-5">
            <p className="text-center text-xs text-[#8A94A3] font-medium font-sans">
              Don't have an account?{' '}
              <Link to="/auth/register" className="text-[#315CF5] hover:text-[#2448D8] font-bold transition-colors ml-1">
                Create one
              </Link>
            </p>
          </div>
        </div>

        {/* Technical Trust Footer */}
        <div className="flex items-center justify-center gap-2 text-[9px] font-mono font-bold text-[#8A94A3] uppercase tracking-wider text-center">
          <span className="w-1.5 h-1.5 rounded-full bg-[#43B96B]" />
          <span>SECURE OBRIX WORKSPACE</span>
        </div>
      </div>
    </div>
  )
}
