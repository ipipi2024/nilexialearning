import { createAdminClient } from '@/lib/supabase/admin'
import { createExplanationBlock } from '@/app/admin/actions'
import { ExplanationBlockForm } from '@/app/admin/_components/ExplanationBlockForm'
import { AdminQuestionNav } from '@/app/admin/_components/AdminQuestionNav'
import { DeleteQuestionButton } from '@/app/admin/_components/DeleteQuestionButton'
import type { Choice, ExplanationBlock } from '@/types/database'

type Props = {
  params: Promise<{ examId: string; sectionId: string; questionId: string }>
}

export default async function QuestionPage({ params }: Props) {
  const { examId, sectionId, questionId } = await params
  const admin = createAdminClient()

  const [{ data: question }, { data: choices }, { data: blocks }, { data: sectionQuestions }] =
    await Promise.all([
      admin.from('questions').select('*').eq('id', questionId).single(),
      admin
        .from('choices')
        .select('*')
        .eq('question_id', questionId)
        .order('label'),
      admin
        .from('explanation_blocks')
        .select('*')
        .eq('question_id', questionId)
        .order('block_order'),
      admin
        .from('questions')
        .select('id, number')
        .eq('section_id', sectionId)
        .order('number'),
    ])

  if (!question) {
    return <p className="text-gray-500">Question not found.</p>
  }

  const nextBlockOrder = (blocks?.length ?? 0) + 1

  const currentIdx = sectionQuestions?.findIndex((q) => q.id === questionId) ?? -1
  const previousQuestion = currentIdx > 0 ? sectionQuestions![currentIdx - 1] : null
  const nextQuestion =
    sectionQuestions && currentIdx >= 0 && currentIdx < sectionQuestions.length - 1
      ? sectionQuestions[currentIdx + 1]
      : null

  return (
    <div className="space-y-8">
      {/* Breadcrumb + nav */}
      <div className="space-y-2">
        <AdminQuestionNav
          examId={examId}
          sectionId={sectionId}
          previousQuestion={previousQuestion}
          nextQuestion={nextQuestion}
        />
        <h1 className="text-xl font-bold text-gray-900">
          Question {question.number}
        </h1>
      </div>

      {/* Question card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded">
              {question.question_type === 'multiple_choice'
                ? 'Multiple Choice'
                : question.question_type === 'short_answer'
                ? 'Short Answer'
                : 'Long Response'}
            </span>
            <span className="text-xs text-gray-400">
              {question.marks} mark{question.marks !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={`/admin/exams/${examId}/sections/${sectionId}/questions/${questionId}/edit`}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Edit Question
            </a>
            <DeleteQuestionButton
              questionId={questionId}
              examId={examId}
              sectionId={sectionId}
            />
            <a
              href={`/admin/exams/${examId}/sections/${sectionId}/questions/new?number=${question.number + 1}`}
              className="text-sm font-medium text-green-600 hover:text-green-700"
            >
              + Add Next Question
            </a>
          </div>
        </div>
        <p className="text-gray-900 whitespace-pre-wrap">{question.question_text}</p>
        {question.question_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={question.question_image_url}
            alt="Question"
            className="max-w-full h-auto rounded-lg border border-gray-200 mt-2"
          />
        )}
      </div>

      {/* Choices (multiple choice only) */}
      {question.question_type === 'multiple_choice' && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            Answer Choices
          </h2>
          {!choices?.length ? (
            <p className="text-sm text-gray-500">No choices saved.</p>
          ) : (
            <ul className="space-y-2">
              {choices.map((c: Choice) => (
                <li
                  key={c.id}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 ${
                    c.is_correct
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <span className="font-semibold text-gray-600 w-4">{c.label}</span>
                  <span className="text-sm text-gray-900 flex-1">{c.text}</span>
                  {c.is_correct && (
                    <span className="text-xs text-green-600 font-medium">✓ Correct</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Explanation blocks */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">Explanation</h2>

        {!blocks?.length ? (
          <p className="text-sm text-gray-500 mb-4">No explanation blocks yet.</p>
        ) : (
          <div className="space-y-3 mb-4">
            {blocks.map((block: ExplanationBlock) => (
              <div
                key={block.id}
                className="bg-white border border-gray-200 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-400">
                    #{block.block_order} · {block.block_type}
                  </span>
                  <a
                    href={`/admin/exams/${examId}/sections/${sectionId}/questions/${questionId}/explanation-blocks/${block.id}/edit`}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    Edit
                  </a>
                </div>
                {block.block_type === 'text' ? (
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {block.content}
                  </p>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={block.content}
                    alt={`Explanation block ${block.block_order}`}
                    className="max-w-full h-auto rounded-lg border border-gray-200"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add explanation block — inline collapsible */}
        <details className="bg-white border border-gray-200 rounded-xl">
          <summary className="px-4 py-3 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50 rounded-xl select-none">
            + Add Explanation Block
          </summary>
          <div className="px-4 pb-4 pt-2 border-t border-gray-100">
            <ExplanationBlockForm
              questionId={questionId}
              examId={examId}
              sectionId={sectionId}
              nextOrder={nextBlockOrder}
              action={createExplanationBlock}
            />
          </div>
        </details>
      </div>
    </div>
  )
}
