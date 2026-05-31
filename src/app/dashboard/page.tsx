import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/auth/actions'
import { SubmitButton } from '@/components/SubmitButton'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-3 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <a href="/" className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">
            CQORIA
          </a>
          <div className="flex items-center gap-1">
            <a
              href="/profile"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Profile
            </a>
            <form action={logout}>
              <SubmitButton
                pendingText="Logging out..."
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Logout
              </SubmitButton>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-4">
        {/* Account card */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-4">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Logged in as</p>
          <p className="font-medium text-gray-900 dark:text-white">{user.email}</p>
        </div>

        {/* Practice CTA */}
        <a
          href="/practice"
          className="flex items-center justify-between bg-blue-600 hover:bg-blue-700 transition-colors text-white rounded-xl px-5 py-4 group"
        >
          <div>
            <p className="font-semibold text-base">Practice Exam Papers</p>
            <p className="text-blue-200 text-sm mt-0.5">Browse past papers and track your progress</p>
          </div>
          <span className="text-blue-200 group-hover:translate-x-0.5 transition-transform text-lg">→</span>
        </a>
      </main>
    </div>
  )
}
