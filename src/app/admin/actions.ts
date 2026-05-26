'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/admin'

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

export async function createQuestion(formData: FormData) {
  const admin = await requireAdmin()

  const examId = formData.get('exam_id') as string
  const sectionId = formData.get('section_id') as string
  const questionType = formData.get('question_type') as string

  // Optional image upload
  let imageUrl: string | null = null
  const imageFile = formData.get('question_image') as File | null
  if (imageFile && imageFile.size > 0) {
    imageUrl = await uploadToStorage(admin, 'question-images', imageFile)
  }

  const { data: question, error } = await admin
    .from('questions')
    .insert({
      exam_id: examId,
      section_id: sectionId,
      number: parseInt(formData.get('number') as string),
      question_text: formData.get('question_text') as string,
      question_type: questionType,
      question_image_url: imageUrl,
      marks: parseInt(formData.get('marks') as string),
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  // Insert choices for multiple_choice questions
  if (questionType === 'multiple_choice') {
    const correctLabel = formData.get('correct_choice') as string
    const choices = (['A', 'B', 'C', 'D'] as const)
      .map((label) => ({
        question_id: question.id,
        label,
        text: (formData.get(`choice_${label}`) as string | null) ?? '',
        is_correct: label === correctLabel,
      }))
      .filter((c) => c.text.trim() !== '')

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

  // Use existing image URL unless a new file is uploaded
  let imageUrl: string | null = (formData.get('existing_image_url') as string) || null
  const imageFile = formData.get('question_image') as File | null
  if (imageFile && imageFile.size > 0) {
    imageUrl = await uploadToStorage(admin, 'question-images', imageFile)
  }

  const { error } = await admin
    .from('questions')
    .update({
      number: parseInt(formData.get('number') as string),
      question_text: formData.get('question_text') as string,
      question_type: questionType,
      question_image_url: imageUrl,
      marks: parseInt(formData.get('marks') as string),
    })
    .eq('id', questionId)

  if (error) throw new Error(error.message)

  if (questionType === 'multiple_choice') {
    const { error: deleteError } = await admin
      .from('choices')
      .delete()
      .eq('question_id', questionId)
    if (deleteError) throw new Error(deleteError.message)

    const correctLabel = formData.get('correct_choice') as string
    const choices = (['A', 'B', 'C', 'D'] as const)
      .map((label) => ({
        question_id: questionId,
        label,
        text: (formData.get(`choice_${label}`) as string | null) ?? '',
        is_correct: label === correctLabel,
      }))
      .filter((c) => c.text.trim() !== '')

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

export async function deleteQuestion(formData: FormData) {
  const admin = await requireAdmin()

  const questionId = formData.get('question_id') as string
  const examId = formData.get('exam_id') as string
  const sectionId = formData.get('section_id') as string

  const { error } = await admin.from('questions').delete().eq('id', questionId)

  if (error) throw new Error(error.message)

  redirect(`/admin/exams/${examId}/sections/${sectionId}`)
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
