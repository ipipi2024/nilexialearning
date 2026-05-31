'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

export async function startAttempt(examId: string) {
  const { supabase, user } = await requireUser()

  // Guard: exam must be published. RLS already filters draft exams for the
  // student client, so a draft exam returns null here.
  const { data: exam } = await supabase
    .from('exams')
    .select('status')
    .eq('id', examId)
    .maybeSingle()

  if (!exam || exam.status !== 'published') {
    redirect('/practice')
  }

  const { data: attempt, error } = await supabase
    .from('attempts')
    .insert({ exam_id: examId, user_id: user.id, mode: 'practice' })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  redirect(`/practice/${attempt.id}`)
}

export async function saveAnswer(
  attemptId: string,
  questionId: string,
  answer: string
) {
  const { supabase } = await requireUser()

  const { data: existing } = await supabase
    .from('user_answers')
    .select('id')
    .eq('attempt_id', attemptId)
    .eq('question_id', questionId)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('user_answers')
      .update({ answer })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('user_answers')
      .insert({ attempt_id: attemptId, question_id: questionId, answer })
  }
}

export async function saveSelfCheck(
  attemptId: string,
  questionId: string,
  isCorrect: boolean
) {
  const { supabase } = await requireUser()

  const selfCheckStatus = isCorrect ? 'correct' : 'incorrect'

  const { data: existing } = await supabase
    .from('user_answers')
    .select('id')
    .eq('attempt_id', attemptId)
    .eq('question_id', questionId)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('user_answers')
      .update({ is_correct: isCorrect, self_check_status: selfCheckStatus })
      .eq('id', existing.id)
  } else {
    await supabase.from('user_answers').insert({
      attempt_id: attemptId,
      question_id: questionId,
      is_correct: isCorrect,
      self_check_status: selfCheckStatus,
    })
  }
}
