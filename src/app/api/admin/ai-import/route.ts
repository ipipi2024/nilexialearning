import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'

const PROMPT = `You are extracting multiple choice exam questions from a screenshot of an exam paper.

Extract ALL visible multiple choice questions from the image.

Return a JSON object with a "questions" array. Every element must follow this exact shape:

{
  "questions": [
    {
      "number": <integer question number>,
      "question_type": "multiple_choice",
      "question_text": "<question text in Markdown; use $...$ for inline math and $$...$$ for display/block math>",
      "choices": [
        { "label": "A", "text": "<choice text with $...$ math>", "is_correct": false },
        { "label": "B", "text": "<choice text>", "is_correct": true },
        { "label": "C", "text": "<choice text>", "is_correct": false },
        { "label": "D", "text": "<choice text>", "is_correct": false }
      ],
      "explanation": "<clear step-by-step explanation in Markdown with $...$ math>",
      "needs_review": false
    }
  ]
}

Rules you must follow:
1. Use ONLY $...$ for inline math and $$...$$ for block/display math. Never use \\(...\\) or \\[...\\].
2. Preserve question numbers exactly as printed.
3. Always include all four choices A, B, C, D.
4. Exactly one choice must have "is_correct": true.
5. Set "needs_review": true if you are uncertain about the correct answer or any question content.
6. Return ONLY the JSON object — no surrounding text, no code fences.`

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !isAdmin(user.email)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: 'OPENAI_API_KEY is not configured' }, { status: 500 })
  }

  const formData = await request.formData()
  const imageFile = formData.get('image') as File | null

  if (!imageFile || imageFile.size === 0) {
    return Response.json({ error: 'No image provided' }, { status: 400 })
  }

  const buffer = Buffer.from(await imageFile.arrayBuffer())
  const base64 = buffer.toString('base64')
  const mimeType = imageFile.type || 'image/png'

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64}`,
              detail: 'high',
            },
          },
          { type: 'text', text: PROMPT },
        ],
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 4000,
  })

  const content = completion.choices[0]?.message?.content
  if (!content) {
    return Response.json({ error: 'No response from OpenAI' }, { status: 500 })
  }

  let parsed: { questions?: unknown[] }
  try {
    parsed = JSON.parse(content)
  } catch {
    return Response.json({ error: 'OpenAI returned invalid JSON' }, { status: 500 })
  }

  if (!Array.isArray(parsed.questions)) {
    return Response.json({ error: 'Unexpected response structure from OpenAI' }, { status: 500 })
  }

  return Response.json({ questions: parsed.questions })
}
