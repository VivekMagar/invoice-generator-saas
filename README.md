# InvoiceAI — Setup Guide

## Project Structure
```
invoice-ai/
├── lib/
│   ├── supabase.ts       ← Database client + SQL schema (in comments)
│   ├── stripe.ts         ← Payments + plan limits + webhook handler
│   └── anthropic.ts      ← AI item generator, follow-up emails, contracts
├── types/
│   └── index.ts          ← Shared TypeScript types
├── .env.local.example    ← Copy to .env.local and fill in keys
└── package.json          ← All dependencies
```

---

## Step 1 — Create the Next.js app

```bash
npx create-next-app@latest invoice-ai --typescript --tailwind --eslint --app
cd invoice-ai
npm install @anthropic-ai/sdk @supabase/supabase-js stripe jspdf jspdf-autotable
```

---

## Step 2 — Set up Supabase (free)

1. Go to https://supabase.com → New project
2. Copy your **Project URL** and **anon key** from Settings → API
3. Go to **SQL Editor** → paste the SQL schema from `lib/supabase.ts` (bottom of file)
4. Enable **Email auth** under Authentication → Providers

---

## Step 3 — Set up Anthropic API (free $5 credit)

1. Go to https://console.anthropic.com → API Keys → Create key
2. Paste into `.env.local` as `ANTHROPIC_API_KEY`

---

## Step 4 — Set up Stripe (free)

1. Go to https://dashboard.stripe.com → Developers → API Keys
2. Copy **Secret key** and **Publishable key**
3. Create two products:
   - **InvoiceAI Pro** → $9/month recurring → copy Price ID
   - **InvoiceAI Business** → $25/month recurring → copy Price ID
4. Set up webhook:
   - Stripe Dashboard → Developers → Webhooks → Add endpoint
   - URL: `https://your-domain.com/api/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.deleted`
   - Copy **Signing secret** → paste as `STRIPE_WEBHOOK_SECRET`

---

## Step 5 — Add API Routes

Copy these 3 route files into your project:

### `app/api/generate-items/route.ts`
Handles AI generation (see lib/anthropic.ts comments)

### `app/api/create-checkout/route.ts`
Creates Stripe checkout session (see lib/stripe.ts comments)

### `app/api/webhook/route.ts`
Handles Stripe subscription events (see lib/stripe.ts comments)

---

## Step 6 — Deploy to Vercel (free)

```bash
npm install -g vercel
vercel
```

Add all `.env.local` values to Vercel:
- Dashboard → your project → Settings → Environment Variables

Update your webhook URL in Stripe to your live Vercel domain.

---

## Revenue Milestones

| Goal          | Action                                      |
|---------------|---------------------------------------------|
| First user    | Post in r/freelance, r/Romania              |
| First $9      | Get 1 Pro subscriber                        |
| $100/month    | 12 Pro subscribers                          |
| $1,000/month  | 112 Pro subscribers (totally achievable!)   |

---

## Features Roadmap

- [x] Invoice form + PDF export
- [x] AI line item generator
- [x] Supabase auth + invoice storage
- [x] Stripe Pro/Business subscriptions
- [ ] Email sending (add Resend.com — free 3,000 emails/month)
- [ ] Follow-up email AI writer
- [ ] Contract generator (Business plan)
- [ ] Client portal (view & pay invoices online)
- [ ] Recurring invoice scheduler
