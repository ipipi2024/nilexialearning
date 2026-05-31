import { createAdminClient } from '@/lib/supabase/admin'
import type { Exam } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const admin = createAdminClient()
  const { data: exams } = await admin
    .from('exams')
    .select('*')
    .order('year', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Exam Papers</h1>
        <a
          href="/admin/exams/new"
          className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
        >
          + Create Exam
        </a>
      </div>

      {!exams?.length ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No exams yet. Create your first exam paper.</p>
      ) : (
        <ul className="space-y-2">
          {exams.map((exam: Exam) => (
            <li key={exam.id}>
              <a
                href={`/admin/exams/${exam.id}`}
                className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-medium text-gray-900 dark:text-white truncate">
                    {exam.subject} — Paper {exam.paper_number} ({exam.year})
                  </span>
                  <span
                    className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                      exam.status === 'published'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {exam.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                </div>
                <span className="text-sm text-gray-400 dark:text-gray-500 shrink-0 ml-3">
                  {exam.paper_type} · {exam.total_marks}m · {exam.duration_minutes} min →
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
