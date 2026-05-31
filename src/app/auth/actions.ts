'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  const { data, error } = await supabase.auth.signUp({
    email,
    password: formData.get('password') as string,
  })

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`)
  }

  // Supabase silently "succeeds" for already-registered emails but returns
  // an empty identities array and sends no OTP — detect and surface this.
  if (!data.user || data.user.identities?.length === 0) {
    redirect('/signup?existing=1')
  }

  redirect(`/verify?email=${encodeURIComponent(email)}`)
}

export async function verifyOtp(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const token = formData.get('token') as string

  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })

  if (error) {
    redirect(
      `/verify?email=${encodeURIComponent(email)}&error=${encodeURIComponent(error.message)}`
    )
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient()
  const email = (formData.get('email') as string).trim()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? ''

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/auth/callback?next=/reset-password`,
  })

  // Always redirect to the sent state — never reveal whether the email exists.
  redirect('/forgot-password?sent=1')
}

export async function updatePassword(
  _prevState: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const password = (formData.get('password') as string) ?? ''
  const confirmPassword = (formData.get('confirm_password') as string) ?? ''

  if (!password) return { error: 'Password is required.' }
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' }
  if (password !== confirmPassword) return { error: 'Passwords do not match.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  return { success: true }
}
