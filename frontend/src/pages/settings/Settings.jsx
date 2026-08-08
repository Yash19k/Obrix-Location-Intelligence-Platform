import { useState, useEffect } from 'react'
import { User, Mail, Lock, Check, Sparkles, ShieldCheck, AlertCircle } from 'lucide-react'
import useAuthStore from '@/store/authStore'
import authService from '@/services/authService'
import toast from 'react-hot-toast'

export default function Settings() {
  const { user, updateUser } = useAuthStore()
  const [name, setName] = useState(user?.full_name || '')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Sync name field if user changes
  useEffect(() => {
    if (user?.full_name) setName(user.full_name)
  }, [user])

  const handleSave = async () => {
    if (!user) {
      toast.error('Sign in to update your profile.')
      return
    }
    setIsSaving(true)
    setSaveSuccess(false)
    try {
      const { data } = await authService.updateProfile({ full_name: name })
      updateUser(data)
      setSaveSuccess(true)
      toast.success('Profile updated successfully.')
      setTimeout(() => setSaveSuccess(false), 3500)
    } catch {
      toast.error('Failed to update profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl font-sans relative">

      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="space-y-1">
        <span className="text-[10px] font-mono font-bold text-[#315CF5] uppercase tracking-wider block">
          SETTINGS / ACCOUNT CONFIGURATION
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#08111F] font-sans">
          Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#5D6675] font-sans font-normal">
          Manage your account profile and platform preferences.
        </p>
      </div>

      {/* ── Profile Card ──────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#DDE3EC] rounded-2xl p-6 sm:p-7 space-y-6 shadow-2xs">
        
        {/* Profile Card Header */}
        <div className="flex items-center gap-3 border-b border-[#E8ECF2] pb-4">
          <div className="w-10 h-10 rounded-xl bg-[#E9EFFF] border border-[#315CF5]/20 text-[#315CF5] flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-[#8A94A3] uppercase tracking-wider block">
              ACCOUNT PROFILE
            </span>
            <h2 className="text-base font-extrabold text-[#08111F] font-sans">Profile Details</h2>
            <p className="text-xs text-[#5D6675]">Manage your personal name and account identity.</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="max-w-xl space-y-5">
          
          {/* Full Name Input */}
          <div className="space-y-1">
            <span className="text-[9px] font-mono font-bold text-[#8A94A3] uppercase tracking-wider block">
              ACCOUNT / NAME
            </span>
            <label htmlFor="settings-name" className="block text-xs font-extrabold text-[#08111F]">
              Full Name
            </label>
            <input
              id="settings-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              disabled={!user || isSaving}
              className="w-full h-[44px] px-4 text-xs rounded-xl bg-white border border-[#DDE3EC] text-[#08111F] placeholder-[#8A94A3] focus:outline-none focus:ring-2 focus:ring-[#315CF5]/20 focus:border-[#315CF5] hover:border-[#315CF5]/35 transition-all font-sans font-medium shadow-2xs disabled:opacity-60"
            />
          </div>

          {/* Email Address Read-only Field */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono font-bold text-[#8A94A3] uppercase tracking-wider block">
                ACCOUNT / EMAIL
              </span>
              <span className="text-[9px] font-mono font-bold text-[#43B96B] bg-[#E7F7E9] px-2 py-0.5 rounded border border-[#43B96B]/20 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> VERIFIED
              </span>
            </div>
            <label className="block text-xs font-extrabold text-[#08111F]">
              Email Address
            </label>
            <div className="w-full h-[44px] px-4 text-xs rounded-xl bg-[#F6F8FC] border border-[#E8ECF2] text-[#5D6675] flex items-center justify-between font-mono font-medium shadow-2xs cursor-not-allowed">
              <div className="flex items-center gap-2 min-w-0 truncate">
                <Mail className="w-4 h-4 text-[#8A94A3] shrink-0" />
                <span className="truncate">{user?.email || 'Not signed in'}</span>
              </div>
              <Lock className="w-3.5 h-3.5 text-[#8A94A3] shrink-0 ml-2" />
            </div>
            <p className="text-[10px] font-mono text-[#8A94A3] font-bold mt-1">
              Email address is managed via authentication security and cannot be changed here.
            </p>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex items-center gap-4">
            <button
              id="settings-save-btn"
              onClick={handleSave}
              disabled={!user || isSaving}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-[#315CF5] hover:bg-[#2448D8] text-white shadow-md transition-all duration-200 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" /> Save Changes
                </>
              )}
            </button>

            {saveSuccess && (
              <span className="text-xs font-bold text-[#43B96B] flex items-center gap-1 font-mono">
                <Check className="w-4 h-4" /> Profile updated
              </span>
            )}
          </div>

        </div>
      </div>

      {/* ── Application Info Card ─────────────────────────────────────────── */}
      <div className="bg-white border border-[#DDE3EC] rounded-xl p-4 shadow-2xs flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-[9px] font-mono font-bold text-[#8A94A3] uppercase tracking-wider block">
            APPLICATION VERSION
          </span>
          <p className="text-xs font-extrabold text-[#5D6675] font-sans">Obrix Platform</p>
        </div>

        <span className="text-xs font-mono font-bold text-[#315CF5] bg-[#E9EFFF] border border-[#315CF5]/20 px-3 py-1 rounded-lg">
          OBRIX / v1.0.0
        </span>
      </div>

    </div>
  )
}
