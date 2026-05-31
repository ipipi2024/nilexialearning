import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { buildTutorSystemPrompt } from '@/lib/ai/tutorPrompt'

const DAILY_MESSAGE_LIMIT = 50
const MAX_HISTORY_MESSAGES = 20

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

  let body: { questionId?: string; attemptId?: string; message?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { questionId, attemptId, message } = body

  if (!questionId || typeof questionId !== 'string') {
    return Response.json({ error: 'questionId is required' }, { status: 400 })
  }
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return Response.json({ error: 'message is required' }, { status: 400 })
  }
  const trimmedMessage = message.trim()

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
  if (attemptId && typeof attemptId === 'string') {
    const { data: answerRow } = await supabase
      .from('user_answers')
      .select('answer')
      .eq('attempt_id', attemptId)
      .eq('question_id', questionId)
      .maybeSingle()
    studentAnswer = answerRow?.answer ?? null
  }

  // Load recent chat history for this user/question/attempt
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

  // Save the user's message
  await supabase.from('ai_tutor_messages').insert({
    user_id: user.id,
    question_id: questionId,
    attempt_id: attemptId ?? null,
    role: 'user',
    content: trimmedMessage,
  })

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

  // Call OpenAI
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: trimmedMessage },
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

  return Response.json({ message: assistantContent })
}
