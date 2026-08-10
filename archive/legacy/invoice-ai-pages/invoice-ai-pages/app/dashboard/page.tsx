// app/dashboard/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase, getUserInvoices, getUserProfile } from '@/lib/supabase'
import { canCreateInvoice } from '@/lib/stripe'
import { redirectToCheckout } from '@/lib/stripe'
import type { Invoice, UserProfile } from '@/types'

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/'; return }

      const [inv, prof] = await Promise.all([
        getUserInvoices(user.id),
        getUserProfile(user.id),
      ])
      setInvoices(inv || [])
      setProfile(prof)
      setLoading(false)
    }
    load()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
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

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <div className="font-serif text-xl font-bold text-gray-900">
          Invoice<span className="text-yellow-500 italic">AI</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 uppercase tracking-wide">
            {profile?.plan || 'free'} plan
          </span>
          {profile?.plan === 'free' && (
            <button
              onClick={() => redirectToCheckout('pro', profile?.id || '', profile?.email || '')}
              className="text-xs bg-yellow-500 text-black font-bold px-3 py-1.5 rounded-lg hover:bg-yellow-400 transition-colors"
            >
              Upgrade to Pro ✦
            </button>
          )}
          <button onClick={signOut} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-10">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-5 mb-8">
          {[
            { label: 'Total invoices', value: stats.total },
            { label: 'Paid invoices', value: stats.paid },
            { label: 'Outstanding', value: `€${stats.outstanding.toFixed(2)}` },
          ].map(s => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Free plan limit warning */}
        {profile?.plan === 'free' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-6 flex items-center justify-between">
            <p className="text-sm text-amber-800">
              <strong>{thisMonthCount}/3</strong> invoices used this month on free plan.
              {!canCreate && ' You\'ve reached your limit.'}
            </p>
            {!canCreate && (
              <button
                onClick={() => redirectToCheckout('pro', profile?.id || '', profile?.email || '')}
                className="text-xs bg-yellow-500 text-black font-bold px-3 py-1.5 rounded-lg hover:bg-yellow-400 transition-colors whitespace-nowrap ml-4"
              >
                Upgrade to Pro →
              </button>
            )}
          </div>
        )}

        {/* Invoices table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Your Invoices</h2>
            <button
              onClick={() => canCreate ? window.location.href = '/invoice/new' : null}
              disabled={!canCreate}
              className="text-sm bg-gray-900 text-white font-semibold px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              + New Invoice
            </button>
          </div>

          {invoices.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">📄</p>
              <p className="font-medium text-gray-600 mb-1">No invoices yet</p>
              <p className="text-sm">Create your first invoice to get started</p>
              <button
                onClick={() => window.location.href = '/invoice/new'}
                className="mt-5 text-sm bg-yellow-500 text-black font-bold px-5 py-2.5 rounded-lg hover:bg-yellow-400 transition-colors"
              >
                Create first invoice →
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="text-left px-6 py-3 font-semibold">Invoice</th>
                  <th className="text-left px-6 py-3 font-semibold">Client</th>
                  <th className="text-left px-6 py-3 font-semibold">Date</th>
                  <th className="text-left px-6 py-3 font-semibold">Amount</th>
                  <th className="text-left px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono font-medium text-gray-700">{inv.invoice_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{inv.client_name || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {inv.issue_date ? new Date(inv.issue_date).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-800">€{inv.total.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${statusColor[inv.status]}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => window.location.href = `/invoice/${inv.id}`}
                        className="text-xs text-gray-400 hover:text-gray-700 font-medium transition-colors"
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}
