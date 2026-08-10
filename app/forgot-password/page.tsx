'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { AuthFormShell } from '@/components/auth-form-shell'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

const supabase = createBrowserSupabaseClient()

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess('Check your email for a password reset link.')
    setEmail('')
    setLoading(false)
  }

  return (
    <AuthFormShell
      title="Reset your password"
      subtitle="Enter the email linked to your account and we’ll send you a secure reset link."
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full bg-white/8 border border-white/15 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-yellow-500/60 transition-colors"
            placeholder="you@example.com"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && <p className="text-sm text-emerald-300">{success}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-yellow-500 text-black font-bold py-2.5 rounded-lg text-sm hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending…' : 'Send reset link →'}
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-400 text-center">
        Remembered it?{' '}
        <Link href="/login" className="text-yellow-400 hover:text-yellow-300">
          Back to login
        </Link>
      </p>
    </AuthFormShell>
  )
}
