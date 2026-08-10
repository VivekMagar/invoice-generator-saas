'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthFormShell } from '@/components/auth-form-shell'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

const supabase = createBrowserSupabaseClient()

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess('Account created. Please check your email and confirm your address to continue.')
    setEmail('')
    setPassword('')
    setLoading(false)
    router.refresh()
  }

  return (
    <AuthFormShell
      title="Create your account"
      subtitle="Get started with InvoiceAI and unlock your dashboard."
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

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full bg-white/8 border border-white/15 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-yellow-500/60 transition-colors"
            placeholder="At least 8 characters"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && <p className="text-sm text-emerald-300">{success}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-yellow-500 text-black font-bold py-2.5 rounded-lg text-sm hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating account…' : 'Create free account →'}
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-400 text-center">
        Already have an account?{' '}
        <Link href="/login" className="text-yellow-400 hover:text-yellow-300">
          Log in
        </Link>
      </p>
    </AuthFormShell>
  )
}
