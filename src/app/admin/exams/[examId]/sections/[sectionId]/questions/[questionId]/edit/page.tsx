import { createAdminClient } from '@/lib/supabase/admin'
import { updateQuestion } from '@/app/admin/actions'
import { QuestionForm } from '@/app/admin/_components/QuestionForm'
import { AdminQuestionNav } from '@/app/admin/_components/AdminQuestionNav'

type Props = {
  params: Promise<{ examId: string; sectionId: string; questionId: string }>
}

export default async function EditQuestionPage({ params }: Props) {
  const { examId, sectionId, questionId } = await params
  const admin = createAdminClient()

  const [{ data: question }, { data: choices }, { data: sectionQuestions }] = await Promise.all([
    admin.from('questions').select('*').eq('id', questionId).single(),
    admin.from('choices').select('*').eq('question_id', questionId).order('label'),
    admin.from('questions').select('id, number, display_label').eq('section_id', sectionId)
      .order('number', { ascending: true })
      .order('sub_label', { ascending: true, nullsFirst: true }),
  ])

  if (!question) {
    return <p className="text-gray-500">Question not found.</p>
  }

  const action = updateQuestion.bind(null, questionId)

  const currentIdx = sectionQuestions?.findIndex((q) => q.id === questionId) ?? -1
  const previousQuestion = currentIdx > 0 ? sectionQuestions![currentIdx - 1] : null
  const nextQuestion =
    sectionQuestions && currentIdx >= 0 && currentIdx < sectionQuestions.length - 1
      ? sectionQuestions[currentIdx + 1]
      : null

  return (
    <div>
      <div className="mb-6 space-y-2">
        <AdminQuestionNav
          examId={examId}
          sectionId={sectionId}
          previousQuestion={previousQuestion}
          nextQuestion={nextQuestion}
        />
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Edit Question {question.display_label ?? question.number}
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 max-w-lg">
        <QuestionForm
          examId={examId}
          sectionId={sectionId}
          mode="edit"
          defaultValues={{
            number: question.number,
            sub_label: question.sub_label,
            question_text: question.question_text,
            question_type: question.question_type,
            marks: question.marks,
            question_image_url: question.question_image_url,
            tutorial_video_url: question.tutorial_video_url,
            choices: choices ?? [],
          }}
          action={action}
        />
      </div>
    </div>
  )
}
