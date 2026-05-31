import { createAdminClient } from '@/lib/supabase/admin'
import { createSection, updateExamStatus, updateExamAccess } from '@/app/admin/actions'
import type { Section } from '@/types/database'

export const dynamic = 'force-dynamic'

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
        <div className="flex items-center gap-3 mt-1">
          <h1 className="text-xl font-bold text-gray-900">
            {exam.subject} — Paper {exam.paper_number} ({exam.year})
          </h1>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              exam.status === 'published'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {exam.status === 'published' ? 'Published' : 'Draft'}
          </span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-sm text-gray-500">
            {exam.paper_type} · {exam.duration_minutes} min · {exam.total_marks} marks
          </p>
          {exam.status === 'draft' ? (
            <form action={updateExamStatus.bind(null, examId, 'published')}>
              <button
                type="submit"
                className="text-sm font-semibold bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
              >
                Publish Exam
              </button>
            </form>
          ) : (
            <form action={updateExamStatus.bind(null, examId, 'draft')}>
              <button
                type="submit"
                className="text-sm font-semibold bg-gray-100 text-gray-700 px-4 py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Move to Draft
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Access Settings */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">Access Settings</h2>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <form action={updateExamAccess.bind(null, examId)} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="access_type">
                  Access Type
                </label>
                <select
                  id="access_type"
                  name="access_type"
                  defaultValue={exam.access_type ?? 'free'}
                  className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="price_currency">
                  Currency
                </label>
                <input
                  id="price_currency"
                  name="price_currency"
                  type="text"
                  defaultValue={exam.price_currency ?? 'PGK'}
                  className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="price_amount">
                Price <span className="font-normal text-gray-400">(for paid exams only)</span>
              </label>
              <input
                id="price_amount"
                name="price_amount"
                type="number"
                step="0.01"
                min="0"
                defaultValue={exam.price_amount ?? ''}
                placeholder="0.00"
                className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {exam.access_type === 'paid' && exam.price_amount
                  ? `Paid — ${exam.price_currency} ${Number(exam.price_amount).toFixed(2)}`
                  : 'Free'}
              </p>
              <button
                type="submit"
                className="text-sm font-semibold bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Access Settings
              </button>
            </div>
          </form>
        </div>
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
                    className="w-full border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
