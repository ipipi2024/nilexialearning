'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { ExplanationRenderer } from './ExplanationRenderer'
import { ZoomableImage } from './ZoomableImage'
import { saveAnswer, saveSelfCheck } from '@/app/practice/actions'
import type { Choice, ExplanationBlock, Question, UserAnswer } from '@/types/database'

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
  initialQuestionNumber?: number
}

export function PracticeShell({ attemptId, exam, questions, initialAnswers, initialQuestionNumber }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  const [currentIndex, setCurrentIndex] = useState(() => {
    if (!initialQuestionNumber) return 0
    const idx = questions.findIndex((q) => q.number === initialQuestionNumber)
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
  const [isPending, startTransition] = useTransition()
  const [navOpen, setNavOpen] = useState(false)

  const question = questions[currentIndex]
  const total = questions.length
  const currentAnswer = answers[question.id] ?? ''
  const isRevealed = revealed.has(question.id)

  function handleMCSelect(label: string) {
    if (isRevealed) return
    setAnswers((prev) => ({ ...prev, [question.id]: label }))

    const isCorrect = question.choices.find((c) => c.label === label)?.is_correct ?? false
    const newRevealed = new Set(revealed)
    newRevealed.add(question.id)
    setRevealed(newRevealed)
    setSelfChecks((prev) => ({ ...prev, [question.id]: isCorrect }))

    startTransition(async () => {
      await saveAnswer(attemptId, question.id, label)
      await saveSelfCheck(attemptId, question.id, isCorrect)
    })
  }

  function handleTextBlur(value: string) {
    if (value === (answers[question.id] ?? '')) return
    setAnswers((prev) => ({ ...prev, [question.id]: value }))
    startTransition(async () => {
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
    startTransition(async () => {
      await saveSelfCheck(attemptId, question.id, isCorrect)
    })
  }

  function navigateTo(index: number) {
    setCurrentIndex(index)
    router.replace(`${pathname}?q=${questions[index].number}`)
  }

  const selfCheck = selfChecks[question.id]

  return (
    <main className="min-h-screen bg-gray-50 min-w-0">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">
              {exam.subject} — Paper {exam.paper_number} ({exam.year})
            </p>
            <p className="text-sm font-semibold text-gray-800">
              Question {question.number} of {total}
            </p>
          </div>
          <a
            href="/practice"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Exit
          </a>
        </div>
      </header>

      {/* Progress bar */}
      <div className="w-full h-1 bg-gray-200">
        <div
          className="h-1 bg-blue-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
        />
      </div>

      {/* Question card */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Question text */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between gap-2 mb-3">
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              Q{question.number}
            </span>
            <span className="text-xs text-gray-400">{question.marks} mark{question.marks !== 1 ? 's' : ''}</span>
          </div>
          <div className="overflow-x-auto">
            <div className="text-gray-900 leading-relaxed prose prose-sm max-w-none break-words min-w-0">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {question.question_text}
              </ReactMarkdown>
            </div>
          </div>
          {/* Question image — below text, matching admin view order */}
          {question.question_image_url && (
            <ZoomableImage
              src={question.question_image_url}
              alt="Question diagram"
              className="mt-3 max-w-full h-auto rounded-lg border border-gray-200 cursor-zoom-in"
            />
          )}
        </div>

        {/* Answer area */}
        {question.question_type === 'multiple_choice' ? (
          <div className="space-y-2">
            {question.choices.map((choice) => {
              const isSelected = currentAnswer === choice.label
              let borderColor = 'border-gray-200 hover:border-blue-300'
              if (isRevealed && isSelected) {
                borderColor = choice.is_correct
                  ? 'border-green-500 bg-green-50'
                  : 'border-red-400 bg-red-50'
              } else if (isRevealed && choice.is_correct) {
                borderColor = 'border-green-400 bg-green-50'
              } else if (isSelected) {
                borderColor = 'border-blue-500 bg-blue-50'
              }

              return (
                <button
                  key={choice.id}
                  onClick={() => handleMCSelect(choice.label)}
                  disabled={isRevealed}
                  className={`w-full flex items-start gap-3 bg-white border rounded-xl px-4 py-3 text-left transition-colors ${borderColor}`}
                >
                  <span className="text-sm font-bold text-gray-500 w-5 shrink-0 mt-0.5">
                    {choice.label}
                  </span>
                  <span className="flex-1 min-w-0">
                    {choice.text && (
                      <span className="text-sm text-gray-800 block">
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
                      // Wrap in span to stop propagation so tapping the image
                      // zooms it rather than selecting the answer
                      <span
                        className={`block${choice.text ? ' mt-2' : ''}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ZoomableImage
                          src={choice.choice_image_url}
                          alt={`Choice ${choice.label} diagram`}
                          className="max-w-full h-auto object-contain rounded-lg border border-gray-200 cursor-zoom-in"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Answer
            </label>
            <textarea
              rows={question.question_type === 'long_response' ? 6 : 3}
              defaultValue={currentAnswer}
              onBlur={(e) => handleTextBlur(e.target.value)}
              placeholder="Write your answer here…"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        )}

        {/* Self-check for non-MC */}
        {question.question_type !== 'multiple_choice' && !isRevealed && (
          <button
            onClick={handleReveal}
            className="w-full border border-blue-300 text-blue-600 font-semibold py-2.5 rounded-xl hover:bg-blue-50 transition-colors text-sm"
          >
            Show Explanation
          </button>
        )}

        {/* Explanation */}
        {isRevealed && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <p className="text-sm font-semibold text-gray-700">Explanation</p>
            <ExplanationRenderer blocks={question.explanation_blocks} />

            {/* Self-check buttons for SA/LR */}
            {question.question_type !== 'multiple_choice' && (
              <div className="pt-2 border-t border-gray-100">
                {selfCheck == null ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 font-medium">How did you go?</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleSelfCheck(true)}
                        className="flex-1 bg-green-50 border border-green-300 text-green-700 font-semibold py-2 rounded-xl hover:bg-green-100 transition-colors text-sm"
                      >
                        Got it right
                      </button>
                      <button
                        onClick={() => handleSelfCheck(false)}
                        className="flex-1 bg-red-50 border border-red-300 text-red-700 font-semibold py-2 rounded-xl hover:bg-red-100 transition-colors text-sm"
                      >
                        Got it wrong
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`text-sm font-semibold px-3 py-2 rounded-lg ${
                      selfCheck
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-700'
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
                  selfCheck ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}
              >
                {selfCheck ? 'Correct!' : 'Incorrect'}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="pt-2 space-y-3">
          {/* Prev / Next row */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => navigateTo(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors"
            >
              ← Previous
            </button>
            <span className="text-xs text-gray-500 shrink-0">
              {currentIndex + 1} / {total}
            </span>
            <button
              onClick={() => navigateTo(Math.min(total - 1, currentIndex + 1))}
              disabled={currentIndex === total - 1}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors"
            >
              Next →
            </button>
          </div>

          {/* Question navigator card */}
          <div className="bg-white rounded-xl border border-gray-200 p-3">
            {/* Mobile toggle — hidden on sm+ where grid is always shown */}
            <button
              className="sm:hidden w-full flex items-center justify-between text-sm font-medium text-gray-700 py-0.5"
              onClick={() => setNavOpen((o) => !o)}
            >
              <span>Questions</span>
              <span className="text-gray-400 text-xs">{navOpen ? '▲ Hide' : '▼ Show'}</span>
            </button>

            {/* Grid: toggle-controlled on mobile, always visible on sm+ */}
            <div className={`${navOpen ? 'block' : 'hidden'} sm:block mt-2 sm:mt-0`}>
              <div className="flex flex-wrap gap-1.5">
                {questions.map((q, i) => {
                  const answered = answers[q.id] != null
                  const isCurrent = i === currentIndex
                  return (
                    <button
                      key={q.id}
                      onClick={() => navigateTo(i)}
                      className={`w-9 h-9 rounded-lg text-xs font-semibold transition-colors ${
                        isCurrent
                          ? 'bg-blue-600 text-white'
                          : answered
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {q.number}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {isPending && (
          <p className="text-center text-xs text-gray-400">Saving…</p>
        )}
      </div>
    </main>
  )
}
