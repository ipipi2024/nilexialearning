'use client'

import { useState } from 'react'

type Props = {
  examId: string
  sectionId: string
  action: (formData: FormData) => Promise<void>
}

const inputClass =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

export function QuestionForm({ examId, sectionId, action }: Props) {
  const [questionType, setQuestionType] = useState('multiple_choice')

  return (
    <form action={action} className="flex flex-col gap-4" encType="multipart/form-data">
      <input type="hidden" name="exam_id" value={examId} />
      <input type="hidden" name="section_id" value={sectionId} />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="number">
            Question No.
          </label>
          <input id="number" name="number" type="number" required min="1" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="marks">
            Marks
          </label>
          <input id="marks" name="marks" type="number" required min="1" className={inputClass} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="question_type">
          Question Type
        </label>
        <select
          id="question_type"
          name="question_type"
          value={questionType}
          onChange={(e) => setQuestionType(e.target.value)}
          className={inputClass}
        >
          <option value="multiple_choice">Multiple Choice</option>
          <option value="short_answer">Short Answer</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="question_text">
          Question Text
        </label>
        <textarea
          id="question_text"
          name="question_text"
          required
          rows={3}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="question_image">
          Question Image{' '}
          <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <input
          id="question_image"
          name="question_image"
          type="file"
          accept="image/*"
          className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-gray-300 file:text-sm file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-50"
        />
      </div>

      {/* Choices — only shown for multiple choice */}
      {questionType === 'multiple_choice' && (
        <div className="border border-gray-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">Answer Choices</p>

          {(['A', 'B', 'C', 'D'] as const).map((label) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-500 w-5">{label}</span>
              <input
                name={`choice_${label}`}
                type="text"
                placeholder={`Choice ${label}`}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}

          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              htmlFor="correct_choice"
            >
              Correct Answer
            </label>
            <select
              id="correct_choice"
              name="correct_choice"
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {(['A', 'B', 'C', 'D'] as const).map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <button
        type="submit"
        className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Save Question
      </button>
    </form>
  )
}
