import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from './ProfileForm'

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username')
    .eq('id', user.id)
    .maybeSingle()

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-10">
      <div className="max-w-md mx-auto">
        <a
          href="/dashboard"
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          ← Dashboard
        </a>

        <h1 className="text-xl font-bold text-gray-900 dark:text-white mt-3 mb-1">Profile</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Your account details. All fields are optional.
        </p>

        {/* Email — read only */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-4 mb-4">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Email</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{user.email}</p>
        </div>

        {/* Editable profile fields */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <ProfileForm
            fullName={profile?.full_name ?? null}
            username={profile?.username ?? null}
          />
        </div>
      </div>
    </main>
  )
}
