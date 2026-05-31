'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { createClient } from '@/lib/supabase/client'

// Lazy-load the Mermaid renderer — it's a large library only needed when diagrams appear
const MermaidDiagram = dynamic(
  () => import('./MermaidDiagram').then((m) => ({ default: m.MermaidDiagram })),
  { ssr: false, loading: () => <div className="text-xs text-gray-400 dark:text-gray-500 italic my-2">rendering diagram…</div> }
)

// Lazy-load the function graph renderer
const FunctionGraph = dynamic(
  () => import('./FunctionGraph').then((m) => ({ default: m.FunctionGraph })),
  { ssr: false }
)

// ```svg blocks — render sanitized SVG inline
function SvgBlock({ code }: { code: string }) {
  const sanitized = code
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
  return (
    <div
      className="my-3 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-100 p-3 [&_svg]:max-w-full [&_svg]:h-auto"
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  )
}

// ```graph blocks — parse JSON spec and render function graph
function GraphBlock({ code }: { code: string }) {
  try {
    const spec = JSON.parse(code)
    return <FunctionGraph spec={spec} />
  } catch {
    return (
      <pre className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-lg px-3 py-2 overflow-x-auto my-2 whitespace-pre-wrap">
        {code}
      </pre>
    )
  }
}

// ---------------------------------------------------------------------------
// Graph content normalizer
// Catches the case where the AI outputs a bare JSON graph spec (no fenced block).
// If the message has no code fences but contains a top-level JSON object with
// graph-indicator fields, it wraps that object in a ```graph fence automatically.
// ---------------------------------------------------------------------------

const GRAPH_FIELD_RE = /"(?:xMin|xMax|yMin|yMax|functions|points)"\s*:/

function normalizeGraphContent(content: string): string {
  // Already has a graph fence or some other code fence — don't touch it
  if (content.includes('```')) return content
  // No graph-like fields at all — fast exit
  if (!GRAPH_FIELD_RE.test(content)) return content

  // Walk the string looking for the first top-level balanced JSON object
  let depth = 0
  let start = -1
  for (let i = 0; i < content.length; i++) {
    const ch = content[i]
    if (ch === '{') {
      if (depth === 0) start = i
      depth++
    } else if (ch === '}' && depth > 0) {
      depth--
      if (depth === 0 && start !== -1) {
        const candidate = content.slice(start, i + 1)
        if (GRAPH_FIELD_RE.test(candidate)) {
          try {
            JSON.parse(candidate)
            const before = content.slice(0, start).trimEnd()
            const after = content.slice(i + 1).trimStart()
            return (
              (before ? before + '\n\n' : '') +
              '```graph\n' + candidate + '\n```' +
              (after ? '\n\n' + after : '')
            )
          } catch {
            // Not valid JSON — leave as-is
          }
        }
        start = -1
      }
    }
  }
  return content
}

