// app/dashboard/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUserInvoices, getUserProfile } from '@/lib/supabase'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { canCreateInvoice } from '@/lib/stripe'
import { redirectToCheckout } from '@/lib/stripe'
import type { Invoice, UserProfile } from '@/types'

const supabase = createBrowserSupabaseClient()

export default function DashboardPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [configError, setConfigError] = useState('')

  useEffect(() => {
    async function load() {
      if (!supabase) {
        setConfigError('Supabase is not configured yet. Add your real project URL and anon key to .env.local, then restart the dev server.')
        setLoading(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const [inv, prof] = await Promise.all([
        getUserInvoices(user.id),
        getUserProfile(user.id),
      ])
      setInvoices(inv || [])
      setProfile(prof)
      setLoading(false)
    }
    load()
  }, [router])

  async function signOut() {
    if (!supabase) {
      router.push('/')
      return
    }

    await supabase.auth.signOut()
    router.push('/')
  }

  const thisMonthCount = invoices.filter(inv => {
    const d = new Date(inv.created_at!)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  const canCreate = canCreateInvoice(profile?.plan || 'free', thisMonthCount)

  const stats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'paid').length,
    outstanding: invoices.filter(i => i.status === 'sent' || i.status === 'overdue')
      .reduce((s, i) => s + i.total, 0),
  }

  const statusColor: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    sent: 'bg-blue-100 text-blue-700',
    paid: 'bg-green-100 text-green-700',
    overdue: 'bg-red-100 text-red-700',
  }

  if (loading) return (
    <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
    </div>
  )

  if (configError) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center px-6">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Supabase configuration required</h1>
          <p className="text-sm text-gray-600">{configError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Header */}
      <header className="flex flex-col gap-3 border-b border-gray-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="font-serif text-xl font-bold text-gray-900">
          Invoice<span className="text-yellow-500 italic">AI</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-yellow-700 sm:text-xs">
            {profile?.plan || 'free'} plan
          </span>
          {profile?.plan === 'free' && (
            <button
              onClick={() => redirectToCheckout('pro', profile?.id || '', profile?.email || '')}
              className="rounded-lg bg-yellow-500 px-3 py-1.5 text-[10px] font-bold text-black transition-colors hover:bg-yellow-400 sm:text-xs"
            >
              Upgrade to Pro ✦
            </button>
          )}
          <button onClick={signOut} className="text-sm text-gray-400 transition-colors hover:text-gray-600">
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
        {/* Stats row */}
        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5">
          {[
            { label: 'Total invoices', value: stats.total },
            { label: 'Paid invoices', value: stats.paid },
            { label: 'Outstanding', value: `€${stats.outstanding.toFixed(2)}` },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Free plan limit warning */}
        {profile?.plan === 'free' && (
          <div className="mb-6 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-amber-800">
              <strong>{thisMonthCount}/3</strong> invoices used this month on free plan.
              {!canCreate && ' You\'ve reached your limit.'}
            </p>
            {!canCreate && (
              <button
                onClick={() => redirectToCheckout('pro', profile?.id || '', profile?.email || '')}
                className="ml-0 whitespace-nowrap rounded-lg bg-yellow-500 px-3 py-1.5 text-[10px] font-bold text-black transition-colors hover:bg-yellow-400 sm:ml-4 sm:text-xs"
              >
                Upgrade to Pro →
              </button>
            )}
          </div>
        )}

        {/* Invoices table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <h2 className="font-semibold text-gray-800">Your Invoices</h2>
            <button
              onClick={() => canCreate ? window.location.href = '/invoice/new' : null}
              disabled={!canCreate}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              + New Invoice
            </button>
          </div>

          {invoices.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <p className="mb-3 text-4xl">📄</p>
              <p className="mb-1 font-medium text-gray-600">No invoices yet</p>
              <p className="text-sm">Create your first invoice to get started</p>
              <button
                onClick={() => window.location.href = '/invoice/new'}
                className="mt-5 rounded-lg bg-yellow-500 px-5 py-2.5 text-sm font-bold text-black transition-colors hover:bg-yellow-400"
              >
                Create first invoice →
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[720px] w-full">
                <thead>
                  <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                    <th className="px-6 py-3 text-left font-semibold">Invoice</th>
                    <th className="px-6 py-3 text-left font-semibold">Client</th>
                    <th className="px-6 py-3 text-left font-semibold">Date</th>
                    <th className="px-6 py-3 text-left font-semibold">Amount</th>
                    <th className="px-6 py-3 text-left font-semibold">Status</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="transition-colors hover:bg-gray-50/50">
                      <td className="px-6 py-4 text-sm font-mono font-medium text-gray-700">{inv.invoice_number}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{inv.client_name || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {inv.issue_date ? new Date(inv.issue_date).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-800">€{inv.total.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${statusColor[inv.status]}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => window.location.href = `/invoice/${inv.id}`}
                          className="text-xs font-medium text-gray-400 transition-colors hover:text-gray-700"
                        >
                          View →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
