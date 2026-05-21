import { createExam } from '@/app/admin/actions'

const inputClass =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

export default function NewExamPage() {
  return (
    <div>
      <div className="mb-6">
        <a href="/admin" className="text-sm text-gray-500 hover:text-gray-700">
          ← Exams
        </a>
        <h1 className="text-xl font-bold text-gray-900 mt-2">Create Exam</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-sm">
        <form action={createExam} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="subject">
              Subject
            </label>
            <input
              id="subject"
              name="subject"
              type="text"
              required
              placeholder="Advanced Mathematics"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="year">
              Year
            </label>
            <input
              id="year"
              name="year"
              type="number"
              required
              min="2000"
              max="2099"
              placeholder="2023"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="paper_number">
                Paper Number
              </label>
              <input
                id="paper_number"
                name="paper_number"
                type="number"
                required
                min="1"
                placeholder="1"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="paper_type">
                Paper Type
              </label>
              <select
                id="paper_type"
                name="paper_type"
                required
                className={inputClass}
              >
                <option value="objective">Objective</option>
                <option value="long_response">Long Response</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="duration_minutes">
              Duration (minutes)
            </label>
            <input
              id="duration_minutes"
              name="duration_minutes"
              type="number"
              required
              min="1"
              placeholder="180"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="total_marks">
              Total Marks
            </label>
            <input
              id="total_marks"
              name="total_marks"
              type="number"
              required
              min="1"
              placeholder="100"
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Exam
          </button>
        </form>
      </div>
    </div>
  )
}
