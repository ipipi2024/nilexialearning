import { createQuestion } from '@/app/admin/actions'
import { QuestionForm } from '@/app/admin/_components/QuestionForm'

type Props = { params: Promise<{ examId: string; sectionId: string }> }

export default async function NewQuestionPage({ params }: Props) {
  const { examId, sectionId } = await params

  return (
    <div>
      <div className="mb-6">
        <a
          href={`/admin/exams/${examId}/sections/${sectionId}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Section
        </a>
        <h1 className="text-xl font-bold text-gray-900 mt-2">Add Question</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg">
        <QuestionForm examId={examId} sectionId={sectionId} action={createQuestion} />
      </div>
    </div>
  )
}
