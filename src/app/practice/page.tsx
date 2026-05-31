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

  const [{ data: exams }, { data: myAccess }, { data: myRequests }] = await Promise.all([
    supabase
      .from('exams')
      .select('*')
      .eq('status', 'published')
      .order('year', { ascending: false }),
    supabase.from('user_exam_access').select('exam_id').eq('user_id', user.id),
    supabase
      .from('payment_requests')
      .select('exam_id, status')
      .eq('user_id', user.id),
  ])

  const accessedExamIds = new Set(myAccess?.map((a) => a.exam_id) ?? [])
  const pendingExamIds = new Set(
    (myRequests ?? []).filter((r) => r.status === 'pending').map((r) => r.exam_id)
  )

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <a href="/dashboard" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
            ← Dashboard
          </a>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">Exam Papers</h1>
        </div>

        {!exams?.length ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No exam papers available yet.</p>
        ) : (
          <ul className="space-y-3">
            {exams.map((exam: Exam) => {
              const isPaid = exam.access_type === 'paid'
              const hasAccess = accessedExamIds.has(exam.id)
              const isPending = pendingExamIds.has(exam.id)
              const isLocked = isPaid && !hasAccess && !isPending

              return (
                <li
                  key={exam.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {exam.subject} — Paper {exam.paper_number} ({exam.year})
                      </p>
                      {isPaid && hasAccess && (
                        <span className="text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                          Unlocked
                        </span>
                      )}
                      {isPaid && !hasAccess && (
                        <span className="text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                          🔒 Paid
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
                      {exam.paper_type} · {exam.total_marks} marks · {exam.duration_minutes} min
                      {isPaid && exam.price_amount != null && (
                        <> · {exam.price_currency} {Number(exam.price_amount).toFixed(2)}</>
                      )}
                    </p>
                  </div>

                  <div className="shrink-0">
                    {(!isPaid || hasAccess) && (
                      <form
                        action={async () => {
                          'use server'
                          await startAttempt(exam.id)
                        }}
                      >
                        <button
                          type="submit"
                          className="text-sm font-semibold bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
                        >
                          Start
                        </button>
                      </form>
                    )}

                    {isPending && (
                      <span className="text-xs font-semibold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-3 py-2 rounded-xl">
                        Under Review
                      </span>
                    )}

                    {isLocked && (
                      <a
                        href={`/practice/${exam.id}/payment`}
                        className="text-sm font-semibold bg-gray-900 dark:bg-gray-700 text-white px-4 py-2 rounded-xl hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                      >
                        Request Access
                      </a>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </main>
  )
}
