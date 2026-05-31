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

  // No redirectTo — OTP mode sends a code to the user's email instead of a magic link.
  await supabase.auth.resetPasswordForEmail(email)

  // Always redirect to the OTP form — never reveal whether the email exists.
  redirect(`/reset-password?email=${encodeURIComponent(email)}`)
}

export async function verifyOtpAndUpdatePassword(
  _prevState: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const email = (formData.get('email') as string)?.trim()
  const token = (formData.get('token') as string)?.trim()
  const password = (formData.get('password') as string) ?? ''
  const confirmPassword = (formData.get('confirm_password') as string) ?? ''

  if (!email) return { error: 'Email is required.' }
  if (!token) return { error: 'Reset code is required.' }
  if (!password) return { error: 'Password is required.' }
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' }
  if (password !== confirmPassword) return { error: 'Passwords do not match.' }

  const supabase = await createClient()

  // Step 1: Verify the OTP — this creates a recovery session in cookies.
  const { error: otpError } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'recovery',
  })

  if (otpError) {
    return { error: 'Invalid or expired reset code. Please request a new one.' }
  }

  // Step 2: Use the recovery session to set the new password.
  const { error: updateError } = await supabase.auth.updateUser({ password })

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}
