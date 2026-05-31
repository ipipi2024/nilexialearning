import { createClient } from '@/lib/supabase/server'
import { NavInner } from './NavInner'

export async function PublicNav() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <NavInner isSignedIn={!!user} />
}
