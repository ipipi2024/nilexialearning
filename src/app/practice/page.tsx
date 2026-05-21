import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { startAttempt } from './actions'
import type { Exam } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function PracticePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: exams } = await supabase
    .from('exams')
    .select('*')
    .order('year', { ascending: false })

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <a href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
            ← Dashboard
          </a>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Exam Papers</h1>

        {!exams?.length ? (
          <p className="text-sm text-gray-500">No exam papers available yet.</p>
        ) : (
          <ul className="space-y-3">
            {exams.map((exam: Exam) => (
              <li
                key={exam.id}
                className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-gray-900">
                    {exam.subject} — Paper {exam.paper_number} ({exam.year})
                  </p>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {exam.paper_type} · {exam.total_marks} marks · {exam.duration_minutes} min
                  </p>
                </div>
                <form
                  action={async () => {
                    'use server'
                    await startAttempt(exam.id)
                  }}
                >
                  <button
                    type="submit"
                    className="text-sm font-semibold bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Start Practice
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
