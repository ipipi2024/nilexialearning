'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  sendAdminPaymentNotification,
  sendStudentPaymentReceived,
} from '@/lib/email'

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

  const { data: exam } = await supabase
    .from('exams')
    .select('status, access_type')
    .eq('id', examId)
    .maybeSingle()

  // RLS returns null for draft exams; redirect if not published.
  if (!exam || exam.status !== 'published') {
    redirect('/practice')
  }

  // For paid exams, confirm the user has been granted access.
  if (exam.access_type === 'paid') {
    const { data: access } = await supabase
      .from('user_exam_access')
      .select('id')
      .eq('exam_id', examId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!access) {
      redirect(`/practice/${examId}/payment`)
    }
  }

  const { data: attempt, error } = await supabase
    .from('attempts')
    .insert({ exam_id: examId, user_id: user.id, mode: 'practice' })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  redirect(`/practice/${attempt.id}`)
}

export async function submitPaymentRequest(formData: FormData) {
  const { supabase, user } = await requireUser()

  const examId = formData.get('exam_id') as string

  // Confirm exam exists, is published, and is paid (RLS filters published).
  const { data: exam } = await supabase
    .from('exams')
    .select('id, access_type, subject, year, paper_number')
    .eq('id', examId)
    .maybeSingle()

  if (!exam || exam.access_type !== 'paid') {
    redirect('/practice')
  }

  // If user already has access, nothing to do.
  const { data: existingAccess } = await supabase
    .from('user_exam_access')
    .select('id')
    .eq('exam_id', examId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingAccess) redirect('/practice')

  // Block duplicate pending submissions (DB partial unique index is the final guard).
  const { data: existingPending } = await supabase
    .from('payment_requests')
    .select('id')
    .eq('exam_id', examId)
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .maybeSingle()

  if (existingPending) {
    redirect(`/practice/${examId}/payment?error=duplicate`)
  }

  // Validate proof image.
  const proofFile = formData.get('proof_image') as File | null
  if (!proofFile || proofFile.size === 0) {
    throw new Error('Payment proof image is required.')
  }
  if (proofFile.size > 10 * 1024 * 1024) {
    throw new Error('File too large. Maximum size is 10 MB.')
  }

  // Upload proof image via admin client (service role bypasses storage RLS).
  const admin = createAdminClient()
  const safeName = proofFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const path = `${user.id}/${examId}/${Date.now()}-${safeName}`
  const buffer = Buffer.from(await proofFile.arrayBuffer())

  const { data: uploadData, error: uploadError } = await admin.storage
    .from('payment-proofs')
    .upload(path, buffer, { contentType: proofFile.type })

  if (uploadError) throw new Error(uploadError.message)

  const {
    data: { publicUrl },
  } = admin.storage.from('payment-proofs').getPublicUrl(uploadData.path)

  // Insert payment request via admin client to ensure it succeeds regardless of RLS.
  const { error: insertError } = await admin.from('payment_requests').insert({
    user_id: user.id,
    exam_id: examId,
    user_email: user.email ?? '',
    payer_name: (formData.get('payer_name') as string)?.trim() || null,
    payment_reference: (formData.get('payment_reference') as string)?.trim() || null,
    proof_image_url: publicUrl,
    note: (formData.get('note') as string)?.trim() || null,
  })

  if (insertError) throw new Error(insertError.message)

  // Send emails best-effort — never block the payment flow.
  const payerName = (formData.get('payer_name') as string)?.trim() || null
  const paymentReference = (formData.get('payment_reference') as string)?.trim() || null
  const note = (formData.get('note') as string)?.trim() || null

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()

  await Promise.allSettled([
    sendAdminPaymentNotification({
      studentEmail: user.email ?? '',
      studentName: profile?.full_name ?? null,
      exam,
      payerName,
      paymentReference,
      note,
    }),
    sendStudentPaymentReceived({
      studentEmail: user.email ?? '',
      exam,
    }),
  ])

  redirect(`/practice/${examId}/payment`)
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
