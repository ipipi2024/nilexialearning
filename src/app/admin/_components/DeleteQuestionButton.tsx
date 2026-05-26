'use client'

import { deleteQuestion } from '@/app/admin/actions'

type Props = {
  questionId: string
  examId: string
  sectionId: string
}

export function DeleteQuestionButton({ questionId, examId, sectionId }: Props) {
  return (
    <form action={deleteQuestion}>
      <input type="hidden" name="question_id" value={questionId} />
      <input type="hidden" name="exam_id" value={examId} />
      <input type="hidden" name="section_id" value={sectionId} />
      <button
        type="submit"
        onClick={(e) => {
          if (
            !confirm(
              'Are you sure you want to delete this question? This cannot be undone.'
            )
          ) {
            e.preventDefault()
          }
        }}
        className="text-sm font-medium text-red-600 hover:text-red-700"
      >
        Delete Question
      </button>
    </form>
  )
}
