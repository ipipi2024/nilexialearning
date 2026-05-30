'use client'

import { useState } from 'react'
import type { Choice, QuestionType } from '@/types/database'

type DefaultValues = {
  number: number
  question_text: string
  question_type: QuestionType
  marks: number
  question_image_url: string | null
  choices: Pick<Choice, 'label' | 'text' | 'is_correct' | 'choice_image_url'>[]
}

type Props = {
  examId: string
  sectionId: string
  action: (formData: FormData) => Promise<void>
  mode?: 'create' | 'edit'
  defaultValues?: DefaultValues
  defaultNumber?: number
}

const inputClass =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

export function QuestionForm({
  examId,
  sectionId,
  action,
  mode = 'create',
  defaultValues,
  defaultNumber,
}: Props) {
  const [questionType, setQuestionType] = useState<QuestionType>(
    defaultValues?.question_type ?? 'multiple_choice'
  )
  const [correctChoice, setCorrectChoice] = useState(
    defaultValues?.choices?.find((c) => c.is_correct)?.label ?? 'A'
  )

  return (
    <form action={action} className="flex flex-col gap-4" encType="multipart/form-data">
      <input type="hidden" name="exam_id" value={examId} />
      <input type="hidden" name="section_id" value={sectionId} />
      {defaultValues?.question_image_url && (
        <input type="hidden" name="existing_image_url" value={defaultValues.question_image_url} />
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="number">
            Question No.
          </label>
          <input
            id="number"
            name="number"
            type="number"
            required
            min="1"
            defaultValue={defaultValues?.number ?? defaultNumber}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="marks">
            Marks
          </label>
          <input
            id="marks"
            name="marks"
            type="number"
            required
            min="1"
            defaultValue={defaultValues?.marks ?? 1}
            className={inputClass}
          />
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
          onChange={(e) => setQuestionType(e.target.value as QuestionType)}
          className={inputClass}
        >
          <option value="multiple_choice">Multiple Choice</option>
          <option value="short_answer">Short Answer</option>
          <option value="long_response">Long Response</option>
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
          defaultValue={defaultValues?.question_text}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="question_image">
          Question Image{' '}
          <span className="font-normal text-gray-400">(optional)</span>
        </label>
        {defaultValues?.question_image_url && (
          <div className="mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={defaultValues.question_image_url}
              alt="Current question image"
              className="max-w-xs rounded-lg border border-gray-200"
            />
            <p className="text-xs text-gray-400 mt-1">Upload a new image to replace the current one</p>
          </div>
        )}
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

          {(['A', 'B', 'C', 'D'] as const).map((label) => {
            const existing = defaultValues?.choices?.find((c) => c.label === label)
            return (
              <div key={label} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-500 w-5 shrink-0">{label}</span>
                  <input
                    name={`choice_${label}`}
                    type="text"
                    placeholder={`Choice ${label} text`}
                    defaultValue={existing?.text ?? ''}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="pl-7 space-y-1">
                  {existing?.choice_image_url && (
                    <div className="mb-1.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={existing.choice_image_url}
                        alt={`Current Choice ${label} image`}
                        className="max-w-xs rounded-lg border border-gray-200"
                      />
                      <p className="text-xs text-gray-400 mt-1">Upload a new image to replace</p>
                    </div>
                  )}
                  <input
                    name={`choice_image_${label}`}
                    type="file"
                    accept="image/*"
                    className="w-full text-sm text-gray-500 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border file:border-gray-300 file:text-xs file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-50"
                  />
                </div>
              </div>
            )
          })}

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
              value={correctChoice}
              onChange={(e) => setCorrectChoice(e.target.value)}
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
        {mode === 'edit' ? 'Save Changes' : 'Save Question'}
      </button>
    </form>
  )
}
