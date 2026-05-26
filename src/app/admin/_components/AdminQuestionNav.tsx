type NavQuestion = { id: string; number: number }

type Props = {
  examId: string
  sectionId: string
  previousQuestion?: NavQuestion | null
  nextQuestion?: NavQuestion | null
  /** On the edit page, prev/next link to the question detail, not another edit page */
  questionId?: string
}

export function AdminQuestionNav({
  examId,
  sectionId,
  previousQuestion,
  nextQuestion,
}: Props) {
  const sectionHref = `/admin/exams/${examId}/sections/${sectionId}`
  const questionBase = `${sectionHref}/questions`

  return (
    <div className="flex items-center justify-between text-sm">
      {previousQuestion ? (
        <a
          href={`${questionBase}/${previousQuestion.id}`}
          className="text-gray-500 hover:text-gray-700"
        >
          ← Q{previousQuestion.number}
        </a>
      ) : (
        <span className="text-gray-300 select-none">← Q—</span>
      )}

      <a href={sectionHref} className="text-gray-500 hover:text-gray-700">
        Section
      </a>

      {nextQuestion ? (
        <a
          href={`${questionBase}/${nextQuestion.id}`}
          className="text-gray-500 hover:text-gray-700"
        >
          Q{nextQuestion.number} →
        </a>
      ) : (
        <span className="text-gray-300 select-none">Q— →</span>
      )}
    </div>
  )
}
