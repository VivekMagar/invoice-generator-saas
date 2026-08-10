// app/api/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { updateUserPlan } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature error:', err)
    return NextResponse.json({ error: 'Webhook signature invalid' }, { status: 400 })
  }

  try {
    switch (event.type) {

      // ── User completes checkout → upgrade their plan
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const { userId, plan } = session.metadata!
        await updateUserPlan(
          userId,
          plan as 'pro' | 'business',
          session.customer as string
        )
        console.log(`✓ Upgraded user ${userId} to ${plan}`)
        break
      }

      // ── Subscription cancelled → downgrade to free
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customer = await stripe.customers.retrieve(sub.customer as string) as Stripe.Customer
        const userId = customer.metadata?.userId
        if (userId) {
          await updateUserPlan(userId, 'free')
          console.log(`✓ Downgraded user ${userId} to free`)
        }
        break
      }

      // ── Payment failed → optionally notify user
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.log(`Payment failed for customer: ${invoice.customer}`)
        // TODO: Send email notification to user
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
