// lib/stripe.ts
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

// ─────────────────────────────────────────────
// PLAN CONFIG
// ─────────────────────────────────────────────

export const PLANS = {
  pro: {
    name: 'Pro',
    price: 9,
    currency: 'usd',
    priceId: process.env.STRIPE_PRO_PRICE_ID!,     // set in Stripe dashboard
    features: ['Unlimited invoices', 'Custom branding', 'AI suite', 'Email sending', 'Client history'],
  },
  business: {
    name: 'Business',
    price: 25,
    currency: 'usd',
    priceId: process.env.STRIPE_BUSINESS_PRICE_ID!, // set in Stripe dashboard
    features: ['Everything in Pro', 'Team access', 'Analytics', 'Contract generator'],
  },
} as const

export type PlanKey = keyof typeof PLANS

// ─────────────────────────────────────────────
// API ROUTES
// ─────────────────────────────────────────────

// app/api/create-checkout/route.ts
// POST { plan: 'pro' | 'business', userId: string, email: string }
//
// import { NextRequest, NextResponse } from 'next/server'
// import { stripe, PLANS } from '@/lib/stripe'
//
// export async function POST(req: NextRequest) {
//   const { plan, userId, email } = await req.json()
//   const planConfig = PLANS[plan as PlanKey]
//   if (!planConfig) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
//
//   const session = await stripe.checkout.sessions.create({
//     mode: 'subscription',
//     payment_method_types: ['card'],
//     customer_email: email,
//     line_items: [{ price: planConfig.priceId, quantity: 1 }],
//     success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
//     cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
//     metadata: { userId, plan },
//   })
//
//   return NextResponse.json({ url: session.url })
// }

// ─────────────────────────────────────────────
// CHECKOUT HELPER (call from client components)
// ─────────────────────────────────────────────

export async function redirectToCheckout(
  plan: PlanKey,
  userId: string,
  email: string
) {
  const res = await fetch('/api/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan, userId, email }),
  })
  const { url, error } = await res.json()
  if (error) throw new Error(error)
  window.location.href = url
}

// ─────────────────────────────────────────────
// WEBHOOK HANDLER
// app/api/webhook/route.ts — paste this file as-is
// ─────────────────────────────────────────────

// import { NextRequest, NextResponse } from 'next/server'
// import { stripe } from '@/lib/stripe'
// import { updateUserPlan } from '@/lib/supabase'
//
// export const config = { api: { bodyParser: false } }
//
// export async function POST(req: NextRequest) {
//   const body = await req.text()
//   const sig  = req.headers.get('stripe-signature')!
//
//   let event: Stripe.Event
//   try {
//     event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
//   } catch (err) {
//     return NextResponse.json({ error: 'Webhook signature invalid' }, { status: 400 })
//   }
//
//   switch (event.type) {
//
//     case 'checkout.session.completed': {
//       const session = event.data.object as Stripe.Checkout.Session
//       const { userId, plan } = session.metadata!
//       await updateUserPlan(userId, plan as any, session.customer as string)
//       break
//     }
//
//     case 'customer.subscription.deleted': {
//       const sub = event.data.object as Stripe.Subscription
//       // Downgrade user to free when subscription is cancelled
//       const customer = await stripe.customers.retrieve(sub.customer as string)
//       if ('metadata' in customer && customer.metadata?.userId) {
//         await updateUserPlan(customer.metadata.userId, 'free')
//       }
//       break
//     }
//
//   }
//
//   return NextResponse.json({ received: true })
// }

// ─────────────────────────────────────────────
// PLAN LIMIT CHECKER
// Use this in your API routes to gate features
// ─────────────────────────────────────────────

export function canCreateInvoice(plan: string, invoicesThisMonth: number): boolean {
  if (plan === 'free' && invoicesThisMonth >= 3) return false
  return true
}

export function canUseBranding(plan: string): boolean {
  return plan === 'pro' || plan === 'business'
}

export function canUseTeam(plan: string): boolean {
  return plan === 'business'
}
