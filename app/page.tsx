'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

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

  // Export a high-quality PDF for demo invoices (available to free users)
  function exportDemoPDF() {
    if (!demoItems || demoItems.length === 0) return

    const doc = new jsPDF({ unit: 'pt', format: 'a4' })

    // Header
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text('InvoiceAI', 40, 60)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(120)
    doc.text(`Invoice ${previewInvoiceNumber}`, 40, 80)
    doc.text(`Due: ${dueDate}`, 40, 96)

    // Items table
    autoTable(doc, {
      startY: 140,
      head: [['Description', 'Qty', 'Unit', 'Amount']],
      body: demoItems.map(i => [i.description, String(i.quantity), `€${i.unitPrice.toFixed(2)}`, formatCurrency(i.quantity * i.unitPrice)]),
      styles: { fontSize: 11 },
      headStyles: { fillColor: [30, 30, 26], textColor: 255 },
    })

    const finalY = (doc as any).lastAutoTable?.finalY ?? 300
    doc.setFontSize(12)
    doc.setTextColor(0)
    doc.text(`Total: ${formatCurrency(totalPreview)}`, 420, finalY + 30)

    doc.save(`${previewInvoiceNumber}.pdf`)
  }

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
      <nav className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-8">
        <div className="font-serif text-lg font-bold sm:text-xl">
          Invoice<span className="text-yellow-400 italic">AI</span>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <Link
            href="/login"
            className="px-3 py-2 text-xs text-gray-400 transition-colors hover:text-white sm:px-4 sm:text-sm"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-yellow-500 px-3 py-2 text-xs font-semibold text-black transition-colors hover:bg-yellow-400 sm:px-4 sm:text-sm"
          >
            Get started free
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-5xl px-4 pb-12 pt-14 text-center sm:px-8 sm:pt-20 lg:pt-24">
        <div className="mb-6 inline-block rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-300 sm:text-xs">
          ✦ AI-Powered
        </div>
        <h1 className="mb-6 text-4xl font-serif font-bold leading-tight sm:text-5xl lg:text-6xl">
          Invoices that look <em className="text-yellow-400 italic">expensive.</em>
          <br className="hidden sm:block" />Done in seconds.
        </h1>
        <p className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-gray-400 sm:text-lg">
          Stop wasting time on paperwork. InvoiceAI generates professional invoices,
          contracts & proposals — powered by Claude AI.
        </p>

        <div className="mx-auto max-w-sm rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
          <div className="flex flex-col gap-3">
            <Link
              href="/signup"
              className="rounded-lg bg-yellow-500 px-4 py-2.5 text-center text-sm font-bold text-black transition-colors hover:bg-yellow-400"
            >
              Create free account →
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-white/15 bg-white/8 px-4 py-2.5 text-center text-sm text-white transition-colors hover:border-yellow-500/60"
            >
              Login to your account
            </Link>
          </div>
          <p className="mt-3 text-xs text-gray-600">No credit card required</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-8 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-yellow-400 sm:text-xs">Free preview</p>
                <h2 className="mt-2 text-xl font-semibold sm:text-2xl">Generate invoices without signing in</h2>
              </div>
              <span className="inline-flex rounded-full bg-yellow-500/10 px-3 py-1 text-[10px] font-semibold text-yellow-300 sm:text-xs">
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

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
            <p className="text-[10px] uppercase tracking-[0.25em] text-yellow-400 sm:text-xs">Invoice preview</p>
            <div className="mt-4 rounded-2xl border border-white/10 bg-[#11110f] p-4 sm:p-5">
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
                  <div className="flex gap-2">
                    <button
                      onClick={exportDemoPDF}
                      className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white/6 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                    >
                      ⬇ Export PDF (HD)
                    </button>
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

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-8 sm:py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {featureCards.map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-white/8 bg-white/4 p-5 sm:p-6">
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-500/15 text-sm font-bold text-yellow-400">
                {feature.icon}
              </div>
              <h3 className="mb-2 font-semibold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-gray-500">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
