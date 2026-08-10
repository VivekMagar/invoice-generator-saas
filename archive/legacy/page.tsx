// app/page.tsx
'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { redirectToCheckout } from '@/lib/stripe'

export default function LandingPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      window.location.href = '/dashboard'
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0e0d] text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div className="font-serif text-xl font-bold">
          Invoice<span className="text-yellow-400 italic">AI</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsLogin(true)}
            className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2"
          >
            Log in
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className="text-sm bg-yellow-500 text-black font-semibold px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors"
          >
            Get started free
          </button>
        </div>
      </nav>

      {/* Hero */}
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

        {/* Auth form */}
        <div className="max-w-sm mx-auto bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                isLogin ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Log in
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                !isLogin ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={handleAuth} className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="bg-white/8 border border-white/15 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-yellow-500/60 transition-colors"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="bg-white/8 border border-white/15 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-yellow-500/60 transition-colors"
            />
            {error && <p className="text-red-400 text-xs text-left">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="bg-yellow-500 text-black font-bold py-2.5 rounded-lg text-sm hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
            >
              {loading ? 'Please wait...' : isLogin ? 'Log in →' : 'Create free account →'}
            </button>
          </form>
          <p className="text-gray-600 text-xs mt-3">No credit card required</p>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-8 py-16">
        <div className="grid grid-cols-3 gap-6">
          {[
            { icon: '✦', title: 'AI auto-fill', desc: 'Type one sentence. Claude AI expands it into professional line items with accurate rates.' },
            { icon: '⬇', title: 'Instant PDF export', desc: 'Download a pixel-perfect PDF or send directly to your client via email in one click.' },
            { icon: '✉', title: 'Follow-up emails', desc: 'AI writes polite follow-up emails for unpaid invoices. Never chase payments awkwardly again.' },
          ].map(f => (
            <div key={f.title} className="bg-white/4 border border-white/8 rounded-2xl p-6">
              <div className="w-9 h-9 bg-yellow-500/15 rounded-lg flex items-center justify-center text-yellow-400 mb-4 text-sm font-bold">
                {f.icon}
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-5xl mx-auto px-8 py-16">
        <h2 className="text-3xl font-serif font-bold text-center mb-10">Simple pricing</h2>
        <div className="grid grid-cols-3 gap-6">
          {/* Free */}
          <div className="bg-white/4 border border-white/10 rounded-2xl p-6">
            <h3 className="font-semibold mb-1">Free</h3>
            <div className="text-3xl font-serif font-bold my-3">$0<span className="text-sm font-sans text-gray-500">/forever</span></div>
            <ul className="text-sm text-gray-400 space-y-2 mt-4">
              {['3 invoices/month', 'PDF export', 'Basic AI fill'].map(f => (
                <li key={f} className="flex gap-2"><span className="text-yellow-500">✓</span>{f}</li>
              ))}
            </ul>
          </div>
          {/* Pro */}
          <div className="bg-[#1a1714] border border-yellow-500/50 rounded-2xl p-6 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Most popular</div>
            <h3 className="font-semibold mb-1">Pro</h3>
            <div className="text-3xl font-serif font-bold text-yellow-400 my-3">$9<span className="text-sm font-sans text-gray-500">/month</span></div>
            <ul className="text-sm text-gray-400 space-y-2 mt-4">
              {['Unlimited invoices', 'Custom branding', 'Full AI suite', 'Email sending', 'Client history'].map(f => (
                <li key={f} className="flex gap-2"><span className="text-yellow-500">✓</span>{f}</li>
              ))}
            </ul>
            <button
              onClick={() => redirectToCheckout('pro', '', '')}
              className="w-full mt-5 bg-yellow-500 text-black font-bold py-2.5 rounded-lg text-sm hover:bg-yellow-400 transition-colors"
            >
              Get Pro →
            </button>
          </div>
          {/* Business */}
          <div className="bg-white/4 border border-white/10 rounded-2xl p-6">
            <h3 className="font-semibold mb-1">Business</h3>
            <div className="text-3xl font-serif font-bold my-3">$25<span className="text-sm font-sans text-gray-500">/month</span></div>
            <ul className="text-sm text-gray-400 space-y-2 mt-4">
              {['Everything in Pro', 'Team access', 'Analytics dashboard', 'Contract generator'].map(f => (
                <li key={f} className="flex gap-2"><span className="text-yellow-500">✓</span>{f}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
