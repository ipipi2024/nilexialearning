'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { saveImportedQuestions } from '@/app/admin/actions'
import { SubmitButton } from '@/components/SubmitButton'

type DraftChoice = { label: string; text: string; is_correct: boolean }

type DraftQuestion = {
  number: number
  sub_label?: string | null
  question_type: 'multiple_choice'
  question_text: string
  choices: DraftChoice[]
  explanation: string
  needs_review?: boolean
}

type Props = {
  examId: string
  sectionId: string
  existingLabels: string[]
}

function draftDisplayLabel(d: DraftQuestion): string {
  const sl = d.sub_label?.trim().toLowerCase().replace(/[()]/g, '') || null
  return sl ? `${d.number}(${sl})` : String(d.number)
}

function Md({ text }: { text: string }) {
  return (
    <div className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed break-words min-w-0">
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {text}
      </ReactMarkdown>
    </div>
  )
}

const inputCls =
  'w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-sm font-mono text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'

function DraftCard({
  draft,
  index,
  isDuplicate,
  onChange,
  onRemove,
}: {
  draft: DraftQuestion
  index: number
  isDuplicate: boolean
  onChange: (updated: DraftQuestion) => void
  onRemove: () => void
}) {
  const set = (field: keyof DraftQuestion, value: unknown) =>
    onChange({ ...draft, [field]: value })

  const setChoiceText = (label: string, text: string) =>
    onChange({
      ...draft,
      choices: draft.choices.map((c) => (c.label === label ? { ...c, text } : c)),
    })

  const setCorrect = (label: string) =>
    onChange({
      ...draft,
      choices: draft.choices.map((c) => ({ ...c, is_correct: c.label === label })),
    })

  return (
    <div
      className={`bg-white dark:bg-gray-800 border rounded-xl p-5 space-y-5 ${
        isDuplicate
          ? 'border-amber-400 dark:border-amber-600'
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      {/* Card header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Q{draftDisplayLabel(draft)}</span>
          {draft.needs_review && (
            <span className="text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full">
              Needs Review
            </span>
          )}
          {isDuplicate && (
            <span className="text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 px-2 py-0.5 rounded-full">
              ⚠ Label already exists — change number or sub-label below
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium shrink-0"
        >
          Remove
        </button>
      </div>

      {/* Edit fields */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Question No.</label>
            <input
              type="number"
              min="1"
              value={draft.number}
              onChange={(e) => set('number', parseInt(e.target.value) || draft.number)}
              className="w-20 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Sub-label <span className="font-normal">(optional, e.g. a)</span></label>
            <input
              type="text"
              value={draft.sub_label ?? ''}
              placeholder="a"
              onChange={(e) => set('sub_label', e.target.value.trim().toLowerCase().replace(/[()]/g, '') || null)}
              className="w-20 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Question Text</label>
          <textarea
            rows={3}
            value={draft.question_text}
            onChange={(e) => set('question_text', e.target.value)}
            className={inputCls}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
            Choices — select the correct answer with the radio button
          </label>
          {draft.choices.map((c) => (
            <div key={c.label} className="flex items-center gap-2">
              <input
                type="radio"
                name={`correct-${index}`}
                checked={c.is_correct}
                onChange={() => setCorrect(c.label)}
                className="shrink-0 accent-green-600"
                title={`Mark ${c.label} as correct`}
              />
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 w-4 shrink-0">{c.label}</span>
              <input
                type="text"
                value={c.text}
                onChange={(e) => setChoiceText(c.label, e.target.value)}
                className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-3 py-1.5 text-sm font-mono text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Explanation</label>
          <textarea
            rows={4}
            value={draft.explanation}
            onChange={(e) => set('explanation', e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      {/* Student preview */}
      <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-3">
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
          Student Preview
        </p>

        <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <Md text={draft.question_text} />
        </div>

        <ul className="space-y-1.5">
          {draft.choices.map((c) => (
            <li
              key={c.label}
              className={`flex items-start gap-2 rounded-xl border px-3 py-2 ${
                c.is_correct
                  ? 'bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}
            >
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-0.5 shrink-0">{c.label}</span>
              <div className="flex-1 min-w-0">
                <Md text={c.text} />
              </div>
              {c.is_correct && (
                <span className="text-xs text-green-600 dark:text-green-400 font-medium shrink-0 mt-0.5">✓</span>
              )}
            </li>
          ))}
        </ul>

        {draft.explanation && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-800 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">Explanation</p>
            <Md text={draft.explanation} />
          </div>
        )}
      </div>
    </div>
  )
}

