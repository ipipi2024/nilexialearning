'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ProfileFormState = { error?: string; success?: boolean }

export async function updateProfile(
  _prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const fullName = (formData.get('full_name') as string).trim() || null
  const rawUsername = (formData.get('username') as string).trim().toLowerCase() || null

  if (rawUsername) {
    if (rawUsername.length < 3) return { error: 'Username must be at least 3 characters.' }
    if (rawUsername.length > 20) return { error: 'Username must be 20 characters or fewer.' }
    if (!/^[a-z0-9_]+$/.test(rawUsername)) {
      return { error: 'Username can only contain lowercase letters, numbers, and underscores.' }
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName, username: rawUsername })
    .eq('id', user.id)

  if (error) {
    if (error.code === '23505') return { error: 'Username already taken. Please choose another.' }
    return { error: 'Failed to update profile. Please try again.' }
  }

  revalidatePath('/profile')
  return { success: true }
}
