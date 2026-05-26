import { createAdminClient } from '@/lib/supabase/admin'
import type { Question, Section } from '@/types/database'

type Props = { params: Promise<{ examId: string; sectionId: string }> }

export default async function SectionPage({ params }: Props) {
  const { examId, sectionId } = await params
  const admin = createAdminClient()

  const [{ data: section }, { data: questions }] = await Promise.all([
    admin.from('sections').select('*').eq('id', sectionId).single(),
    admin
      .from('questions')
      .select('*')
      .eq('section_id', sectionId)
      .order('number'),
  ])

  if (!section) {
    return <p className="text-gray-500">Section not found.</p>
  }

  const sec = section as Section

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div>
        <a
          href={`/admin/exams/${examId}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Exam
        </a>
        <h1 className="text-xl font-bold text-gray-900 mt-1">{sec.name}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {sec.section_type} · Q{sec.question_start}–{sec.question_end} ·{' '}
          {sec.marks} marks
        </p>
      </div>

      {/* Questions list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">Questions</h2>
          <div className="flex items-center gap-2">
            <a
              href={`/admin/exams/${examId}/sections/${sectionId}/ai-import`}
              className="text-sm font-semibold px-4 py-2 rounded-lg border border-purple-300 text-purple-700 hover:bg-purple-50 transition-colors"
            >
              AI Import
            </a>
            <a
              href={`/admin/exams/${examId}/sections/${sectionId}/questions/new`}
              className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Add Question
            </a>
          </div>
        </div>

        {!questions?.length ? (
          <p className="text-sm text-gray-500">No questions yet.</p>
        ) : (
          <ul className="space-y-2">
            {questions.map((q: Question) => (
              <li key={q.id}>
                <a
                  href={`/admin/exams/${examId}/sections/${sectionId}/questions/${q.id}`}
                  className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3 hover:border-blue-300 transition-colors"
                >
                  <span className="text-sm font-semibold text-gray-400 w-7 shrink-0">
                    Q{q.number}
                  </span>
                  <span className="text-sm text-gray-900 flex-1 truncate">
                    {q.question_text}
                  </span>
                  <span className="text-xs text-gray-400 shrink-0">
                    {q.question_type === 'multiple_choice' ? 'MC' : 'SA'} ·{' '}
                    {q.marks}m →
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