export function AiImportShell({ examId, sectionId, existingLabels }: Props) {
  const [step, setStep] = useState<'upload' | 'preview'>('upload')
  const [drafts, setDrafts] = useState<DraftQuestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const existingLabelSet = new Set(existingLabels)
  const hasDuplicates = drafts.some((d) => existingLabelSet.has(draftDisplayLabel(d)))

  async function handleGenerate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fileInput = (e.currentTarget.elements.namedItem('image') as HTMLInputElement)
    const file = fileInput.files?.[0]
    if (!file) return

    setIsLoading(true)
    setError(null)

    try {
      const body = new FormData()
      body.append('image', file)

      const res = await fetch('/api/admin/ai-import', { method: 'POST', body })
      const json = await res.json()

      if (!res.ok) throw new Error(json.error ?? 'Failed to generate questions')
      if (!Array.isArray(json.questions) || json.questions.length === 0) {
        throw new Error('No questions were extracted from the image.')
      }

      setDrafts(json.questions as DraftQuestion[])
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  function updateDraft(index: number, updated: DraftQuestion) {
    setDrafts((prev) => prev.map((d, i) => (i === index ? updated : d)))
  }

  function removeDraft(index: number) {
    setDrafts((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      {/* Upload step */}
      {step === 'upload' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 max-w-lg">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Upload Exam Screenshot</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            AI will extract questions and generate draft data for your review.
          </p>

          {error && (
            <div className="mb-4 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Screenshot Image
              </label>
              <input
                name="image"
                type="file"
                accept="image/*"
                required
                className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-gray-300 dark:file:border-gray-600 file:text-sm file:font-medium file:bg-white dark:file:bg-gray-700 file:text-gray-700 dark:file:text-gray-300 hover:file:bg-gray-50 dark:hover:file:bg-gray-600"
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">PNG, JPEG, or WEBP. Max ~10 MB.</p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60 text-sm"
            >
              {isLoading ? 'Generating… this may take 10–20 seconds' : 'Generate Questions'}
            </button>
          </form>
        </div>
      )}

      {/* Preview step */}
      {step === 'preview' && (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {drafts.length} question{drafts.length !== 1 ? 's' : ''} extracted — review and
                edit before saving
              </p>
              {hasDuplicates && (
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                  Some labels already exist in this section. Edit the number or sub-label before saving.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setStep('upload')
                setDrafts([])
                setError(null)
              }}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 shrink-0 transition-colors"
            >
              ← Start over
            </button>
          </div>

          {drafts.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">All questions removed.</p>
          ) : (
            <div className="space-y-6">
              {drafts.map((draft, i) => (
                <DraftCard
                  key={i}
                  draft={draft}
                  index={i}
                  isDuplicate={existingLabelSet.has(draftDisplayLabel(draft))}
                  onChange={(updated) => updateDraft(i, updated)}
                  onRemove={() => removeDraft(i)}
                />
              ))}
            </div>
          )}

          {drafts.length > 0 && (
            <form action={saveImportedQuestions}>
              <input type="hidden" name="exam_id" value={examId} />
              <input type="hidden" name="section_id" value={sectionId} />
              <input type="hidden" name="questions_json" value={JSON.stringify(drafts)} />
              <SubmitButton
                pendingText="Saving questions..."
                disabled={hasDuplicates}
                className="w-full bg-green-600 text-white font-semibold py-3 rounded-xl hover:bg-green-700 transition-colors text-sm"
              >
                {hasDuplicates
                  ? 'Fix duplicate question numbers before saving'
                  : `Save ${drafts.length} Approved Question${drafts.length !== 1 ? 's' : ''}`}
              </SubmitButton>
            </form>
          )}
        </>
      )}
    </div>
  )
}
