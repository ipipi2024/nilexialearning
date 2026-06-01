import { createAdminClient } from '@/lib/supabase/admin'
import { createExplanationBlock, recalculateAnswers } from '@/app/admin/actions'
import { ExplanationBlockForm } from '@/app/admin/_components/ExplanationBlockForm'
import { AdminQuestionNav } from '@/app/admin/_components/AdminQuestionNav'
import { DeleteQuestionButton } from '@/app/admin/_components/DeleteQuestionButton'
import { getYouTubeEmbedUrl } from '@/lib/youtube'
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
      admin.from('choices').select('*').eq('question_id', questionId).order('label'),
      admin.from('explanation_blocks').select('*').eq('question_id', questionId).order('block_order'),
      admin.from('questions').select('id, number, display_label').eq('section_id', sectionId)
        .order('number', { ascending: true })
        .order('sub_label', { ascending: true, nullsFirst: true }),
    ])

  if (!question) {
    return <p className="text-gray-500 dark:text-gray-400">Question not found.</p>
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
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Question {question.display_label ?? question.number}
        </h1>
      </div>

      {/* Question card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
              {question.question_type === 'multiple_choice'
                ? 'Multiple Choice'
                : question.question_type === 'short_answer'
                ? 'Short Answer'
                : 'Long Response'}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {question.marks} mark{question.marks !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={`/admin/exams/${examId}/sections/${sectionId}/questions/${questionId}/edit`}
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Edit
            </a>
            <DeleteQuestionButton questionId={questionId} examId={examId} sectionId={sectionId} />
            <a
              href={`/admin/exams/${examId}/sections/${sectionId}/questions/new?number=${question.number + 1}`}
              className="text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
            >
              + Next Question
            </a>
          </div>
        </div>
        <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{question.question_text}</p>
        {question.question_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={question.question_image_url}
            alt="Question"
            className="max-w-full h-auto rounded-xl border border-gray-200 dark:border-gray-700 mt-2"
          />
        )}
        {question.tutorial_video_url && (() => {
          const embedUrl = getYouTubeEmbedUrl(question.tutorial_video_url)
          return (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Tutorial Video:{' '}
                <span className="font-normal text-gray-400 dark:text-gray-500 break-all">
                  {question.tutorial_video_url}
                </span>
              </p>
              {embedUrl && (
                <div className="aspect-video w-full max-w-sm overflow-hidden rounded-xl bg-black">
                  <iframe
                    src={embedUrl}
                    className="h-full w-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              )}
            </div>
          )
        })()}
      </div>

      {/* Choices */}
      {question.question_type === 'multiple_choice' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Answer Choices</h2>
            <form action={recalculateAnswers}>
              <input type="hidden" name="question_id" value={questionId} />
              <input type="hidden" name="exam_id" value={examId} />
              <input type="hidden" name="section_id" value={sectionId} />
              <button
                type="submit"
                className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                ↻ Recalculate student answers
              </button>
            </form>
          </div>
          {!choices?.length ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No choices saved.</p>
          ) : (
            <ul className="space-y-2">
              {choices.map((c: Choice) => (
                <li
                  key={c.id}
                  className={`flex items-start gap-3 rounded-xl border px-4 py-2.5 ${
                    c.is_correct
                      ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                  }`}
                >
                  <span className="font-semibold text-gray-600 dark:text-gray-400 w-4 shrink-0 mt-0.5">{c.label}</span>
                  <span className="text-sm text-gray-900 dark:text-gray-100 flex-1 min-w-0">
                    {c.text && <span className="block">{c.text}</span>}
                    {c.choice_image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.choice_image_url}
                        alt={`Choice ${c.label}`}
                        className={`max-w-xs h-auto rounded-lg border border-gray-200 dark:border-gray-700${c.text ? ' mt-2' : ''}`}
                      />
                    )}
                  </span>
                  {c.is_correct && (
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium shrink-0">✓ Correct</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Explanation blocks */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Explanation</h2>

        {!blocks?.length ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">No explanation blocks yet.</p>
        ) : (
          <div className="space-y-3 mb-4">
            {blocks.map((block: ExplanationBlock) => (
              <div
                key={block.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                    #{block.block_order} · {block.block_type}
                  </span>
                  <a
                    href={`/admin/exams/${examId}/sections/${sectionId}/questions/${questionId}/explanation-blocks/${block.id}/edit`}
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    Edit
                  </a>
                </div>
                {block.block_type === 'text' ? (
                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {block.content}
                  </p>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={block.content}
                    alt={`Explanation block ${block.block_order}`}
                    className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <details className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
          <summary className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl select-none">
            + Add Explanation Block
          </summary>
          <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-700">
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
