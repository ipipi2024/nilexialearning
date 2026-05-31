import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import type { ChatCompletionMessageParam } from 'openai/resources/chat'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildTutorSystemPrompt } from '@/lib/ai/tutorPrompt'

const DAILY_MESSAGE_LIMIT = 50
const MAX_HISTORY_MESSAGES = 20
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: 'AI tutor is not configured' }, { status: 500 })
  }

  // Parse multipart form data
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const questionId = (formData.get('questionId') as string | null)?.trim()
  const attemptId = (formData.get('attemptId') as string | null)?.trim() || undefined
  const message = (formData.get('message') as string | null) ?? ''
  const trimmedMessage = message.trim()
  const attachmentFile = formData.get('attachment') as File | null
  const hasAttachment = !!attachmentFile && attachmentFile.size > 0

  if (!questionId) {
    return Response.json({ error: 'questionId is required' }, { status: 400 })
  }
  if (!trimmedMessage && !hasAttachment) {
    return Response.json({ error: 'A message or image is required' }, { status: 400 })
  }

  // Validate attachment
  if (hasAttachment) {
    if (attachmentFile.type === 'application/pdf') {
      return Response.json(
        { error: 'PDF upload is not supported yet. Please upload an image (PNG, JPG, or WebP).' },
        { status: 400 }
      )
    }
    if (!ALLOWED_IMAGE_TYPES.includes(attachmentFile.type)) {
      return Response.json(
        { error: 'Only PNG, JPG, and WebP images are supported.' },
        { status: 400 }
      )
    }
    if (attachmentFile.size > MAX_FILE_SIZE) {
      return Response.json({ error: 'File size must be 5 MB or less.' }, { status: 400 })
    }
  }

  // Load question with exam and choices — RLS ensures exam is published
  const { data: questionData } = await supabase
    .from('questions')
    .select(`
      id,
      question_text,
      tutorial_video_url,
      choices ( id, label, text, is_correct ),
      explanation_blocks ( block_type, content, block_order ),
      exams ( id, subject, year, paper_number, paper_type, access_type )
    `)
    .eq('id', questionId)
    .maybeSingle()

  if (!questionData || !questionData.exams) {
    return Response.json({ error: 'Question not found' }, { status: 404 })
  }

  const exam = questionData.exams as unknown as {
    id: string
    subject: string
    year: number
    paper_number: number
    paper_type: string
    access_type: string
  }

  // Paid exam access check
  if (exam.access_type === 'paid') {
    const { data: access } = await supabase
      .from('user_exam_access')
      .select('id')
      .eq('user_id', user.id)
      .eq('exam_id', exam.id)
      .maybeSingle()

    if (!access) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }
  }

  // Daily usage limit — count user messages sent today
  const todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)

  const { count: todayCount } = await supabase
    .from('ai_tutor_messages')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('role', 'user')
    .gte('created_at', todayStart.toISOString())

  if ((todayCount ?? 0) >= DAILY_MESSAGE_LIMIT) {
    return Response.json(
      {
        error:
          "You have reached today's AI tutor limit. Please continue practicing and try again tomorrow.",
      },
      { status: 429 }
    )
  }

  // Load student's current answer for this question if attemptId provided
  let studentAnswer: string | null = null
  if (attemptId) {
    const { data: answerRow } = await supabase
      .from('user_answers')
      .select('answer')
      .eq('attempt_id', attemptId)
      .eq('question_id', questionId)
      .maybeSingle()
    studentAnswer = answerRow?.answer ?? null
  }

  // Load recent chat history
  const historyQuery = supabase
    .from('ai_tutor_messages')
    .select('role, content')
    .eq('user_id', user.id)
    .eq('question_id', questionId)
    .order('created_at', { ascending: false })
    .limit(MAX_HISTORY_MESSAGES)

  if (attemptId) {
    historyQuery.eq('attempt_id', attemptId)
  } else {
    historyQuery.is('attempt_id', null)
  }

  const { data: historyRows } = await historyQuery
  const history = (historyRows ?? []).reverse()

  // Upload attachment to storage if present
  let attachmentUrl: string | null = null
  let imageBase64: string | null = null
  let imageType: string | null = null

  if (hasAttachment) {
    const buffer = Buffer.from(await attachmentFile.arrayBuffer())
    imageBase64 = buffer.toString('base64')
    imageType = attachmentFile.type

    const sanitizedName = attachmentFile.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100)
    const filePath = `${user.id}/${questionId}/${Date.now()}-${sanitizedName}`

    const adminClient = createAdminClient()
    const { error: uploadError } = await adminClient.storage
      .from('ai-tutor-attachments')
      .upload(filePath, buffer, { contentType: attachmentFile.type })

    if (uploadError) {
      return Response.json({ error: 'Failed to upload image. Please try again.' }, { status: 500 })
    }

    attachmentUrl = adminClient.storage
      .from('ai-tutor-attachments')
      .getPublicUrl(filePath).data.publicUrl
  }

  // Save the user's message — get ID back for attachment linking
  const { data: userMessageData } = await supabase
    .from('ai_tutor_messages')
    .insert({
      user_id: user.id,
      question_id: questionId,
      attempt_id: attemptId ?? null,
      role: 'user',
      content: trimmedMessage || '(image attached)',
    })
    .select('id')
    .single()

  // Save attachment metadata
  if (attachmentUrl && userMessageData?.id) {
    await supabase.from('ai_tutor_attachments').insert({
      message_id: userMessageData.id,
      user_id: user.id,
      question_id: questionId,
      file_url: attachmentUrl,
      file_name: attachmentFile!.name,
      file_type: attachmentFile!.type,
      file_size: attachmentFile!.size,
    })
  }

  // Build question context for the system prompt
  const choices = (questionData.choices as { label: string; text: string; is_correct: boolean }[])
    .slice()
    .sort((a, b) => a.label.localeCompare(b.label))

  const correctChoice = choices.find((c) => c.is_correct)

  const explanationBlocks = (
    questionData.explanation_blocks as { block_type: string; content: string; block_order: number }[]
  )
    .slice()
    .sort((a, b) => a.block_order - b.block_order)

  const explanationText = explanationBlocks
    .filter((b) => b.block_type === 'text')
    .map((b) => b.content)
    .join('\n\n')

  const systemPrompt = buildTutorSystemPrompt({
    subject: exam.subject,
    year: exam.year,
    paperNumber: exam.paper_number,
    paperType: exam.paper_type,
    questionText: questionData.question_text,
    choices: choices.map((c) => ({ label: c.label, text: c.text, isCorrect: c.is_correct })),
    correctLabel: correctChoice?.label ?? '(unknown)',
    explanationText,
    tutorialVideoUrl: questionData.tutorial_video_url ?? null,
    studentAnswer,
  })

  // Build the current user turn — include image if attached
  const currentUserMessage: ChatCompletionMessageParam = imageBase64
    ? {
        role: 'user',
        content: [
          {
            type: 'text',
            text: trimmedMessage || "I've attached an image to help explain my question.",
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${imageType};base64,${imageBase64}`,
              detail: 'high',
            },
          },
        ],
      }
    : { role: 'user', content: trimmedMessage }

  // Call OpenAI
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      ...history.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      currentUserMessage,
    ],
    max_tokens: 600,
    temperature: 0.4,
  })

  const assistantContent = completion.choices[0]?.message?.content
  if (!assistantContent) {
    return Response.json({ error: 'No response from AI tutor' }, { status: 500 })
  }

  // Save the assistant's message
  await supabase.from('ai_tutor_messages').insert({
    user_id: user.id,
    question_id: questionId,
    attempt_id: attemptId ?? null,
    role: 'assistant',
    content: assistantContent,
  })

  return Response.json({ message: assistantContent, attachmentUrl })
}
