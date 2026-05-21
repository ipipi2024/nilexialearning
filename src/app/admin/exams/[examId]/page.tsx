import { createAdminClient } from '@/lib/supabase/admin'
import { createSection } from '@/app/admin/actions'
import type { Section } from '@/types/database'

type Props = { params: Promise<{ examId: string }> }

export default async function ExamPage({ params }: Props) {
  const { examId } = await params
  const admin = createAdminClient()

  const [{ data: exam }, { data: sections }] = await Promise.all([
    admin.from('exams').select('*').eq('id', examId).single(),
    admin
      .from('sections')
      .select('*')
      .eq('exam_id', examId)
      .order('question_start'),
  ])

  if (!exam) {
    return <p className="text-gray-500">Exam not found.</p>
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div>
        <a href="/admin" className="text-sm text-gray-500 hover:text-gray-700">
          ← Exams
        </a>
        <h1 className="text-xl font-bold text-gray-900 mt-1">
          {exam.subject} — Paper {exam.paper_number} ({exam.year})
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {exam.paper_type} · {exam.duration_minutes} min · {exam.total_marks} marks
        </p>
      </div>

      {/* Sections list */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">Sections</h2>

        {!sections?.length ? (
          <p className="text-sm text-gray-500 mb-4">No sections yet.</p>
        ) : (
          <ul className="space-y-2 mb-4">
            {sections.map((section: Section) => (
              <li key={section.id}>
                <a
                  href={`/admin/exams/${examId}/sections/${section.id}`}
                  className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3 hover:border-blue-300 transition-colors"
                >
                  <div>
                    <span className="font-medium text-gray-900">
                      {section.name}
                    </span>
                    <span className="ml-2 text-sm text-gray-400">
                      {section.section_type}
                    </span>
                  </div>
                  <span className="text-sm text-gray-400">
                    Q{section.question_start}–{section.question_end} ·{' '}
                    {section.marks} marks →
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}

        {/* Add section — inline collapsible form */}
        <details className="bg-white border border-gray-200 rounded-xl">
          <summary className="px-4 py-3 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50 rounded-xl select-none">
            + Add Section
          </summary>
          <div className="px-4 pb-4 pt-2 border-t border-gray-100">
            <form action={createSection} className="flex flex-col gap-3 mt-2">
              <input type="hidden" name="exam_id" value={examId} />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className="block text-xs font-medium text-gray-700 mb-1"
                    htmlFor="sec-name"
                  >
                    Name
                  </label>
                  <input
                    id="sec-name"
                    name="name"
                    type="text"
                    required
                    placeholder="Part A"
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-medium text-gray-700 mb-1"
                    htmlFor="sec-type"
                  >
                    Type
                  </label>
                  <input
                    id="sec-type"
                    name="section_type"
                    type="text"
                    required
                    placeholder="multiple_choice"
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label
                    className="block text-xs font-medium text-gray-700 mb-1"
                    htmlFor="sec-marks"
                  >
                    Marks
                  </label>
                  <input
                    id="sec-marks"
                    name="marks"
                    type="number"
                    required
                    min="1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-medium text-gray-700 mb-1"
                    htmlFor="sec-start"
                  >
                    Q Start
                  </label>
                  <input
                    id="sec-start"
                    name="question_start"
                    type="number"
                    required
                    min="1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-medium text-gray-700 mb-1"
                    htmlFor="sec-end"
                  >
                    Q End
                  </label>
                  <input
                    id="sec-end"
                    name="question_end"
                    type="number"
                    required
                    min="1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="self-start bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Section
              </button>
            </form>
          </div>
        </details>
      </div>
    </div>
  )
}
