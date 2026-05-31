import { createAdminClient } from '@/lib/supabase/admin'
import { createSection, updateExamStatus, updateExamAccess } from '@/app/admin/actions'
import type { Section } from '@/types/database'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ examId: string }> }

const inputClass =
  'w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'

const inputClassSm =
  'w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'

const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
const labelClassXs = 'block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'

export default async function ExamPage({ params }: Props) {
  const { examId } = await params
  const admin = createAdminClient()

  const [{ data: exam }, { data: sections }] = await Promise.all([
    admin.from('exams').select('*').eq('id', examId).single(),
    admin.from('sections').select('*').eq('exam_id', examId).order('question_start'),
  ])

  if (!exam) {
    return <p className="text-gray-500 dark:text-gray-400">Exam not found.</p>
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div>
        <a href="/admin" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
          ← Exams
        </a>
        <div className="flex items-center gap-3 mt-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {exam.subject} — Paper {exam.paper_number} ({exam.year})
          </h1>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              exam.status === 'published'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}
          >
            {exam.status === 'published' ? 'Published' : 'Draft'}
          </span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {exam.paper_type} · {exam.duration_minutes} min · {exam.total_marks} marks
          </p>
          {exam.status === 'draft' ? (
            <form action={updateExamStatus.bind(null, examId, 'published')}>
              <button type="submit" className="text-sm font-semibold bg-green-600 text-white px-4 py-1.5 rounded-xl hover:bg-green-700 transition-colors">
                Publish Exam
              </button>
            </form>
          ) : (
            <form action={updateExamStatus.bind(null, examId, 'draft')}>
              <button type="submit" className="text-sm font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-1.5 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                Move to Draft
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Access Settings */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Access Settings</h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <form action={updateExamAccess.bind(null, examId)} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="access_type">Access Type</label>
                <select id="access_type" name="access_type" defaultValue={exam.access_type ?? 'free'} className={inputClass}>
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="price_currency">Currency</label>
                <input
                  id="price_currency"
                  name="price_currency"
                  type="text"
                  defaultValue={exam.price_currency ?? 'PGK'}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="price_amount">
                Price <span className="font-normal text-gray-400 dark:text-gray-500">(paid exams only)</span>
              </label>
              <input
                id="price_amount"
                name="price_amount"
                type="number"
                step="0.01"
                min="0"
                defaultValue={exam.price_amount ?? ''}
                placeholder="0.00"
                className={inputClass}
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {exam.access_type === 'paid' && exam.price_amount
                  ? `Paid — ${exam.price_currency} ${Number(exam.price_amount).toFixed(2)}`
                  : 'Free'}
              </p>
              <button type="submit" className="text-sm font-semibold bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors">
                Save Settings
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Sections */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Sections</h2>

        {!sections?.length ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">No sections yet.</p>
        ) : (
          <ul className="space-y-2 mb-4">
            {sections.map((section: Section) => (
              <li key={section.id}>
                <a
                  href={`/admin/exams/${examId}/sections/${section.id}`}
                  className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                >
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">{section.name}</span>
                    <span className="ml-2 text-sm text-gray-400 dark:text-gray-500">{section.section_type}</span>
                  </div>
                  <span className="text-sm text-gray-400 dark:text-gray-500">
                    Q{section.question_start}–{section.question_end} · {section.marks} marks →
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}

        {/* Add section */}
        <details className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
          <summary className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl select-none">
            + Add Section
          </summary>
          <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-700">
            <form action={createSection} className="flex flex-col gap-3 mt-2">
              <input type="hidden" name="exam_id" value={examId} />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClassXs} htmlFor="sec-name">Name</label>
                  <input id="sec-name" name="name" type="text" required placeholder="Part A" className={inputClassSm} />
                </div>
                <div>
                  <label className={labelClassXs} htmlFor="sec-type">Type</label>
                  <input id="sec-type" name="section_type" type="text" required placeholder="multiple_choice" className={inputClassSm} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClassXs} htmlFor="sec-marks">Marks</label>
                  <input id="sec-marks" name="marks" type="number" required min="1" className={inputClassSm} />
                </div>
                <div>
                  <label className={labelClassXs} htmlFor="sec-start">Q Start</label>
                  <input id="sec-start" name="question_start" type="number" required min="1" className={inputClassSm} />
                </div>
                <div>
                  <label className={labelClassXs} htmlFor="sec-end">Q End</label>
                  <input id="sec-end" name="question_end" type="number" required min="1" className={inputClassSm} />
                </div>
              </div>

              <button type="submit" className="self-start bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors">
                Add Section
              </button>
            </form>
          </div>
        </details>
      </div>
    </div>
  )
}
