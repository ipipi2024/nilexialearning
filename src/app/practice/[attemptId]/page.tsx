import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PracticeShell } from '@/app/practice/_components/PracticeShell'
import type { Question, Choice, ExplanationBlock, UserAnswer } from '@/types/database'

type Props = {
  params: Promise<{ attemptId: string }>
  searchParams: Promise<{ q?: string }>
}

type QuestionWithExtras = Question & {
  choices: Choice[]
  explanation_blocks: ExplanationBlock[]
}

export default async function PracticeAttemptPage({ params, searchParams }: Props) {
  const { attemptId } = await params
  const { q } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify attempt belongs to this user
  const { data: attempt } = await supabase
    .from('attempts')
    .select('*, exams(subject, paper_number, year, paper_type, total_marks)')
    .eq('id', attemptId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!attempt) redirect('/practice')

  // Load all questions for this exam, ordered by number
  const { data: questions } = await supabase
    .from('questions')
    .select('*, choices(*), explanation_blocks(*)')
    .eq('exam_id', attempt.exam_id)
    .order('number')

  // Load existing answers for this attempt
  const { data: existingAnswers } = await supabase
    .from('user_answers')
    .select('*')
    .eq('attempt_id', attemptId)

  if (!questions?.length) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No questions found for this exam.</p>
          <a href="/practice" className="text-blue-600 hover:underline text-sm">
            ← Back to exams
          </a>
        </div>
      </main>
    )
  }

  // Sort explanation_blocks by block_order
  const questionsWithSortedBlocks = (questions as QuestionWithExtras[]).map((q) => ({
    ...q,
    explanation_blocks: [...q.explanation_blocks].sort(
      (a, b) => a.block_order - b.block_order
    ),
  }))

  const exam = attempt.exams as {
    subject: string
    paper_number: number
    year: number
    paper_type: string
    total_marks: number
  }

  const initialQuestionNumber = q ? parseInt(q, 10) : undefined

  return (
    <PracticeShell
      attemptId={attemptId}
      exam={exam}
      questions={questionsWithSortedBlocks}
      initialAnswers={(existingAnswers ?? []) as UserAnswer[]}
      initialQuestionNumber={initialQuestionNumber}
    />
  )
}
