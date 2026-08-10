'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useState } from 'react'

const featureCards = [
  {
    icon: '✦',
    title: 'AI auto-fill',
    desc: 'Type one sentence. Claude AI expands it into professional line items with accurate rates.',
  },
  {
    icon: '⬇',
    title: 'Instant PDF export',
    desc: 'Download a pixel-perfect PDF or send directly to your client via email in one click.',
  },
  {
    icon: '✉',
    title: 'Follow-up emails',
    desc: 'AI writes polite follow-up emails for unpaid invoices. Never chase payments awkwardly again.',
  },
]

const FREE_DEMO_LIMIT = 10
const FREE_DEMO_STORAGE_KEY = 'invoice-ai-demo-usage'

type DemoItem = {
  description: string
  quantity: number
  unitPrice: number
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(value)
}

function buildDemoInvoice(description: string): DemoItem[] {
  const phrases = description
    .split(/[\n,.;]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)

  const fallbackItems = [
    'Strategy workshop',
    'Landing page copy',
    'Design revisions',
  ]

  const sourceItems = phrases.length > 0 ? phrases : fallbackItems

  return sourceItems.slice(0, 4).map((item, index) => {
    const quantity = (index % 2) + 1
    const unitPrice = 120 + (index * 45) + (item.length % 5) * 10

    return {
      description: item,
      quantity,
      unitPrice,
    }
  })
}

export default function LandingPage() {
  const [description, setDescription] = useState(
    'Design a brand kit, write an invoice proposal, and prepare a client-ready outline.'
  )
  const [freeUsage, setFreeUsage] = useState(0)
  const [demoItems, setDemoItems] = useState<DemoItem[]>([])
  const [status, setStatus] = useState('')

  useEffect(() => {
    const stored = Number(window.localStorage.getItem(FREE_DEMO_STORAGE_KEY) ?? '0')
    setFreeUsage(Number.isFinite(stored) ? stored : 0)
  }, [])

  const remainingFreeGenerations = useMemo(
    () => Math.max(FREE_DEMO_LIMIT - freeUsage, 0),
    [freeUsage]
  )

  const previewInvoiceNumber = useMemo(() => `INV-${String(freeUsage + 1).padStart(3, '0')}`, [freeUsage])

  const totalPreview = useMemo(() => {
    return demoItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  }, [demoItems])

  const dueDate = useMemo(() => {
    const date = new Date()
    date.setDate(date.getDate() + 14)
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }, [])

  function handleGenerateDemo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!description.trim()) {
      setStatus('Add a short invoice description to generate a free preview.')
      return
    }

    const nextUsage = freeUsage + 1

    if (nextUsage > FREE_DEMO_LIMIT) {
      setStatus('Free tokens are complete. Sign up to generate more invoices.')
      return
    }

    const items = buildDemoInvoice(description)
    setDemoItems(items)
    setFreeUsage(nextUsage)
    window.localStorage.setItem(FREE_DEMO_STORAGE_KEY, String(nextUsage))
    setStatus(`Invoice generated successfully. ${FREE_DEMO_LIMIT - nextUsage} free uses left.`)
  }

  return (
    <div className="min-h-screen bg-[#0d0b09] text-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div className="font-serif text-xl font-bold">
          Invoice<span className="text-yellow-400 italic">AI</span>
        </div>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="text-sm bg-yellow-500 text-black font-semibold px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors"
          >
            Get started free
          </Link>
        </div>
      </nav>

      <section className="max-w-5xl mx-auto px-8 pt-24 pb-16 text-center">
        <div className="inline-block bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6">
          ✦ AI-Powered
        </div>
        <h1 className="text-5xl font-serif font-bold leading-tight mb-6">
          Invoices that look <em className="text-yellow-400 italic">expensive.</em>
          <br />Done in seconds.
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          Stop wasting time on paperwork. InvoiceAI generates professional invoices,
          contracts & proposals — powered by Claude AI.
        </p>

        <div className="max-w-sm mx-auto bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex flex-col gap-3">
            <Link
              href="/signup"
              className="bg-yellow-500 text-black font-bold py-2.5 rounded-lg text-sm hover:bg-yellow-400 transition-colors text-center"
            >
              Create free account →
            </Link>
            <Link
              href="/login"
              className="bg-white/8 border border-white/15 rounded-lg px-4 py-2.5 text-sm text-white text-center hover:border-yellow-500/60 transition-colors"
            >
              Login to your account
            </Link>
          </div>
          <p className="text-gray-600 text-xs mt-3">No credit card required</p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-8 pb-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-yellow-400">Free preview</p>
                <h2 className="mt-2 text-2xl font-semibold">Generate invoices without signing in</h2>
              </div>
              <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-300">
                {remainingFreeGenerations} / {FREE_DEMO_LIMIT} free uses left
              </span>
            </div>

            <form onSubmit={handleGenerateDemo} className="space-y-4">
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                className="w-full rounded-xl border border-white/15 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-yellow-500/60"
                placeholder="Describe the invoice you want to create"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-yellow-500 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-yellow-400"
              >
                Generate invoice preview
              </button>
            </form>

            {status && (
              <p className="mt-4 rounded-lg border border-white/10 bg-black/15 px-3 py-2 text-sm text-gray-300">
                {status}
              </p>
            )}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-yellow-400">Invoice preview</p>
            <div className="mt-4 rounded-2xl border border-white/10 bg-[#11110f] p-5">
              {demoItems.length === 0 ? (
                <div className="space-y-3 text-sm text-gray-400">
                  <p>Your free invoice preview will appear here.</p>
                  <p>You can generate up to 10 invoice previews before you need to sign up.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-[0.25em] text-gray-500">Invoice</div>
                      <div className="mt-1 text-xl font-semibold text-white">{previewInvoiceNumber}</div>
                    </div>
                    <div className="text-right text-sm text-gray-400">
                      <div>Due: {dueDate}</div>
                      <div>Client: Nova Studio</div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                    <div className="grid grid-cols-[1fr_auto_auto] gap-2 text-xs uppercase tracking-[0.2em] text-gray-500">
                      <span>Item</span>
                      <span>Qty</span>
                      <span>Amount</span>
                    </div>
                    {demoItems.map((item, index) => (
                      <div key={`${item.description}-${index}`} className="mt-3 grid grid-cols-[1fr_auto_auto] items-center gap-2 text-sm text-white">
                        <span>{item.description}</span>
                        <span className="text-gray-400">{item.quantity}</span>
                        <span>{formatCurrency(item.quantity * item.unitPrice)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-200">
                    Estimated total: {formatCurrency(totalPreview)}
                  </div>
                </div>
              )}
            </div>

            {remainingFreeGenerations === 0 && (
              <div className="mt-4 rounded-xl border border-yellow-500/35 bg-yellow-500/10 p-3 text-sm text-yellow-200">
                Free tokens are complete.{' '}
                <Link href="/signup" className="underline underline-offset-4 hover:text-white">
                  Sign up
                </Link>{' '}
                to generate more invoices.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-8 py-16">
        <div className="grid grid-cols-3 gap-6">
          {featureCards.map((feature) => (
            <div key={feature.title} className="bg-white/4 border border-white/8 rounded-2xl p-6">
              <div className="w-9 h-9 bg-yellow-500/15 rounded-lg flex items-center justify-center text-yellow-400 mb-4 text-sm font-bold">
                {feature.icon}
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
