'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/admin'
import {
  sendStudentPaymentApproved,
  sendStudentPaymentRejected,
  sendStudentAiPlanApproved,
  sendStudentAiPlanRejected,
} from '@/lib/email'

// Gate every admin action — returns the admin client on success.
async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) {
    redirect('/dashboard')
  }
  return createAdminClient()
}

// ------------------------------------------------------------------
// Exam
// ------------------------------------------------------------------

export async function createExam(formData: FormData) {
  const admin = await requireAdmin()

  const { data: exam, error } = await admin
    .from('exams')
    .insert({
      subject: formData.get('subject') as string,
      year: parseInt(formData.get('year') as string),
      paper_number: parseInt(formData.get('paper_number') as string),
      paper_type: formData.get('paper_type') as string,
      duration_minutes: parseInt(formData.get('duration_minutes') as string),
      total_marks: parseInt(formData.get('total_marks') as string),
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  redirect(`/admin/exams/${exam.id}`)
}

// ------------------------------------------------------------------
// Exam status
// ------------------------------------------------------------------

export async function updateExamStatus(
  examId: string,
  status: 'draft' | 'published'
) {
  const admin = await requireAdmin()

  const { error } = await admin
    .from('exams')
    .update({ status })
    .eq('id', examId)

  if (error) throw new Error(error.message)

  redirect(`/admin/exams/${examId}`)
}

// ------------------------------------------------------------------
// Section
// ------------------------------------------------------------------

export async function createSection(formData: FormData) {
  const admin = await requireAdmin()

  const examId = formData.get('exam_id') as string

  const { error } = await admin.from('sections').insert({
    exam_id: examId,
    name: formData.get('name') as string,
    section_type: formData.get('section_type') as string,
    marks: parseInt(formData.get('marks') as string),
    question_start: parseInt(formData.get('question_start') as string),
    question_end: parseInt(formData.get('question_end') as string),
  })

  if (error) throw new Error(error.message)

  redirect(`/admin/exams/${examId}`)
}

// ------------------------------------------------------------------
// Question + Choices
// ------------------------------------------------------------------

async function uploadToStorage(
  admin: ReturnType<typeof createAdminClient>,
  bucket: string,
  file: File,
  prefix = ''
): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const path = `${prefix}${Date.now()}-${safeName}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { data, error } = await admin.storage
    .from(bucket)
    .upload(path, buffer, { contentType: file.type })

  if (error) throw new Error(error.message)

  const {
    data: { publicUrl },
  } = admin.storage.from(bucket).getPublicUrl(data.path)

  return publicUrl
}

function parseSubLabel(raw: string | null | undefined): string | null {
  if (!raw) return null
  const normalized = raw.trim().toLowerCase().replace(/[()]/g, '')
  return normalized || null
}

function makeDisplayLabel(number: number, subLabel: string | null): string {
  return subLabel ? `${number}(${subLabel})` : String(number)
}

export async function createQuestion(formData: FormData) {
  const admin = await requireAdmin()

  const examId = formData.get('exam_id') as string
  const sectionId = formData.get('section_id') as string
  const questionType = formData.get('question_type') as string
  const number = parseInt(formData.get('number') as string)
  const subLabel = parseSubLabel(formData.get('sub_label') as string | null)
  const displayLabel = makeDisplayLabel(number, subLabel)

  // Optional image upload
  let imageUrl: string | null = null
  const imageFile = formData.get('question_image') as File | null
  if (imageFile && imageFile.size > 0) {
    imageUrl = await uploadToStorage(admin, 'question-images', imageFile)
  }

  const rawVideoUrl = (formData.get('tutorial_video_url') as string | null)?.trim() || null

  const { data: question, error } = await admin
    .from('questions')
    .insert({
      exam_id: examId,
      section_id: sectionId,
      number,
      sub_label: subLabel,
      display_label: displayLabel,
      question_text: formData.get('question_text') as string,
      question_type: questionType,
      question_image_url: imageUrl,
      tutorial_video_url: rawVideoUrl,
      marks: parseInt(formData.get('marks') as string),
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  // Insert choices for multiple_choice questions
  if (questionType === 'multiple_choice') {
    const correctLabel = formData.get('correct_choice') as string

    // Upload any choice images first (sequential to avoid race conditions)
    const choiceImageUrls: Partial<Record<string, string | null>> = {}
    for (const label of ['A', 'B', 'C', 'D'] as const) {
      const imageFile = formData.get(`choice_image_${label}`) as File | null
      if (imageFile && imageFile.size > 0) {
        choiceImageUrls[label] = await uploadToStorage(admin, 'choice-images', imageFile)
      } else {
        choiceImageUrls[label] = null
      }
    }

    const choices = (['A', 'B', 'C', 'D'] as const)
      .map((label) => ({
        question_id: question.id,
        label,
        text: (formData.get(`choice_${label}`) as string | null) ?? '',
        is_correct: label === correctLabel,
        choice_image_url: choiceImageUrls[label] ?? null,
      }))
      .filter((c) => c.text.trim() !== '' || c.choice_image_url !== null)

    if (choices.length > 0) {
      const { error: choiceError } = await admin.from('choices').insert(choices)
      if (choiceError) throw new Error(choiceError.message)
    }
  }

  redirect(`/admin/exams/${examId}/sections/${sectionId}/questions/${question.id}`)
}

// ------------------------------------------------------------------
// Explanation Block
// ------------------------------------------------------------------

export async function createExplanationBlock(formData: FormData) {
  const admin = await requireAdmin()

  const questionId = formData.get('question_id') as string
  const examId = formData.get('exam_id') as string
  const sectionId = formData.get('section_id') as string
  const blockType = formData.get('block_type') as 'text' | 'image'
  const blockOrder = parseInt(formData.get('block_order') as string)

  let content: string

  if (blockType === 'image') {
    const imageFile = formData.get('image') as File | null
    if (!imageFile || imageFile.size === 0) {
      throw new Error('An image file is required for image blocks.')
    }
    content = await uploadToStorage(
      admin,
      'explanation-images',
      imageFile,
      `${questionId}/`
    )
  } else {
    content = formData.get('content') as string
  }

  const { error } = await admin.from('explanation_blocks').insert({
    question_id: questionId,
    block_order: blockOrder,
    block_type: blockType,
    content,
  })

  if (error) throw new Error(error.message)

  redirect(
    `/admin/exams/${examId}/sections/${sectionId}/questions/${questionId}`
  )
}

// ------------------------------------------------------------------
// Update Question + Choices
// ------------------------------------------------------------------

export async function updateQuestion(questionId: string, formData: FormData) {
  const admin = await requireAdmin()

  const examId = formData.get('exam_id') as string
  const sectionId = formData.get('section_id') as string
  const questionType = formData.get('question_type') as string
  const number = parseInt(formData.get('number') as string)
  const subLabel = parseSubLabel(formData.get('sub_label') as string | null)
  const displayLabel = makeDisplayLabel(number, subLabel)

  // Use existing image URL unless a new file is uploaded
  let imageUrl: string | null = (formData.get('existing_image_url') as string) || null
  const imageFile = formData.get('question_image') as File | null
  if (imageFile && imageFile.size > 0) {
    imageUrl = await uploadToStorage(admin, 'question-images', imageFile)
  }

  const rawVideoUrl = (formData.get('tutorial_video_url') as string | null)?.trim() || null

  const { error } = await admin
    .from('questions')
    .update({
      number,
      sub_label: subLabel,
      display_label: displayLabel,
      question_text: formData.get('question_text') as string,
      question_type: questionType,
      question_image_url: imageUrl,
      tutorial_video_url: rawVideoUrl,
      marks: parseInt(formData.get('marks') as string),
    })
    .eq('id', questionId)

  if (error) throw new Error(error.message)

  if (questionType === 'multiple_choice') {
    // Fetch existing choice images before deleting, so we can preserve them if no new file uploaded.
    const { data: existingChoices } = await admin
      .from('choices')
      .select('label, choice_image_url')
      .eq('question_id', questionId)

    const existingImageMap: Record<string, string | null> = {}
    for (const c of existingChoices ?? []) {
      existingImageMap[c.label] = c.choice_image_url ?? null
    }

    const { error: deleteError } = await admin
      .from('choices')
      .delete()
      .eq('question_id', questionId)
    if (deleteError) throw new Error(deleteError.message)

    const correctLabel = formData.get('correct_choice') as string

    // Resolve image URLs: upload new file if provided, otherwise keep existing.
    const choiceImageUrls: Partial<Record<string, string | null>> = {}
    for (const label of ['A', 'B', 'C', 'D'] as const) {
      const imageFile = formData.get(`choice_image_${label}`) as File | null
      if (imageFile && imageFile.size > 0) {
        choiceImageUrls[label] = await uploadToStorage(admin, 'choice-images', imageFile)
      } else {
        choiceImageUrls[label] = existingImageMap[label] ?? null
      }
    }

    const choices = (['A', 'B', 'C', 'D'] as const)
      .map((label) => ({
        question_id: questionId,
        label,
        text: (formData.get(`choice_${label}`) as string | null) ?? '',
        is_correct: label === correctLabel,
        choice_image_url: choiceImageUrls[label] ?? null,
      }))
      .filter((c) => c.text.trim() !== '' || c.choice_image_url !== null)

    if (choices.length > 0) {
      const { error: choiceError } = await admin.from('choices').insert(choices)
      if (choiceError) throw new Error(choiceError.message)
    }
  }

  redirect(`/admin/exams/${examId}/sections/${sectionId}/questions/${questionId}`)
}

// ------------------------------------------------------------------
// Delete Question
// ------------------------------------------------------------------

// Extracts the object path from a Supabase Storage public URL.
// e.g. "https://xxx.supabase.co/storage/v1/object/public/question-images/foo.png"
//   → "foo.png"
function getStoragePathFromPublicUrl(url: string, bucket: string): string | null {
  try {
    const marker = `/storage/v1/object/public/${bucket}/`
    const idx = url.indexOf(marker)
    if (idx === -1) return null
    const path = url.slice(idx + marker.length)
    return path || null
  } catch {
    return null
  }
}

export async function deleteQuestion(formData: FormData) {
  const admin = await requireAdmin()

  const questionId = formData.get('question_id') as string
  const examId = formData.get('exam_id') as string
  const sectionId = formData.get('section_id') as string

  // Fetch image URLs before the cascade delete removes the rows.
  const [{ data: question }, { data: imageBlocks }, { data: choicesWithImages }] =
    await Promise.all([
      admin
        .from('questions')
        .select('question_image_url')
        .eq('id', questionId)
        .single(),
      admin
        .from('explanation_blocks')
        .select('content')
        .eq('question_id', questionId)
        .eq('block_type', 'image'),
      admin
        .from('choices')
        .select('choice_image_url')
        .eq('question_id', questionId),
    ])

  // Build storage remove calls. Use allSettled so a missing/malformed file
  // never prevents the database row from being deleted.
  const storageOps: Promise<unknown>[] = []

  if (question?.question_image_url) {
    const path = getStoragePathFromPublicUrl(
      question.question_image_url,
      'question-images'
    )
    if (path) {
      storageOps.push(admin.storage.from('question-images').remove([path]))
    }
  }

  for (const block of imageBlocks ?? []) {
    const path = getStoragePathFromPublicUrl(block.content, 'explanation-images')
    if (path) {
      storageOps.push(admin.storage.from('explanation-images').remove([path]))
    }
  }

  for (const choice of choicesWithImages ?? []) {
    if (choice.choice_image_url) {
      const path = getStoragePathFromPublicUrl(choice.choice_image_url, 'choice-images')
      if (path) {
        storageOps.push(admin.storage.from('choice-images').remove([path]))
      }
    }
  }

  await Promise.allSettled(storageOps)

  // Delete the row — cascades to choices, explanation_blocks, user_answers.
  const { error } = await admin.from('questions').delete().eq('id', questionId)
  if (error) throw new Error(error.message)

  redirect(`/admin/exams/${examId}/sections/${sectionId}`)
}

// ------------------------------------------------------------------
// Save AI-Imported Questions
// ------------------------------------------------------------------

export async function saveImportedQuestions(formData: FormData) {
  const admin = await requireAdmin()

  const examId = formData.get('exam_id') as string
  const sectionId = formData.get('section_id') as string
  const questionsJson = formData.get('questions_json') as string

  type DraftChoice = { label: string; text: string; is_correct: boolean }
  type DraftQuestion = {
    number: number
    sub_label?: string | null
    question_type: 'multiple_choice'
    question_text: string
    choices: DraftChoice[]
    explanation: string
  }

  let drafts: DraftQuestion[]
  try {
    drafts = JSON.parse(questionsJson)
  } catch {
    throw new Error('Invalid question data — could not parse JSON')
  }

  for (const draft of drafts) {
    const draftSubLabel = parseSubLabel(draft.sub_label as string | null | undefined)
    const draftDisplayLabel = makeDisplayLabel(draft.number, draftSubLabel)

    const { data: question, error: qErr } = await admin
      .from('questions')
      .insert({
        exam_id: examId,
        section_id: sectionId,
        number: draft.number,
        sub_label: draftSubLabel,
        display_label: draftDisplayLabel,
        question_text: draft.question_text,
        question_type: 'multiple_choice',
        question_image_url: null,
        marks: 1,
      })
      .select('id')
      .single()

    if (qErr) throw new Error(qErr.message)

    if (draft.choices?.length) {
      const { error: cErr } = await admin.from('choices').insert(
        draft.choices.map((c) => ({
          question_id: question.id,
          label: c.label,
          text: c.text,
          is_correct: c.is_correct,
        }))
      )
      if (cErr) throw new Error(cErr.message)
    }

    if (draft.explanation?.trim()) {
      const { error: bErr } = await admin.from('explanation_blocks').insert({
        question_id: question.id,
        block_order: 1,
        block_type: 'text',
        content: draft.explanation,
      })
      if (bErr) throw new Error(bErr.message)
    }
  }

  redirect(`/admin/exams/${examId}/sections/${sectionId}`)
}

// ------------------------------------------------------------------
// Exam Access Settings
// ------------------------------------------------------------------

export async function updateExamAccess(examId: string, formData: FormData) {
  const admin = await requireAdmin()

  const accessType = formData.get('access_type') as 'free' | 'paid'
  const rawPrice = formData.get('price_amount') as string | null
  const priceAmount = rawPrice && rawPrice.trim() !== '' ? parseFloat(rawPrice) : null
  const priceCurrency = (formData.get('price_currency') as string)?.trim() || 'PGK'

  const { error } = await admin
    .from('exams')
    .update({
      access_type: accessType,
      price_amount: accessType === 'paid' ? priceAmount : null,
      price_currency: priceCurrency,
    })
    .eq('id', examId)

  if (error) throw new Error(error.message)

  redirect(`/admin/exams/${examId}`)
}

// ------------------------------------------------------------------
// Payment Request Review
// ------------------------------------------------------------------

export async function approvePaymentRequest(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) redirect('/dashboard')
  const admin = createAdminClient()

  const requestId = formData.get('request_id') as string
  const userId = formData.get('user_id') as string
  const examId = formData.get('exam_id') as string

  // Fetch email data in parallel with the access grant.
  const [{ data: paymentReq }, { data: exam }] = await Promise.all([
    admin.from('payment_requests').select('user_email').eq('id', requestId).maybeSingle(),
    admin.from('exams').select('subject, year, paper_number').eq('id', examId).maybeSingle(),
  ])

  // Grant access — upsert is a no-op if access already exists
  const { error: accessError } = await admin.from('user_exam_access').upsert(
    { user_id: userId, exam_id: examId, granted_by: user.id, source: 'manual_payment' },
    { onConflict: 'user_id,exam_id' }
  )
  if (accessError) throw new Error(accessError.message)

  const { error } = await admin
    .from('payment_requests')
    .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: user.id })
    .eq('id', requestId)
  if (error) throw new Error(error.message)

  // Send approval email best-effort — never block the approval flow.
  if (paymentReq?.user_email && exam) {
    await sendStudentPaymentApproved({ studentEmail: paymentReq.user_email, exam })
  }

  redirect('/admin/payments')
}

export async function rejectPaymentRequest(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) redirect('/dashboard')
  const admin = createAdminClient()

  const requestId = formData.get('request_id') as string
  const adminNote = (formData.get('admin_note') as string)?.trim() || null

  // Fetch email data before the update (user_email + exam details via join).
  const { data: paymentReq } = await admin
    .from('payment_requests')
    .select('user_email, exam_id, exams(subject, year, paper_number)')
    .eq('id', requestId)
    .maybeSingle()

  const { error } = await admin
    .from('payment_requests')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      admin_note: adminNote,
    })
    .eq('id', requestId)
  if (error) throw new Error(error.message)

  // Send rejection email best-effort — never block the rejection flow.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exam = (paymentReq as any)?.exams as { subject: string; year: number; paper_number: number } | null
  if (paymentReq?.user_email && exam) {
    await sendStudentPaymentRejected({ studentEmail: paymentReq.user_email, exam, adminNote })
  }

  redirect('/admin/payments')
}

// ------------------------------------------------------------------
// AI Plan Payment Review
// ------------------------------------------------------------------

export async function approveAiPaymentRequest(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) redirect('/dashboard')
  const admin = createAdminClient()

  const requestId = formData.get('request_id') as string

  // Fetch request + plan in parallel
  const { data: req } = await admin
    .from('ai_payment_requests')
    .select('user_id, user_email, plan_id, ai_credit_plans(name, monthly_message_limit)')
    .eq('id', requestId)
    .maybeSingle()

  if (!req) redirect('/admin/ai-payments')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plan = (req.ai_credit_plans as any) as { name: string; monthly_message_limit: number } | null

  const now = new Date()
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()

  // Upsert credits — resets counter and sets new expiry
  const { error: creditsError } = await admin.from('ai_user_credits').upsert(
    {
      user_id: req.user_id,
      plan_id: req.plan_id,
      monthly_message_limit: plan?.monthly_message_limit ?? 300,
      messages_used: 0,
      starts_at: now.toISOString(),
      expires_at: expiresAt,
      updated_at: now.toISOString(),
    },
    { onConflict: 'user_id' }
  )
  if (creditsError) throw new Error(creditsError.message)

  const { error } = await admin
    .from('ai_payment_requests')
    .update({ status: 'approved', reviewed_at: now.toISOString(), reviewed_by: user.id })
    .eq('id', requestId)
  if (error) throw new Error(error.message)

  if (req.user_email && plan) {
    await sendStudentAiPlanApproved({
      studentEmail: req.user_email,
      planName: plan.name,
      messagesTotal: plan.monthly_message_limit,
      expiresAt,
    })
  }

  redirect('/admin/ai-payments')
}

export async function rejectAiPaymentRequest(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) redirect('/dashboard')
  const admin = createAdminClient()

  const requestId = formData.get('request_id') as string
  const adminNote = (formData.get('admin_note') as string)?.trim() || null

  const { data: req } = await admin
    .from('ai_payment_requests')
    .select('user_email, plan_id, ai_credit_plans(name)')
    .eq('id', requestId)
    .maybeSingle()

  const { error } = await admin
    .from('ai_payment_requests')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      admin_note: adminNote,
    })
    .eq('id', requestId)
  if (error) throw new Error(error.message)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plan = (req?.ai_credit_plans as any) as { name: string } | null
  if (req?.user_email && plan) {
    await sendStudentAiPlanRejected({
      studentEmail: req.user_email,
      planName: plan.name,
      adminNote,
    })
  }

  redirect('/admin/ai-payments')
}

// ------------------------------------------------------------------
// Update Explanation Block
// ------------------------------------------------------------------

export async function updateExplanationBlock(blockId: string, formData: FormData) {
  const admin = await requireAdmin()

  const questionId = formData.get('question_id') as string
  const examId = formData.get('exam_id') as string
  const sectionId = formData.get('section_id') as string
  const blockType = formData.get('block_type') as 'text' | 'image'
  const blockOrder = parseInt(formData.get('block_order') as string)

  let content: string

  if (blockType === 'image') {
    const imageFile = formData.get('image') as File | null
    if (imageFile && imageFile.size > 0) {
      content = await uploadToStorage(
        admin,
        'explanation-images',
        imageFile,
        `${questionId}/`
      )
    } else {
      const existingContent = formData.get('existing_content') as string | null
      if (!existingContent) throw new Error('An image file is required for image blocks.')
      content = existingContent
    }
  } else {
    content = formData.get('content') as string
  }

  const { error } = await admin
    .from('explanation_blocks')
    .update({ block_order: blockOrder, block_type: blockType, content })
    .eq('id', blockId)

  if (error) throw new Error(error.message)

  redirect(`/admin/exams/${examId}/sections/${sectionId}/questions/${questionId}`)
}
