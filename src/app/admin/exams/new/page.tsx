import { createExam } from '@/app/admin/actions'
import { SubmitButton } from '@/components/SubmitButton'

const inputClass =
  'w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'

const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'

export default function NewExamPage() {
  return (
    <div>
      <div className="mb-6">
        <a href="/admin" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
          ← Exams
        </a>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mt-2">Create Exam</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 max-w-sm">
        <form action={createExam} className="flex flex-col gap-4">
          <div>
            <label className={labelClass} htmlFor="subject">Subject</label>
            <input id="subject" name="subject" type="text" required placeholder="Advanced Mathematics" className={inputClass} />
          </div>

          <div>
            <label className={labelClass} htmlFor="year">Year</label>
            <input id="year" name="year" type="number" required min="2000" max="2099" placeholder="2023" className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="paper_number">Paper Number</label>
              <input id="paper_number" name="paper_number" type="number" required min="1" placeholder="1" className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="paper_type">Paper Type</label>
              <select id="paper_type" name="paper_type" required className={inputClass}>
                <option value="objective">Objective</option>
                <option value="long_response">Long Response</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="duration_minutes">Duration (minutes)</label>
            <input id="duration_minutes" name="duration_minutes" type="number" required min="1" placeholder="180" className={inputClass} />
          </div>

          <div>
            <label className={labelClass} htmlFor="total_marks">Total Marks</label>
            <input id="total_marks" name="total_marks" type="number" required min="1" placeholder="100" className={inputClass} />
          </div>

          <SubmitButton
            pendingText="Creating..."
            className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Create Exam
          </SubmitButton>
        </form>
      </div>
    </div>
  )
}
