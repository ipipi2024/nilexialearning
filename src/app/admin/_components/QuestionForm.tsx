'use client'

import { useState } from 'react'
import type { Choice, QuestionType } from '@/types/database'
import { ImageInput } from './ImageInput'

type DefaultValues = {
  number: number
  question_text: string
  question_type: QuestionType
  marks: number
  question_image_url: string | null
  tutorial_video_url: string | null
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
  'w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'

const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'

function defaultTypeForNumber(n: number | undefined): QuestionType {
  return n !== undefined && n >= 31 ? 'short_answer' : 'multiple_choice'
}

export function QuestionForm({
  examId,
  sectionId,
  action,
  mode = 'create',
  defaultValues,
  defaultNumber,
}: Props) {
  const [questionType, setQuestionType] = useState<QuestionType>(
    defaultValues?.question_type ?? defaultTypeForNumber(defaultNumber)
  )
  const [correctChoice, setCorrectChoice] = useState(
    defaultValues?.choices?.find((c) => c.is_correct)?.label ?? 'A'
  )
  const [typeOverridden, setTypeOverridden] = useState(false)

  function handleTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setQuestionType(e.target.value as QuestionType)
    setTypeOverridden(true)
  }

  function handleNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (mode !== 'create' || typeOverridden) return
    const n = parseInt(e.target.value)
    if (!isNaN(n)) setQuestionType(defaultTypeForNumber(n))
  }

  return (
    <form action={action} className="flex flex-col gap-4" encType="multipart/form-data">
      <input type="hidden" name="exam_id" value={examId} />
      <input type="hidden" name="section_id" value={sectionId} />
      {defaultValues?.question_image_url && (
        <input type="hidden" name="existing_image_url" value={defaultValues.question_image_url} />
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="number">Question No.</label>
          <input
            id="number"
            name="number"
            type="number"
            required
            min="1"
            defaultValue={defaultValues?.number ?? defaultNumber}
            onChange={handleNumberChange}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="marks">Marks</label>
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
        <label className={labelClass} htmlFor="question_type">Question Type</label>
        <select
          id="question_type"
          name="question_type"
          value={questionType}
          onChange={handleTypeChange}
          className={inputClass}
        >
          <option value="multiple_choice">Multiple Choice</option>
          <option value="short_answer">Short Answer</option>
          <option value="long_response">Long Response</option>
        </select>
        {mode === 'create' && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Q1–30 → Multiple Choice &nbsp;·&nbsp; Q31–50 → Short Answer
          </p>
        )}
      </div>

      <div>
        <label className={labelClass} htmlFor="question_text">Question Text</label>
        <textarea
          id="question_text"
          name="question_text"
          required
          rows={3}
          defaultValue={defaultValues?.question_text}
          className={inputClass}
        />
      </div>

      <ImageInput
        name="question_image"
        label="Question Image"
        existingImageUrl={defaultValues?.question_image_url}
      />

      <div>
        <label className={labelClass} htmlFor="tutorial_video_url">
          Tutorial Video URL{' '}
          <span className="font-normal text-gray-400 dark:text-gray-500">(optional)</span>
        </label>
        <input
          id="tutorial_video_url"
          name="tutorial_video_url"
          type="text"
          placeholder="https://www.youtube.com/watch?v=VIDEO_ID"
          defaultValue={defaultValues?.tutorial_video_url ?? ''}
          className={inputClass}
        />
      </div>

      {/* Choices — multiple choice only */}
      {questionType === 'multiple_choice' && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Answer Choices</p>

          {(['A', 'B', 'C', 'D'] as const).map((label) => {
            const existing = defaultValues?.choices?.find((c) => c.label === label)
            return (
              <div key={label} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 w-5 shrink-0">{label}</span>
                  <input
                    name={`choice_${label}`}
                    type="text"
                    placeholder={`Choice ${label} text`}
                    defaultValue={existing?.text ?? ''}
                    className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="pl-7">
                  <ImageInput
                    name={`choice_image_${label}`}
                    label={`Choice ${label} image`}
                    existingImageUrl={existing?.choice_image_url}
                  />
                </div>
              </div>
            )
          })}

          <div>
            <label className={labelClass} htmlFor="correct_choice">Correct Answer</label>
            <select
              id="correct_choice"
              name="correct_choice"
              value={correctChoice}
              onChange={(e) => setCorrectChoice(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
      >
        {mode === 'edit' ? 'Save Changes' : 'Save Question'}
      </button>
    </form>
  )
}
