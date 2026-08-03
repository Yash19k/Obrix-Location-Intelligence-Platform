import { useState, useEffect } from 'react'
import { User, Mail } from 'lucide-react'
import useAuthStore from '@/store/authStore'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import authService from '@/services/authService'
import toast from 'react-hot-toast'

export default function Settings() {
  const { user, updateUser } = useAuthStore()
  const [name, setName] = useState(user?.full_name || '')
  const [isSaving, setIsSaving] = useState(false)

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
    try {
      const { data } = await authService.updateProfile({ full_name: name })
      updateUser(data)
      toast.success('Profile updated successfully.')
    } catch {
      toast.error('Failed to update profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="section-title">Settings</h1>
        <p className="text-white/40 text-sm mt-1">Manage your account and preferences.</p>
      </div>

      {/* ── Profile Section ──────────────────────────────────────────────────── */}
      <Card className="space-y-5">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
            <User className="w-4 h-4 text-brand-400" />
          </div>
          <h2 className="font-semibold">Profile</h2>
        </div>

        <Input
          id="settings-name"
          label="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
          disabled={!user}
        />

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-white/40">
            Email Address
          </label>
          <div className="input-field opacity-50 cursor-not-allowed flex items-center gap-2 text-white/50">
            <Mail className="w-4 h-4 text-white/30 flex-shrink-0" />
            <span>{user?.email || 'Not signed in'}</span>
          </div>
          <p className="text-xs text-white/20">Email address cannot be changed.</p>
        </div>

        <Button
          id="settings-save-btn"
          onClick={handleSave}
          isLoading={isSaving}
          disabled={!user}
          variant="primary"
        >
          Save Changes
        </Button>
      </Card>

      {/* ── App Info ─────────────────────────────────────────────────────────── */}
      <Card className="flex items-center justify-between py-3">
        <p className="text-xs text-white/30">Application Version</p>
        <p className="text-xs font-mono text-white/20">obrix v1.0.0</p>
      </Card>

    </div>
  )
}

