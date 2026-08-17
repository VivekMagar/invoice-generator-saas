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
    <div className="flex min-h-screen items-center justify-center bg-[#0d0b09] px-4 py-8 text-white sm:py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link href="/" className="inline-block font-serif text-xl font-bold text-white sm:text-2xl">
            Invoice<span className="text-yellow-400 italic">AI</span>
          </Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl shadow-black/30 backdrop-blur sm:p-6">
          <div className="mb-6">
            <h1 className="text-xl font-serif font-bold sm:text-2xl">{title}</h1>
            <p className="mt-2 text-sm text-gray-400">{subtitle}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
