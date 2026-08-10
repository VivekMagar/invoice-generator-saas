import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

function isPlaceholderValue(value: string) {
  return (
    !value ||
    value.includes('placeholder') ||
    value.includes('your-project') ||
    value.includes('your-anon-key') ||
    value.includes('your-service-role-key')
  )
}

function hasValidSupabaseConfig() {
  return Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      !isPlaceholderValue(supabaseUrl) &&
      !isPlaceholderValue(supabaseAnonKey)
  )
}

export function createBrowserSupabaseClient() {
  if (!hasValidSupabaseConfig()) {
    return null
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

export const supabaseBrowser = createBrowserSupabaseClient()
