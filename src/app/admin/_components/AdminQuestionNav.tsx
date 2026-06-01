type NavQuestion = { id: string; number: number; display_label: string | null }

type Props = {
  examId: string
  sectionId: string
  previousQuestion?: NavQuestion | null
  nextQuestion?: NavQuestion | null
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
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          ← Q{previousQuestion.display_label ?? previousQuestion.number}
        </a>
      ) : (
        <span className="text-gray-300 dark:text-gray-600 select-none">← Q—</span>
      )}

      <a href={sectionHref} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
        Section
      </a>

      {nextQuestion ? (
        <a
          href={`${questionBase}/${nextQuestion.id}`}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          Q{nextQuestion.display_label ?? nextQuestion.number} →
        </a>
      ) : (
        <span className="text-gray-300 dark:text-gray-600 select-none">Q— →</span>
      )}
    </div>
  )
}
