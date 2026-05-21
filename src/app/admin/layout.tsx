import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !isAdmin(user.email)) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-6">
          <span className="font-semibold text-gray-900 text-sm">Admin Panel</span>
          <a href="/admin" className="text-sm text-gray-600 hover:text-gray-900">
            Exams
          </a>
          <a
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-700 ml-auto"
          >
            ← Exit Admin
          </a>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-6 py-8">{children}</div>
    </div>
  )
}
