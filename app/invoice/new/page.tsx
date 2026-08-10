// app/invoice/new/page.tsx
'use client'
import { useState } from 'react'
import { supabase, saveInvoice } from '@/lib/supabase'
import type { InvoiceItem } from '@/types'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const VAT_RATE = 19

function generateId() {
  return Math.random().toString(36).slice(2, 9)
}

function calcItem(item: InvoiceItem): InvoiceItem {
  return { ...item, total: item.quantity * item.rate }
}

export default function NewInvoicePage() {
  const today = new Date().toISOString().split('T')[0]
  const due = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]

  const [fromName, setFromName] = useState('')
  const [fromEmail, setFromEmail] = useState('')
  const [fromAddress, setFromAddress] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${new Date().getFullYear()}-001`)
  const [issueDate, setIssueDate] = useState(today)
  const [dueDate, setDueDate] = useState(due)
  const [notes, setNotes] = useState('Payment due within 30 days. Bank transfer preferred.')
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: generateId(), description: '', quantity: 1, rate: 0, total: 0 }
  ])
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiMessage, setAiMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form')

  // ── Totals
  const subtotal = items.reduce((s, i) => s + i.total, 0)
  const vatAmount = subtotal * (VAT_RATE / 100)
  const total = subtotal + vatAmount

  // ── Item helpers
  function updateItem(id: string, field: keyof InvoiceItem, value: string | number) {
    setItems(prev => prev.map(it =>
      it.id === id ? calcItem({ ...it, [field]: value }) : it
    ))
  }

  function addItem() {
    setItems(prev => [...prev, { id: generateId(), description: '', quantity: 1, rate: 0, total: 0 }])
  }

  function removeItem(id: string) {
    if (items.length > 1) setItems(prev => prev.filter(i => i.id !== id))
  }

  // ── AI generation
  async function runAI() {
    if (!aiPrompt.trim()) return
    setAiLoading(true)
    setAiMessage('')
    try {
      const res = await fetch('/api/generate-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: aiPrompt, currency: 'EUR' }),
      })
      const { items: generated, error } = await res.json()
      if (error) { setAiMessage(error); return }
      setItems(generated.map((g: { description: string; quantity: number; rate: number }) => calcItem({
        id: generateId(),
        description: g.description,
        quantity: g.quantity,
        rate: g.rate,
        total: 0,
      })))
      setAiMessage('✦ Done! Line items added. Edit freely.')
    } catch {
      setAiMessage('Error generating items. Try again.')
    } finally {
      setAiLoading(false)
    }
  }

  // ── Save to Supabase
  async function handleSave() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/'; return }

    await saveInvoice({
      user_id: user.id,
      invoice_number: invoiceNumber,
      status: 'draft',
      from_name: fromName,
      from_email: fromEmail,
      from_address: fromAddress,
      client_name: clientName,
      client_email: clientEmail,
      client_address: clientAddress,
      issue_date: issueDate,
      due_date: dueDate,
      items,
      subtotal,
      vat_rate: VAT_RATE,
      vat_amount: vatAmount,
      total,
      notes,
      currency: 'EUR',
    })

    setSaved(true)
    setSaving(false)
    setTimeout(() => window.location.href = '/dashboard', 1500)
  }

  // ── PDF export
  function exportPDF() {
    const doc = new jsPDF()

    // Header
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.text(fromName || 'InvoiceAI', 14, 20)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(120)
    doc.text(`Invoice ${invoiceNumber}`, 14, 28)
    doc.text(`Issue date: ${issueDate}`, 14, 34)
    doc.text(`Due date: ${dueDate}`, 14, 40)

    // From / To
    doc.setTextColor(0)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('FROM', 14, 56)
    doc.text('BILL TO', 110, 56)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text([fromName, fromEmail, fromAddress].filter(Boolean), 14, 62)
    doc.text([clientName, clientEmail, clientAddress].filter(Boolean), 110, 62)

    // Items table
    autoTable(doc, {
      startY: 90,
      head: [['Description', 'Qty', 'Rate (€)', 'Total (€)']],
      body: items.map(i => [
        i.description,
        i.quantity.toString(),
        i.rate.toFixed(2),
        i.total.toFixed(2),
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [30, 30, 26], textColor: 255 },
    })

    const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
    doc.setFontSize(10)
    doc.setTextColor(80)
    doc.text(`Subtotal: €${subtotal.toFixed(2)}`, 140, finalY)
    doc.text(`VAT (${VAT_RATE}%): €${vatAmount.toFixed(2)}`, 140, finalY + 6)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0)
    doc.setFontSize(12)
    doc.text(`Total: €${total.toFixed(2)}`, 140, finalY + 14)

    if (notes) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(100)
      doc.text('Notes:', 14, finalY + 20)
      doc.text(notes, 14, finalY + 26)
    }

    doc.save(`${invoiceNumber}.pdf`)
  }

  // ── Preview component (inline)
  function InvoicePreview() {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-2xl mx-auto text-sm text-gray-800 shadow-sm">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="text-xl font-serif font-bold text-gray-900">{fromName || 'Your Name'}</div>
            <div className="text-gray-400 text-xs mt-1">{fromEmail}</div>
            <div className="text-gray-400 text-xs">{fromAddress}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Invoice</div>
            <div className="text-lg font-bold text-gray-900">{invoiceNumber}</div>
            <div className="text-xs text-gray-400 mt-1">Issued: {issueDate}</div>
            <div className="text-xs text-gray-400">Due: {dueDate}</div>
          </div>
        </div>

        {/* Bill To */}
        <div className="grid grid-cols-2 gap-6 pb-6 border-b border-gray-100 mb-6">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">From</div>
            <div className="font-semibold">{fromName || '—'}</div>
            <div className="text-gray-500 text-xs leading-5">{fromEmail}<br />{fromAddress}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Bill To</div>
            <div className="font-semibold">{clientName || '—'}</div>
            <div className="text-gray-500 text-xs leading-5">{clientEmail}<br />{clientAddress}</div>
          </div>
        </div>

        {/* Items */}
        <table className="w-full mb-6">
          <thead>
            <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
              <th className="text-left py-2 font-semibold">Description</th>
              <th className="text-center py-2 font-semibold">Qty</th>
              <th className="text-right py-2 font-semibold">Rate</th>
              <th className="text-right py-2 font-semibold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map(item => (
              <tr key={item.id}>
                <td className="py-3 pr-4">{item.description || '—'}</td>
                <td className="py-3 text-center text-gray-500">{item.quantity}</td>
                <td className="py-3 text-right text-gray-500">€{item.rate.toFixed(2)}</td>
                <td className="py-3 text-right font-medium">€{item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-6">
          <div className="w-56 space-y-1.5">
            <div className="flex justify-between text-gray-500 text-xs"><span>Subtotal</span><span>€{subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-gray-500 text-xs"><span>VAT ({VAT_RATE}%)</span><span>€{vatAmount.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2 mt-2"><span>Total Due</span><span>€{total.toFixed(2)}</span></div>
          </div>
        </div>

        {/* Notes */}
        {notes && (
          <div className="border-t border-gray-100 pt-4">
            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Notes</div>
            <div className="text-xs text-gray-500 leading-5">{notes}</div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => window.location.href = '/dashboard'} className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
            ← Dashboard
          </button>
          <span className="text-gray-200">|</span>
          <div className="font-semibold text-gray-800">New Invoice</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab(activeTab === 'form' ? 'preview' : 'form')}
            className="text-sm border border-gray-200 text-gray-600 font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {activeTab === 'form' ? '👁 Preview' : '✏️ Edit'}
          </button>
          <button
            onClick={exportPDF}
            className="text-sm border border-gray-200 text-gray-600 font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ⬇ PDF
          </button>
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="text-sm bg-gray-900 text-white font-semibold px-5 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Invoice'}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {activeTab === 'preview' ? (
          <InvoicePreview />
        ) : (
          <div className="space-y-6">

            {/* AI Box */}
            <div className="bg-[#1a1714] border border-yellow-500/20 rounded-2xl p-5">
              <p className="text-yellow-300 text-xs font-bold uppercase tracking-widest mb-1">✦ AI Line Item Generator</p>
              <p className="text-gray-400 text-sm mb-3">Describe your work briefly — Claude will write your invoice items.</p>
              <div className="flex gap-2">
                <input
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder="e.g. Built a landing page and logo for a restaurant client"
                  className="flex-1 bg-white/8 border border-white/12 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-yellow-500/50 transition-colors"
                  onKeyDown={e => e.key === 'Enter' && runAI()}
                />
                <button
                  onClick={runAI}
                  disabled={aiLoading}
                  className="bg-yellow-500 text-black text-sm font-bold px-4 py-2.5 rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {aiLoading ? '...' : 'Generate ✦'}
                </button>
              </div>
              {aiMessage && (
                <p className={`text-xs mt-2 ${aiMessage.startsWith('✦') ? 'text-yellow-400' : 'text-red-400'}`}>
                  {aiMessage}
                </p>
              )}
            </div>

            {/* From / To */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">Your Details</p>
                  <div className="space-y-3">
                    {[
                      { label: 'Your name / company', val: fromName, set: setFromName, placeholder: 'Dan Sayu — Dev' },
                      { label: 'Your email', val: fromEmail, set: setFromEmail, placeholder: 'dan@example.com' },
                      { label: 'Your address', val: fromAddress, set: setFromAddress, placeholder: 'Constanța, Romania' },
                    ].map(f => (
                      <div key={f.label}>
                        <label className="text-xs text-gray-400 block mb-1">{f.label}</label>
                        <input
                          value={f.val}
                          onChange={e => f.set(e.target.value)}
                          placeholder={f.placeholder}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400 transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">Client Details</p>
                  <div className="space-y-3">
                    {[
                      { label: 'Client name', val: clientName, set: setClientName, placeholder: 'Acme Corp' },
                      { label: 'Client email', val: clientEmail, set: setClientEmail, placeholder: 'billing@acme.com' },
                      { label: 'Client address', val: clientAddress, set: setClientAddress, placeholder: 'Bucharest, Romania' },
                    ].map(f => (
                      <div key={f.label}>
                        <label className="text-xs text-gray-400 block mb-1">{f.label}</label>
                        <input
                          value={f.val}
                          onChange={e => f.set(e.target.value)}
                          placeholder={f.placeholder}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400 transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice meta */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Invoice number', val: invoiceNumber, set: setInvoiceNumber, type: 'text' },
                  { label: 'Issue date', val: issueDate, set: setIssueDate, type: 'date' },
                  { label: 'Due date', val: dueDate, set: setDueDate, type: 'date' },
                ].map(f => (
                  <div key={f.label}>
                    <label className="text-xs text-gray-400 block mb-1">{f.label}</label>
                    <input
                      type={f.type}
                      value={f.val}
                      onChange={e => f.set(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400 transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Line items */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-[3fr_80px_100px_100px_40px] gap-2 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider font-semibold">
                <span>Description</span><span>Qty</span><span>Rate (€)</span><span>Total</span><span />
              </div>

              {items.map(item => (
                <div key={item.id} className="grid grid-cols-[3fr_80px_100px_100px_40px] gap-2 px-5 py-3 border-b border-gray-50 items-center">
                  <input
                    value={item.description}
                    onChange={e => updateItem(item.id, 'description', e.target.value)}
                    placeholder="Service description"
                    className="border border-transparent rounded-lg px-2 py-1.5 text-sm outline-none focus:border-gray-200 bg-transparent focus:bg-gray-50 transition-all w-full"
                  />
                  <input
                    type="number" min="1"
                    value={item.quantity}
                    onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    className="border border-transparent rounded-lg px-2 py-1.5 text-sm outline-none focus:border-gray-200 bg-transparent focus:bg-gray-50 transition-all w-full"
                  />
                  <input
                    type="number" min="0"
                    value={item.rate}
                    onChange={e => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                    className="border border-transparent rounded-lg px-2 py-1.5 text-sm outline-none focus:border-gray-200 bg-transparent focus:bg-gray-50 transition-all w-full"
                  />
                  <span className="text-sm font-semibold text-gray-700 px-2">€{item.total.toFixed(2)}</span>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors text-lg font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50"
                  >
                    ×
                  </button>
                </div>
              ))}

              <button
                onClick={addItem}
                className="w-full text-left px-5 py-3 text-sm text-yellow-600 font-semibold hover:bg-yellow-50/50 transition-colors"
              >
                + Add item
              </button>

              {/* Totals */}
              <div className="flex justify-end px-5 py-4 border-t border-gray-100 bg-gray-50/50">
                <div className="w-52 space-y-1.5 text-sm">
                  <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>€{subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between text-gray-500"><span>VAT ({VAT_RATE}%)</span><span>€{vatAmount.toFixed(2)}</span></div>
                  <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2 mt-2"><span>Total Due</span><span>€{total.toFixed(2)}</span></div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold block mb-2">Notes / Payment Terms</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400 transition-colors resize-none"
              />
            </div>

          </div>
        )}
      </main>
    </div>
  )
}