// Custom ReactMarkdown component map — intercepts mermaid, svg, and graph code blocks
const MD_COMPONENTS = {
  code({ className, children }: React.HTMLAttributes<HTMLElement>) {
    const lang = /language-(\w+)/.exec(className ?? '')?.[1]
    const raw = String(children).replace(/\n$/, '')
    if (lang === 'mermaid') return <MermaidDiagram code={raw} />
    if (lang === 'svg') return <SvgBlock code={raw} />
    if (lang === 'graph') return <GraphBlock code={raw} />
    return <code className={className}>{children}</code>
  },
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Attachment = { url: string; name: string | null; type: string | null }

type ChatMessage = {
  id?: string
  role: 'user' | 'assistant'
  content: string
  attachment?: Attachment
}

// Minimal types for the browser Speech Recognition API.
type SRInstance = {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeLatex(content: string): string {
  return content
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$')
    .replace(/\\\[/g, '$$')
    .replace(/\\\]/g, '$$')
}

function getSpeechRecognitionAPI(): (new () => SRInstance) | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as Record<string, unknown>
  if (typeof w['SpeechRecognition'] === 'function') return w['SpeechRecognition'] as new () => SRInstance
  if (typeof w['webkitSpeechRecognition'] === 'function') return w['webkitSpeechRecognition'] as new () => SRInstance
  return null
}

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024

// ---------------------------------------------------------------------------
// Props / constants
// ---------------------------------------------------------------------------

type Props = { questionId: string; attemptId: string }

const STARTER_PROMPTS = [
  "I don't know where to start",
  'Give me a hint',
  'Explain the concept',
  'Check my reasoning',
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AiTutorChat({ questionId, attemptId }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [upgradeRequired, setUpgradeRequired] = useState(false)

  // Credits
  const [credits, setCredits] = useState<{ used: number; limit: number } | null>(null)

  // Voice
  const [isListening, setIsListening] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const recognitionRef = useRef<SRInstance | null>(null)

  // Attachment
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null)
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Image zoom (rendered OUTSIDE the drawer to avoid transform stacking context)
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // -------------------------------------------------------------------------
  // Scroll
  // -------------------------------------------------------------------------

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  // -------------------------------------------------------------------------
  // History load
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!isOpen || historyLoaded) return

    async function loadHistory() {
      const supabase = createClient()

      const [{ data: msgs }, { data: attachments }, { data: creditsRow }] = await Promise.all([
        supabase
          .from('ai_tutor_messages')
          .select('id, role, content')
          .eq('question_id', questionId)
          .eq('attempt_id', attemptId)
          .order('created_at', { ascending: true })
          .limit(40),
        supabase
          .from('ai_tutor_attachments')
          .select('message_id, file_url, file_name, file_type')
          .eq('question_id', questionId),
        supabase
          .from('ai_user_credits')
          .select('messages_used, monthly_message_limit')
          .maybeSingle(),
      ])

      if (creditsRow) {
        setCredits({ used: creditsRow.messages_used, limit: creditsRow.monthly_message_limit })
      }

      const attachMap = new Map(
        (attachments ?? []).map((a) => [
          a.message_id as string,
          { url: a.file_url as string, name: a.file_name as string | null, type: a.file_type as string | null },
        ])
      )

      const merged: ChatMessage[] = (msgs ?? []).map((m) => ({
        id: m.id as string,
        role: m.role as 'user' | 'assistant',
        content: m.content as string,
        attachment: m.id ? attachMap.get(m.id as string) : undefined,
      }))

      if (merged.length > 0) setMessages(merged)
      setHistoryLoaded(true)
    }

    loadHistory()
  }, [isOpen, historyLoaded, questionId, attemptId])

  // -------------------------------------------------------------------------
  // Focus + cleanup
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) recognitionRef.current?.stop()
  }, [isOpen])

  useEffect(() => {
    return () => { recognitionRef.current?.stop() }
  }, [])

  // -------------------------------------------------------------------------
  // Attachment
  // -------------------------------------------------------------------------

  function handleAttachClick() {
    setAttachmentError(null)
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (file.type === 'application/pdf') {
      setAttachmentError('PDF upload is not supported yet. Please upload an image (PNG, JPG, or WebP).')
      return
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setAttachmentError('Only PNG, JPG, and WebP images are supported.')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setAttachmentError('File size must be 5 MB or less.')
      return
    }

    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl)
    setPendingFile(file)
    setPendingPreviewUrl(URL.createObjectURL(file))
    setAttachmentError(null)
  }

  function clearAttachment() {
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl)
    setPendingFile(null)
    setPendingPreviewUrl(null)
    setAttachmentError(null)
  }

  // -------------------------------------------------------------------------
  // Voice
  // -------------------------------------------------------------------------

  function toggleVoice() {
    setVoiceError(null)
    if (isListening) { recognitionRef.current?.stop(); return }

    const API = getSpeechRecognitionAPI()
    if (!API) {
      setVoiceError('Voice input is not supported on this browser. Please type your message.')
      return
    }

    const r = new API()
    r.continuous = false
    r.interimResults = false
    r.lang = 'en-US'

    r.onresult = (e) => {
      const t = e.results[e.results.length - 1][0].transcript
      setInput((prev) => prev + (prev.trim() ? ' ' : '') + t)
    }
    r.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setVoiceError('Microphone permission denied. Please allow microphone access in your browser settings.')
      } else if (e.error === 'no-speech') {
        setVoiceError('No speech detected. Please try again.')
      } else if (e.error === 'network') {
        setVoiceError('Could not connect to speech recognition. Please check your connection.')
      } else if (e.error !== 'aborted') {
        setVoiceError('Voice input error. Please type your message.')
      }
    }
    r.onend = () => { setIsListening(false); recognitionRef.current = null }

    recognitionRef.current = r
    r.start()
    setIsListening(true)
  }

  // -------------------------------------------------------------------------
  // Send
  // -------------------------------------------------------------------------

  async function sendMessage(text: string, fileOverride?: File | null) {
    const trimmed = text.trim()
    const fileToSend = fileOverride !== undefined ? fileOverride : pendingFile
    if ((!trimmed && !fileToSend) || isLoading) return

    // Optimistic UI
    const optimisticAttachment: Attachment | undefined = fileToSend && pendingPreviewUrl
      ? { url: pendingPreviewUrl, name: fileToSend.name, type: fileToSend.type }
      : undefined

    setInput('')
    setError(null)
    setUpgradeRequired(false)
    setVoiceError(null)
    setAttachmentError(null)
    setPendingFile(null)
    setPendingPreviewUrl(null)
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: trimmed || '(image attached)', attachment: optimisticAttachment },
    ])
    setIsLoading(true)

    try {
      const fd = new FormData()
      fd.append('questionId', questionId)
      fd.append('attemptId', attemptId)
      fd.append('message', trimmed)
      if (fileToSend) fd.append('attachment', fileToSend)

      const res = await fetch('/api/ai-tutor', { method: 'POST', body: fd })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        if (data.upgradeRequired) setUpgradeRequired(true)
        return
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }])
      // Update credit counter from API response
      if (typeof data.creditsRemaining === 'number' && typeof data.creditsTotal === 'number') {
        setCredits({ used: data.creditsTotal - data.creditsRemaining, limit: data.creditsTotal })
      }
    } catch {
      setError('Could not reach the AI tutor. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  const canSend = !isLoading && (input.trim().length > 0 || !!pendingFile)

  // -------------------------------------------------------------------------
  // JSX
  // -------------------------------------------------------------------------

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-400 font-semibold py-2.5 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950 transition-colors text-sm"
      >
        <span>✦</span>
        Ask AI Tutor
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer — has transition-transform, so fixed children are trapped inside.
          The image zoom overlay is rendered OUTSIDE this element. */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '82vh' }}
        role="dialog"
        aria-label="AI Tutor chat"
      >
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="max-w-3xl mx-auto w-full flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-purple-600 dark:text-purple-400 shrink-0">✦</span>
              <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm shrink-0">AI Tutor</span>
              {credits ? (
                <span className={`text-xs font-medium shrink-0 ${
                  credits.limit - credits.used <= 0
                    ? 'text-red-500 dark:text-red-400'
                    : credits.limit - credits.used < credits.limit * 0.15
                    ? 'text-amber-500 dark:text-amber-400'
                    : 'text-gray-400 dark:text-gray-500'
                }`}>
                  {Math.max(0, credits.limit - credits.used)}/{credits.limit} msgs
                </span>
              ) : (
                <span className="text-xs text-gray-400 dark:text-gray-500 font-normal shrink-0">— step by step</span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 text-lg leading-none p-1 -mr-1"
              aria-label="Close AI Tutor"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-3xl mx-auto w-full px-4 py-4 space-y-4">
          {messages.length === 0 && historyLoaded && (
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Let&apos;s work through this step by step.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt, null)}
                    disabled={isLoading}
                    className="text-xs border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 px-3 py-1.5 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-purple-300 dark:hover:border-purple-700 hover:text-purple-700 dark:hover:text-purple-400 transition-colors disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.length === 0 && !historyLoaded && (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center">Loading…</p>
          )}

          {messages.map((msg, i) => {
            // Pre-process assistant content: normalise LaTeX delimiters, then
            // wrap any bare graph JSON in a ```graph fence if needed.
            const processedContent =
              msg.role === 'assistant'
                ? normalizeGraphContent(normalizeLatex(msg.content))
                : msg.content

            // Widen the bubble to full-width so graphs have room to render on mobile
            const hasGraph =
              msg.role === 'assistant' && processedContent.includes('```graph')

            return (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`${hasGraph ? 'w-full' : 'max-w-[85%]'} rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert break-words [&_p]:mb-2 [&_p:last-child]:mb-0">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      components={MD_COMPONENTS}
                    >
                      {processedContent}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <>
                    {msg.content !== '(image attached)' && (
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    )}
                    {msg.attachment && (
                      <button
                        onClick={() => setExpandedImageUrl(msg.attachment!.url)}
                        className={`block rounded-xl overflow-hidden border border-white/20 hover:opacity-90 transition-opacity ${msg.content !== '(image attached)' ? 'mt-2' : ''}`}
                        aria-label="View full image"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={msg.attachment.url}
                          alt={msg.attachment.name ?? 'Attached image'}
                          className="max-h-40 w-auto max-w-full object-contain rounded-xl"
                        />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
            )
          })}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-2.5">
                <span className="text-sm text-gray-500 dark:text-gray-400 italic">Tutor is thinking…</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-xl px-4 py-3 space-y-2">
              <p>{error}</p>
              {upgradeRequired && (
                <a
                  href="/ai/upgrade"
                  className="inline-block text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  Upgrade AI Plan →
                </a>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>{/* end max-w-3xl */}
        </div>{/* end overflow-y-auto */}

        {/* Input area */}
        <div className="shrink-0 border-t border-gray-200 dark:border-gray-700">
          <div className="max-w-3xl mx-auto w-full px-4 py-3">
          {/* Attachment preview */}
          {pendingPreviewUrl && (
            <div className="mb-2 flex items-start gap-2">
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pendingPreviewUrl}
                  alt={pendingFile?.name ?? 'attachment preview'}
                  className="h-16 w-auto rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                />
                <button
                  onClick={clearAttachment}
                  aria-label="Remove attachment"
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 rounded-full flex items-center justify-center text-[10px] leading-none hover:bg-red-600 dark:hover:bg-red-500 dark:hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 pt-1 truncate max-w-[160px]">
                {pendingFile?.name}
              </p>
            </div>
          )}

          {/* Composer */}
          <div
            className={`flex items-end gap-1 rounded-2xl border px-3 py-2 transition-colors bg-white dark:bg-gray-800 ${
              isListening
                ? 'border-red-400 dark:border-red-500'
                : 'border-gray-200 dark:border-gray-700 focus-within:border-purple-400 dark:focus-within:border-purple-600 focus-within:ring-2 focus-within:ring-purple-500/20'
            }`}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); setVoiceError(null) }}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? 'Listening…' : 'Ask a question…'}
              rows={1}
              disabled={isLoading}
              className="flex-1 bg-transparent resize-none text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none leading-5 py-1 max-h-28 overflow-y-auto disabled:opacity-60"
            />

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Attach button */}
            <button
              onClick={handleAttachClick}
              disabled={isLoading}
              aria-label="Attach image"
              className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                pendingFile
                  ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60'
                  : 'text-gray-400 dark:text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/60'
              } disabled:opacity-40`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
                aria-hidden="true"
              >
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>

            {/* Mic button */}
            <button
              onClick={toggleVoice}
              disabled={isLoading}
              aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
              className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'text-gray-400 dark:text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/60'
              } disabled:opacity-40`}
            >
              {isListening ? (
                <span className="block w-3 h-3 rounded-sm bg-white" aria-hidden="true" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
                  <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                  <path d="M19 11a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V20H9a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2h-2v-2.08A7 7 0 0 0 19 11z" />
                </svg>
              )}
            </button>

            {/* Send button */}
            <button
              onClick={() => sendMessage(input)}
              disabled={!canSend}
              aria-label="Send message"
              className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors bg-purple-600 hover:bg-purple-700 disabled:bg-gray-100 dark:disabled:bg-gray-700 text-white disabled:text-gray-400 dark:disabled:text-gray-500"
            >
              {isLoading ? (
                <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
                  <path fillRule="evenodd" d="M11.47 2.47a.75.75 0 0 1 1.06 0l7.5 7.5a.75.75 0 1 1-1.06 1.06l-6.22-6.22V21a.75.75 0 0 1-1.5 0V4.81l-6.22 6.22a.75.75 0 1 1-1.06-1.06l7.5-7.5Z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>

          {/* Error notices */}
          {voiceError && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{voiceError}</p>}
          {attachmentError && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{attachmentError}</p>}
          </div>{/* end max-w-3xl */}
        </div>{/* end input area */}
      </div>

      {/* Image zoom overlay — rendered OUTSIDE the drawer so it is not trapped
          by the drawer's transition-transform stacking context. z-[60] sits above
          the backdrop (z-40) and the drawer (z-50). */}
      {expandedImageUrl && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex flex-col"
          onClick={() => setExpandedImageUrl(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Full-size image"
        >
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-white/50 text-xs">Tap outside to close</span>
            <button
              onClick={() => setExpandedImageUrl(null)}
              aria-label="Close image viewer"
              className="text-white bg-white/20 hover:bg-white/35 rounded-full w-9 h-9 flex items-center justify-center text-xl leading-none transition-colors"
            >
              ×
            </button>
          </div>
          <div
            className="flex-1 overflow-auto flex items-center justify-center px-4 pb-4"
            onClick={(e) => e.stopPropagation()}
            style={{ touchAction: 'auto' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={expandedImageUrl}
              alt="Attached image"
              className="max-w-full h-auto object-contain"
              style={{ touchAction: 'auto' }}
            />
          </div>
        </div>
      )}
    </>
  )
}
