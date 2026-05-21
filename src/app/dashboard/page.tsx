import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/auth/actions'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const meta = user.user_metadata as {
    full_name?: string
    school?: string
    grade?: string
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome to your dashboard
          </h1>
          <form action={logout}>
            <button
              type="submit"
              className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Logout
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-2">
          <p className="text-sm text-gray-500">Logged in as</p>
          <p className="font-medium text-gray-900">{user.email}</p>
          {meta.full_name && (
            <p className="text-sm text-gray-600">{meta.full_name}</p>
          )}
          {meta.school && (
            <p className="text-sm text-gray-500">{meta.school}</p>
          )}
          {meta.grade && (
            <p className="text-sm text-gray-500">Grade {meta.grade}</p>
          )}
        </div>
      </div>
    </main>
  )
}
