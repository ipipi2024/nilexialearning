import { createClient } from '@supabase/supabase-js'

// Server-only. Uses the secret key — bypasses RLS entirely.
// Never import this in a Client Component.
export function createAdminClient() {
  if (!process.env.SUPABASE_SECRET_KEY) {
    throw new Error('SUPABASE_SECRET_KEY is not set in environment variables.')
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY
  )
}
