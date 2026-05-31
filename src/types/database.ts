// TypeScript types matching the PostgreSQL schema in 002_core_schema.sql.
// These are plain data shapes — no ORM, no abstraction.

export type Profile = {
  id: string
  full_name: string | null
  school: string | null
  grade: string | null
  created_at: string
}

export type Exam = {
  id: string
  subject: string
  year: number
  paper_number: number
  paper_type: string
  duration_minutes: number
  total_marks: number
  status: 'draft' | 'published'
  created_at: string
}

export type Section = {
  id: string
  exam_id: string
  name: string
  section_type: string
  marks: number
  question_start: number
  question_end: number
}

export type QuestionType = 'multiple_choice' | 'short_answer' | 'long_response'

export type Question = {
  id: string
  exam_id: string
  section_id: string
  number: number
  question_text: string
  question_type: QuestionType
  question_image_url: string | null
  tutorial_video_url: string | null
  marks: number
  created_at: string
}

export type Choice = {
  id: string
  question_id: string
  label: string
  text: string
  is_correct: boolean
  choice_image_url: string | null
}

export type BlockType = 'text' | 'image'

export type ExplanationBlock = {
  id: string
  question_id: string
  block_order: number
  block_type: BlockType
  content: string
}

export type AttemptMode = 'practice' | 'exam'

export type Attempt = {
  id: string
  user_id: string
  exam_id: string
  mode: AttemptMode
  score: number | null
  started_at: string
  submitted_at: string | null
}

export type SelfCheckStatus = 'correct' | 'incorrect'

export type UserAnswer = {
  id: string
  attempt_id: string
  question_id: string
  answer: string | null
  is_correct: boolean | null
  self_check_status: SelfCheckStatus | null
  created_at: string
}
