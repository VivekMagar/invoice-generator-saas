// lib/anthropic.ts
import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// ─────────────────────────────────────────────
// CORE AI FUNCTIONS
// ─────────────────────────────────────────────

export interface GeneratedItem {
  description: string
  quantity: number
  rate: number
}

/**
 * Takes a short work description and returns professional invoice line items.
 * Example input: "built a landing page and logo for a restaurant"
 */
export async function generateInvoiceItems(
  workDescription: string,
  currency = 'EUR'
): Promise<GeneratedItem[]> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 600,
    messages: [
      {
        role: 'user',
        content: `You are a professional invoice writer for freelancers.
The freelancer describes their work as: "${workDescription}"
Currency: ${currency}

Return ONLY a valid JSON array of 2-4 invoice line items. No markdown, no explanation.
Each item must have: { "description": string, "quantity": number, "rate": number }
Rates should be realistic market rates for freelance work in EUR.

Example output:
[
  { "description": "Custom landing page design and development", "quantity": 1, "rate": 850 },
  { "description": "Logo design with 3 revision rounds", "quantity": 1, "rate": 350 }
]`,
      },
    ],
  })

  const text = (message.content[0] as { type: string; text: string }).text
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

/**
 * Writes a professional follow-up email for an unpaid invoice.
 */
export async function generateFollowUpEmail(params: {
  clientName: string
  invoiceNumber: string
  invoiceTotal: number
  currency: string
  dueDate: string
  freelancerName: string
  daysPastDue: number
}): Promise<{ subject: string; body: string }> {
  const { clientName, invoiceNumber, invoiceTotal, currency, dueDate, freelancerName, daysPastDue } = params

  const tone = daysPastDue < 7 ? 'polite reminder' : daysPastDue < 21 ? 'firm but professional' : 'urgent and direct'

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 600,
    messages: [
      {
        role: 'user',
        content: `Write a ${tone} follow-up email for an unpaid invoice.

Details:
- Client: ${clientName}
- Invoice: ${invoiceNumber}
- Amount: ${currency} ${invoiceTotal}
- Due date: ${dueDate}
- Days past due: ${daysPastDue}
- Sender: ${freelancerName}

Return ONLY valid JSON: { "subject": "...", "body": "..." }
The body should be professional, concise, and appropriately firm for ${daysPastDue} days overdue.`,
      },
    ],
  })

  const text = (message.content[0] as { type: string; text: string }).text
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

/**
 * Generates a short professional contract for a freelance project.
 * (Business plan feature)
 */
export async function generateContract(params: {
  freelancerName: string
  clientName: string
  projectDescription: string
  totalAmount: number
  currency: string
  deliveryDate: string
}): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: `Write a professional but concise freelance service contract.

Parties:
- Freelancer: ${params.freelancerName}
- Client: ${params.clientName}

Project: ${params.projectDescription}
Total fee: ${params.currency} ${params.totalAmount}
Delivery date: ${params.deliveryDate}

Include: scope of work, payment terms (50% upfront, 50% on delivery), revision policy (2 rounds), IP ownership (transfers on full payment), limitation of liability clause. Use plain professional English. Format with clear section headings.`,
      },
    ],
  })

  return (message.content[0] as { type: string; text: string }).text
}

// ─────────────────────────────────────────────
// API ROUTE WRAPPER
// app/api/generate-items/route.ts — paste as-is
// ─────────────────────────────────────────────

// import { NextRequest, NextResponse } from 'next/server'
// import { generateInvoiceItems } from '@/lib/anthropic'
// import { supabase } from '@/lib/supabase'
// import { canCreateInvoice, countInvoicesThisMonth } from '@/lib/stripe'
//
// export async function POST(req: NextRequest) {
//   // 1. Auth check
//   const { data: { user } } = await supabase.auth.getUser()
//   if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
//
//   // 2. Plan limit check
//   const count = await countInvoicesThisMonth(user.id)
//   const profile = await getUserProfile(user.id)
//   if (!canCreateInvoice(profile.plan, count)) {
//     return NextResponse.json(
//       { error: 'Free plan limit reached. Upgrade to Pro for unlimited invoices.' },
//       { status: 403 }
//     )
//   }
//
//   // 3. Generate items
//   const { description, currency } = await req.json()
//   const items = await generateInvoiceItems(description, currency)
//   return NextResponse.json({ items })
// }
