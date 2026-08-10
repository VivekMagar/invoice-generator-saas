'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthFormShell } from '@/components/auth-form-shell'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

const supabase = createBrowserSupabaseClient()

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function exchangeCode() {
      if (!supabase) {
        setError('Supabase is not configured yet. Add your real project URL and anon key to .env.local, then restart the dev server.')
        setReady(true)
        return
      }

      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href)
      if (error) {
        setError('Your reset link is invalid or has expired. Please request a new one.')
      }
      setReady(true)
    }

    exchangeCode()
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!supabase) {
      setError('Supabase is not configured yet. Add your real project URL and anon key to .env.local, then restart the dev server.')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess('Password updated successfully. Redirecting you to login…')
    setLoading(false)
    setTimeout(() => router.push('/login'), 1200)
  }

  return (
    <AuthFormShell
      title="Choose a new password"
      subtitle="Set a strong password for your account."
    >
      {ready ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">
              New password
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full bg-white/8 border border-white/15 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-yellow-500/60 transition-colors"
              placeholder="At least 8 characters"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">
              Confirm password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full bg-white/8 border border-white/15 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-yellow-500/60 transition-colors"
              placeholder="Repeat your password"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {success && <p className="text-sm text-emerald-300">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-500 text-black font-bold py-2.5 rounded-lg text-sm hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating…' : 'Update password →'}
          </button>
        </form>
      ) : (
        <div className="flex items-center justify-center py-6">
          <div className="w-6 h-6 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
        </div>
      )}

      <p className="mt-4 text-sm text-gray-400 text-center">
        <Link href="/login" className="text-yellow-400 hover:text-yellow-300">
          Return to login
        </Link>
      </p>
    </AuthFormShell>
  )
}
