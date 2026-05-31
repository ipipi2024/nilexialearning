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
            {exams.map((exam: Exam) => {
              const isPaid = exam.access_type === 'paid'
              const hasAccess = accessedExamIds.has(exam.id)
              const isPending = pendingExamIds.has(exam.id)
              const isLocked = isPaid && !hasAccess && !isPending

              return (
                <li
                  key={exam.id}
                  className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">
                        {exam.subject} — Paper {exam.paper_number} ({exam.year})
                      </p>
                      {isPaid && hasAccess && (
                        <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          Unlocked
                        </span>
                      )}
                      {isPaid && !hasAccess && (
                        <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          🔒 Paid
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {exam.paper_type} · {exam.total_marks} marks · {exam.duration_minutes} min
                      {isPaid && exam.price_amount != null && (
                        <> · {exam.price_currency} {Number(exam.price_amount).toFixed(2)}</>
                      )}
                    </p>
                  </div>

                  <div className="shrink-0">
                    {/* Free exam or unlocked paid exam → Start Practice */}
                    {(!isPaid || hasAccess) && (
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
                    )}

                    {/* Paid exam — submission pending */}
                    {isPending && (
                      <span className="text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-3 py-2 rounded-lg">
                        Awaiting Approval
                      </span>
                    )}

                    {/* Paid exam — no access, no pending request */}
                    {isLocked && (
                      <a
                        href={`/practice/${exam.id}/payment`}
                        className="text-sm font-semibold bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
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
