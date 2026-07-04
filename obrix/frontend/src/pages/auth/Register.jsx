/** Register page */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, ArrowRight, CheckCircle } from 'lucide-react'
import useAuthStore from '@/store/authStore'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
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
    <div className="min-h-screen flex items-center justify-center bg-surface-900 px-4 py-12">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] bg-brand-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-glow-lg mb-4">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-white/40 text-sm mt-1">Start analyzing locations for free</p>
        </div>

        <div className="glass-card p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="reg-name"
              label="Full name"
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="Jane Smith"
              error={fieldErrors.full_name}
              required
            />
            <Input
              id="reg-email"
              label="Email address"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              error={fieldErrors.email}
              required
            />
            <Input
              id="reg-password"
              label="Password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min. 8 characters"
              error={fieldErrors.password}
              required
            />
            <Input
              id="reg-password2"
              label="Confirm password"
              type="password"
              name="password2"
              value={form.password2}
              onChange={handleChange}
              placeholder="••••••••"
              error={fieldErrors.password2}
              required
            />

            <Button type="submit" isLoading={isLoading} className="w-full mt-2">
              Create Account
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="divider mt-6" />
          <p className="text-center text-sm text-white/40 mt-4">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
