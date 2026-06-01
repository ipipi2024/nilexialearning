'use client'

import { useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { ExplanationRenderer } from './ExplanationRenderer'
import { ZoomableImage } from './ZoomableImage'
import { AiTutorChat } from './AiTutorChat'
import { getYouTubeEmbedUrl } from '@/lib/youtube'
import { saveAnswer, saveSelfCheck } from '@/app/practice/actions'
import type { Choice, ExplanationBlock, Question, UserAnswer } from '@/types/database'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type QuestionWithExtras = Question & {
  choices: Choice[]
  explanation_blocks: ExplanationBlock[]
}

type Props = {
  attemptId: string
  exam: {
    subject: string
    paper_number: number
    year: number
    paper_type: string
    total_marks: number
  }
  questions: QuestionWithExtras[]
  initialAnswers: UserAnswer[]
  initialQuestionId?: string
}

export function PracticeShell({ attemptId, exam, questions, initialAnswers, initialQuestionId }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  const [currentIndex, setCurrentIndex] = useState(() => {
    if (!initialQuestionId) return 0
    const idx = questions.findIndex((q) => q.id === initialQuestionId)
    return idx >= 0 ? idx : 0
  })
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const a of initialAnswers) {
      if (a.answer != null) map[a.question_id] = a.answer
    }
    return map
  })
  const [selfChecks, setSelfChecks] = useState<Record<string, boolean | null>>(() => {
    const map: Record<string, boolean | null> = {}
    for (const a of initialAnswers) {
      if (a.is_correct != null) map[a.question_id] = a.is_correct
    }
    return map
  })
  const [revealed, setRevealed] = useState<Set<string>>(() => {
    const s = new Set<string>()
    for (const a of initialAnswers) {
      if (a.self_check_status != null || a.is_correct != null) s.add(a.question_id)
    }
    return s
  })
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [navOpen, setNavOpen] = useState(false)

  // Counts in-flight saves so overlapping calls resolve correctly.
  const saveCount = useRef(0)
  // Tracks the timeout handle so we can cancel it if a new save starts.
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const question = questions[currentIndex]
  const total = questions.length
  const currentAnswer = answers[question.id] ?? ''
  const isRevealed = revealed.has(question.id)
  const isSaving = saveStatus === 'saving'

  async function withSave(fn: () => Promise<void>) {
    // Cancel any pending "saved → idle" timer when a new save starts.
    if (savedTimerRef.current) {
      clearTimeout(savedTimerRef.current)
      savedTimerRef.current = null
    }
    saveCount.current++
    setSaveStatus('saving')
    try {
      await fn()
      saveCount.current--
      if (saveCount.current === 0) {
        setSaveStatus('saved')
        savedTimerRef.current = setTimeout(() => {
          setSaveStatus((s) => (s === 'saved' ? 'idle' : s))
          savedTimerRef.current = null
        }, 1500)
      }
    } catch {
      saveCount.current--
      setSaveStatus('error')
    }
  }

  function handleMCSelect(label: string) {
    if (isRevealed) return
    // Instant local update — don't wait for save.
    setAnswers((prev) => ({ ...prev, [question.id]: label }))
    const isCorrect = question.choices.find((c) => c.label === label)?.is_correct ?? false
    const newRevealed = new Set(revealed)
    newRevealed.add(question.id)
    setRevealed(newRevealed)
    setSelfChecks((prev) => ({ ...prev, [question.id]: isCorrect }))
    withSave(async () => {
      await saveAnswer(attemptId, question.id, label)
      await saveSelfCheck(attemptId, question.id, isCorrect)
    })
  }

  function handleTextBlur(value: string) {
    if (value === (answers[question.id] ?? '')) return
    setAnswers((prev) => ({ ...prev, [question.id]: value }))
    withSave(async () => {
      await saveAnswer(attemptId, question.id, value)
    })
  }

  function handleReveal() {
    const newRevealed = new Set(revealed)
    newRevealed.add(question.id)
    setRevealed(newRevealed)
  }

  function handleSelfCheck(isCorrect: boolean) {
    setSelfChecks((prev) => ({ ...prev, [question.id]: isCorrect }))
    withSave(async () => {
      await saveSelfCheck(attemptId, question.id, isCorrect)
    })
  }

  function navigateTo(index: number) {
    if (isSaving) return
    setCurrentIndex(index)
    router.replace(`${pathname}?q=${questions[index].id}`)
  }

  const selfCheck = selfChecks[question.id]

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 min-w-0">
      {/* ── Sticky header ── */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {exam.subject} — Paper {exam.paper_number} ({exam.year})
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Question {question.display_label ?? question.number} of {total}
              </p>
              {/* Inline save status */}
              {saveStatus === 'saving' && (
                <span className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                  <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
                  Saving…
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                  ✓ Saved
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="text-xs font-medium text-red-600 dark:text-red-400">
                  ⚠ Could not save
                </span>
              )}
            </div>
          </div>
          <a
            href="/practice"
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            ← Exit
          </a>
        </div>

        {/* Question progress bar */}
        <div className="w-full h-1 bg-gray-200 dark:bg-gray-800">
          <div
            className="h-1 bg-blue-500 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
          />
        </div>

        {/* Save status bar — animated strip below progress */}
        <div className="w-full h-0.5 overflow-hidden">
          {saveStatus === 'saving' && (
            <div className="h-full bg-blue-400 dark:bg-blue-500 animate-pulse w-full" />
          )}
          {saveStatus === 'saved' && (
            <div className="h-full bg-green-400 dark:bg-green-500 w-full transition-colors duration-300" />
          )}
          {saveStatus === 'error' && (
            <div className="h-full bg-red-400 dark:bg-red-500 w-full" />
          )}
        </div>
      </header>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Error banner — persistent until next save attempt */}
        {saveStatus === 'error' && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400">
            <span className="shrink-0">⚠</span>
            <span>Could not save your answer. Please check your connection and try again.</span>
          </div>
        )}

        {/* Question card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-start justify-between gap-2 mb-3">
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full">
              Q{question.display_label ?? question.number}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {question.marks} mark{question.marks !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="overflow-x-auto">
            <div className="text-gray-900 dark:text-gray-100 leading-relaxed prose prose-sm max-w-none break-words min-w-0 dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {question.question_text}
              </ReactMarkdown>
            </div>
          </div>
          {question.question_image_url && (
            <ZoomableImage
              src={question.question_image_url}
              alt="Question diagram"
              variant="question"
              className="mt-3"
            />
          )}
        </div>

        {/* Answer area */}
        {question.question_type === 'multiple_choice' ? (
          <div className="space-y-2">
            {question.choices.map((choice) => {
              const isSelected = currentAnswer === choice.label
              let variantCls =
                'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-500'
              if (isRevealed && isSelected) {
                variantCls = choice.is_correct
                  ? 'border-green-500 bg-green-50 dark:bg-green-950 dark:border-green-600'
                  : 'border-red-400 bg-red-50 dark:bg-red-950 dark:border-red-600'
              } else if (isRevealed && choice.is_correct) {
                variantCls =
                  'border-green-400 bg-green-50 dark:bg-green-950 dark:border-green-600'
              } else if (isSelected) {
                variantCls = 'border-blue-500 bg-blue-50 dark:bg-blue-950 dark:border-blue-500'
              }

              return (
                <button
                  key={choice.id}
                  onClick={() => handleMCSelect(choice.label)}
                  disabled={isRevealed}
                  className={`w-full flex items-start gap-3 border rounded-xl px-4 py-3 text-left transition-colors ${variantCls}`}
                >
                  <span className="text-sm font-bold text-gray-500 dark:text-gray-400 w-5 shrink-0 mt-0.5">
                    {choice.label}
                  </span>
                  <span className="flex-1 min-w-0">
                    {choice.text && (
                      <span className="text-sm text-gray-800 dark:text-gray-200 block">
                        <ReactMarkdown
                          remarkPlugins={[remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={{ p: ({ children }) => <>{children}</> }}
                        >
                          {choice.text}
                        </ReactMarkdown>
                      </span>
                    )}
                    {choice.choice_image_url && (
                      <span
                        className={`block${choice.text ? ' mt-2' : ''}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ZoomableImage
                          src={choice.choice_image_url}
                          alt={`Choice ${choice.label} diagram`}
                          variant="choice"
                        />
                      </span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Your Answer
            </label>
            <textarea
              rows={question.question_type === 'long_response' ? 6 : 3}
              defaultValue={currentAnswer}
              onBlur={(e) => handleTextBlur(e.target.value)}
              placeholder="Write your answer here…"
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        )}

        {/* Reveal button (non-MC only, before reveal) */}
        {question.question_type !== 'multiple_choice' && !isRevealed && (
          <button
            onClick={handleReveal}
            className="w-full border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 font-semibold py-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors text-sm"
          >
            Show Explanation
          </button>
        )}

        {/* Explanation */}
        {isRevealed && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Explanation</p>
            <ExplanationRenderer blocks={question.explanation_blocks} />

            {/* Self-check for SA/LR */}
            {question.question_type !== 'multiple_choice' && (
              <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                {selfCheck == null ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      How did you go?
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleSelfCheck(true)}
                        disabled={isSaving}
                        className="flex-1 bg-green-50 dark:bg-green-950 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 font-semibold py-2 rounded-xl hover:bg-green-100 dark:hover:bg-green-900 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Got it right
                      </button>
                      <button
                        onClick={() => handleSelfCheck(false)}
                        disabled={isSaving}
                        className="flex-1 bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 font-semibold py-2 rounded-xl hover:bg-red-100 dark:hover:bg-red-900 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Got it wrong
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`text-sm font-semibold px-3 py-2 rounded-lg ${
                      selfCheck
                        ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400'
                        : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400'
                    }`}
                  >
                    {selfCheck ? 'Marked as correct' : 'Marked as incorrect'}
                  </div>
                )}
              </div>
            )}

            {/* MC result banner */}
            {question.question_type === 'multiple_choice' && selfCheck != null && (
              <div
                className={`text-sm font-semibold px-3 py-2 rounded-lg ${
                  selfCheck
                    ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400'
                    : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400'
                }`}
              >
                {selfCheck ? 'Correct!' : 'Incorrect'}
              </div>
            )}
          </div>
        )}

        {/* Video tutorial */}
        {isRevealed &&
          question.tutorial_video_url &&
          (() => {
            const embedUrl = getYouTubeEmbedUrl(question.tutorial_video_url)
            if (!embedUrl) return null
            return (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-3">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Video Tutorial
                </p>
                <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
                  <iframe
                    src={embedUrl}
                    className="h-full w-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              </div>
            )
          })()}

        {/* Navigation */}
        <div className="pt-2 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => navigateTo(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0 || isSaving}
              className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
              {currentIndex + 1} / {total}
            </span>
            <button
              onClick={() => navigateTo(Math.min(total - 1, currentIndex + 1))}
              disabled={currentIndex === total - 1 || isSaving}
              className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>

          {/* Question navigator */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
            <button
              className="sm:hidden w-full flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 py-0.5"
              onClick={() => setNavOpen((o) => !o)}
            >
              <span>Questions</span>
              <span className="text-gray-400 dark:text-gray-500 text-xs">
                {navOpen ? '▲ Hide' : '▼ Show'}
              </span>
            </button>

            <div className={`${navOpen ? 'block' : 'hidden'} sm:block mt-2 sm:mt-0`}>
              <div className="flex flex-wrap gap-1.5">
                {questions.map((q, i) => {
                  const answered = answers[q.id] != null
                  const isCurrent = i === currentIndex
                  return (
                    <button
                      key={q.id}
                      onClick={() => navigateTo(i)}
                      disabled={isSaving}
                      className={`min-w-9 h-9 px-1.5 rounded-lg text-xs font-semibold transition-colors disabled:cursor-not-allowed ${
                        isCurrent
                          ? 'bg-blue-600 text-white'
                          : answered
                          ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400 border border-green-300 dark:border-green-700'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                      } ${isSaving ? 'opacity-50' : ''}`}
                    >
                      {q.sub_label ? `${q.number}${q.sub_label}` : q.number}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* AI Tutor — keyed on questionId so chat resets when navigating */}
        <AiTutorChat key={question.id} questionId={question.id} attemptId={attemptId} />
      </div>
    </main>
  )
}
