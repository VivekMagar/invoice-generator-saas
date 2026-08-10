// app/api/generate-items/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { generateInvoiceItems } from '@/lib/anthropic'
import { supabase, getUserProfile, countInvoicesThisMonth } from '@/lib/supabase'
import { canCreateInvoice } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Plan limit check
    const [profile, count] = await Promise.all([
      getUserProfile(user.id),
      countInvoicesThisMonth(user.id),
    ])

    if (!canCreateInvoice(profile.plan, count)) {
      return NextResponse.json(
        { error: 'Free plan limit reached (3/month). Upgrade to Pro for unlimited invoices.' },
        { status: 403 }
      )
    }

    // 3. Generate items
    const { description, currency = 'EUR' } = await req.json()
    if (!description?.trim()) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 })
    }

    const items = await generateInvoiceItems(description, currency)
    return NextResponse.json({ items })

  } catch (err) {
    console.error('generate-items error:', err)
    return NextResponse.json({ error: 'Failed to generate items' }, { status: 500 })
  }
}
