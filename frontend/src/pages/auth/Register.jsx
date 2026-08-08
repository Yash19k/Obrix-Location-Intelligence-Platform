/** Register page — Obrix Light Design System */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, ArrowRight, AlertCircle } from 'lucide-react'
import useAuthStore from '@/store/authStore'
import toast from 'react-hot-toast'

export default function Register() {
  const navigate = useNavigate()
  const { register, isLoading, error, clearError } = useAuthStore()
  const [form, setForm] = useState({ email: '', full_name: '', password: '', password2: '' })
  const [fieldErrors, setFieldErrors] = useState({})

  const handleChange = (e) => {
    clearError()
    setFieldErrors({})
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  const validate = () => {
    const errs = {}
    if (!form.full_name.trim()) errs.full_name = 'Full name is required.'
    if (!form.email.includes('@')) errs.email = 'Enter a valid email address.'
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters.'
    if (form.password !== form.password2) errs.password2 = 'Passwords do not match.'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return }

    const result = await register(form)
    if (result.success) {
      toast.success('Account created! Please sign in.')
      navigate('/auth/login')
    }
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
        OBRIX / REGISTRATION
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
            OBRIX / FREE REGISTRATION
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#08111F] font-sans tracking-tight">
            Create your account
          </h1>
          <p className="text-xs sm:text-sm text-[#5D6675] font-sans mt-1 font-normal">
            Start analyzing locations for free
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
              <label htmlFor="reg-name" className="block text-xs font-extrabold text-[#08111F]">
                Full name
              </label>
              <input
                id="reg-name"
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Jane Smith"
                required
                className={`w-full h-[46px] px-4 text-xs rounded-xl bg-[#F8FAFC] border ${
                  fieldErrors.full_name ? 'border-red-400 focus:ring-red-200' : 'border-[#DDE3EC] focus:border-[#315CF5]'
                } text-[#08111F] placeholder-[#8A94A3] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#315CF5]/20 hover:border-[#315CF5]/35 transition-all font-sans font-medium shadow-2xs`}
              />
              {fieldErrors.full_name && (
                <p className="text-[11px] font-bold text-red-600 mt-1 font-sans">{fieldErrors.full_name}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="reg-email" className="block text-xs font-extrabold text-[#08111F]">
                Email address
              </label>
              <input
                id="reg-email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className={`w-full h-[46px] px-4 text-xs rounded-xl bg-[#F8FAFC] border ${
                  fieldErrors.email ? 'border-red-400 focus:ring-red-200' : 'border-[#DDE3EC] focus:border-[#315CF5]'
                } text-[#08111F] placeholder-[#8A94A3] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#315CF5]/20 hover:border-[#315CF5]/35 transition-all font-sans font-medium shadow-2xs`}
              />
              {fieldErrors.email && (
                <p className="text-[11px] font-bold text-red-600 mt-1 font-sans">{fieldErrors.email}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="reg-password" className="block text-xs font-extrabold text-[#08111F]">
                Password
              </label>
              <input
                id="reg-password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Min. 8 characters"
                required
                className={`w-full h-[46px] px-4 text-xs rounded-xl bg-[#F8FAFC] border ${
                  fieldErrors.password ? 'border-red-400 focus:ring-red-200' : 'border-[#DDE3EC] focus:border-[#315CF5]'
                } text-[#08111F] placeholder-[#8A94A3] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#315CF5]/20 hover:border-[#315CF5]/35 transition-all font-sans font-medium shadow-2xs`}
              />
              {fieldErrors.password && (
                <p className="text-[11px] font-bold text-red-600 mt-1 font-sans">{fieldErrors.password}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="reg-password2" className="block text-xs font-extrabold text-[#08111F]">
                Confirm password
              </label>
              <input
                id="reg-password2"
                type="password"
                name="password2"
                value={form.password2}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className={`w-full h-[46px] px-4 text-xs rounded-xl bg-[#F8FAFC] border ${
                  fieldErrors.password2 ? 'border-red-400 focus:ring-red-200' : 'border-[#DDE3EC] focus:border-[#315CF5]'
                } text-[#08111F] placeholder-[#8A94A3] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#315CF5]/20 hover:border-[#315CF5]/35 transition-all font-sans font-medium shadow-2xs`}
              />
              {fieldErrors.password2 && (
                <p className="text-[11px] font-bold text-red-600 mt-1 font-sans">{fieldErrors.password2}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[48px] rounded-xl bg-[#315CF5] hover:bg-[#2448D8] disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-[#315CF5]/20 flex items-center justify-center gap-2 transition-all cursor-pointer font-sans mt-3"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Account Switch Link Footer */}
          <div className="border-t border-[#E8ECF2] pt-4 mt-5">
            <p className="text-center text-xs text-[#8A94A3] font-medium font-sans">
              Already have an account?{' '}
              <Link to="/auth/login" className="text-[#315CF5] hover:text-[#2448D8] font-bold transition-colors ml-1">
                Sign in
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
