import { createAdminClient } from '@/lib/supabase/admin'
import { updateQuestion } from '@/app/admin/actions'
import { QuestionForm } from '@/app/admin/_components/QuestionForm'

type Props = {
  params: Promise<{ examId: string; sectionId: string; questionId: string }>
}

export default async function EditQuestionPage({ params }: Props) {
  const { examId, sectionId, questionId } = await params
  const admin = createAdminClient()

  const [{ data: question }, { data: choices }] = await Promise.all([
    admin.from('questions').select('*').eq('id', questionId).single(),
    admin.from('choices').select('*').eq('question_id', questionId).order('label'),
  ])

  if (!question) {
    return <p className="text-gray-500">Question not found.</p>
  }

  const action = updateQuestion.bind(null, questionId)

  return (
    <div>
      <div className="mb-6">
        <a
          href={`/admin/exams/${examId}/sections/${sectionId}/questions/${questionId}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Question {question.number}
        </a>
        <h1 className="text-xl font-bold text-gray-900 mt-2">
          Edit Question {question.number}
        </h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg">
        <QuestionForm
          examId={examId}
          sectionId={sectionId}
          mode="edit"
          defaultValues={{
            number: question.number,
            question_text: question.question_text,
            question_type: question.question_type,
            marks: question.marks,
            question_image_url: question.question_image_url,
            choices: choices ?? [],
          }}
          action={action}
        />
      </div>
    </div>
  )
}
