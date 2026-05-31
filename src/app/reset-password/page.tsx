import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ResetPasswordForm } from './ResetPasswordForm'

export default async function ResetPasswordPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // No session means the link was invalid, already used, or has expired.
  if (!user) {
    redirect(
      `/login?error=${encodeURIComponent('Reset link is invalid or has expired. Please request a new one.')}`
    )
  }

  // If the user is already fully logged in (not via recovery), redirect them away.
  // They can change their password from account settings instead.
  // (We don't block this — just let them set a new password either way.)

  return (
    <main className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <div className="px-6 py-4">
        <a href="/" className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">
          CQORIA
        </a>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Set new password</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Choose a new password for your account.
          </p>

          <ResetPasswordForm />
        </div>
      </div>
    </main>
  )
}
