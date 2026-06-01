import { createAdminClient } from '@/lib/supabase/admin'
import type { Question, Section } from '@/types/database'

type Props = { params: Promise<{ examId: string; sectionId: string }> }

export default async function SectionPage({ params }: Props) {
  const { examId, sectionId } = await params
  const admin = createAdminClient()

  const [{ data: section }, { data: questions }] = await Promise.all([
    admin.from('sections').select('*').eq('id', sectionId).single(),
    admin.from('questions').select('*').eq('section_id', sectionId)
      .order('number', { ascending: true })
      .order('sub_label', { ascending: true, nullsFirst: true }),
  ])

  if (!section) {
    return <p className="text-gray-500 dark:text-gray-400">Section not found.</p>
  }

  const sec = section as Section

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div>
        <a
          href={`/admin/exams/${examId}`}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          ← Exam
        </a>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{sec.name}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {sec.section_type} · Q{sec.question_start}–{sec.question_end} · {sec.marks} marks
        </p>
      </div>

      {/* Questions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Questions</h2>
          <div className="flex items-center gap-2">
            <a
              href={`/admin/exams/${examId}/sections/${sectionId}/ai-import`}
              className="text-sm font-semibold px-4 py-2 rounded-xl border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950 transition-colors"
            >
              AI Import
            </a>
            <a
              href={`/admin/exams/${examId}/sections/${sectionId}/questions/new`}
              className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
            >
              + Add Question
            </a>
          </div>
        </div>

        {!questions?.length ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No questions yet.</p>
        ) : (
          <ul className="space-y-2">
            {questions.map((q: Question) => (
              <li key={q.id}>
                <a
                  href={`/admin/exams/${examId}/sections/${sectionId}/questions/${q.id}`}
                  className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                >
                  <span className="text-sm font-semibold text-gray-400 dark:text-gray-500 shrink-0">
                    Q{q.display_label ?? q.number}
                  </span>
                  <span className="text-sm text-gray-900 dark:text-gray-100 flex-1 truncate">
                    {q.question_text}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                    {q.question_type === 'multiple_choice' ? 'MC' : 'SA'} · {q.marks}m →
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
