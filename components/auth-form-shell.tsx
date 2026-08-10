import Link from 'next/link'
import type { ReactNode } from 'react'

export function AuthFormShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0d0b09] text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link href="/" className="inline-block font-serif text-2xl font-bold text-white">
            Invoice<span className="text-yellow-400 italic">AI</span>
          </Link>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/30 backdrop-blur">
          <div className="mb-6">
            <h1 className="text-2xl font-serif font-bold">{title}</h1>
            <p className="text-sm text-gray-400 mt-2">{subtitle}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
