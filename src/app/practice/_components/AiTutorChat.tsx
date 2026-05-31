'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { createClient } from '@/lib/supabase/client'
import type { AiTutorMessage } from '@/types/database'

type ChatMessage = Pick<AiTutorMessage, 'role' | 'content'>

// Normalize legacy LaTeX delimiters that remark-math does not parse.
// gpt-4o-mini sometimes outputs \(...\) or \[...\] despite instructions.
function normalizeLatex(content: string): string {
  return content
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$')
    .replace(/\\\[/g, '$$')
    .replace(/\\\]/g, '$$')
}

// Minimal types for the browser Speech Recognition API.
// These are not in all TypeScript DOM lib versions.
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

// Returns the SpeechRecognition constructor (handles webkit prefix), or null.
function getSpeechRecognitionAPI(): (new () => SRInstance) | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as Record<string, unknown>
  if (typeof w['SpeechRecognition'] === 'function') return w['SpeechRecognition'] as new () => SRInstance
  if (typeof w['webkitSpeechRecognition'] === 'function') return w['webkitSpeechRecognition'] as new () => SRInstance
  return null
}

type Props = {
  questionId: string
  attemptId: string
}

const STARTER_PROMPTS = [
  "I don't know where to start",
  'Give me a hint',
  'Explain the concept',
  'Check my reasoning',
]

export function AiTutorChat({ questionId, attemptId }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Voice input state
  const [isListening, setIsListening] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const recognitionRef = useRef<SRInstance | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Load history when first opened
  useEffect(() => {
    if (!isOpen || historyLoaded) return

    async function loadHistory() {
      const supabase = createClient()
      const { data } = await supabase
        .from('ai_tutor_messages')
        .select('role, content')
        .eq('question_id', questionId)
        .eq('attempt_id', attemptId)
        .order('created_at', { ascending: true })
        .limit(40)

      if (data && data.length > 0) {
        setMessages(data as ChatMessage[])
      }
      setHistoryLoaded(true)
    }

    loadHistory()
  }, [isOpen, historyLoaded, questionId, attemptId])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Stop recognition when drawer closes
  useEffect(() => {
    if (!isOpen && recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }, [isOpen])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
    }
  }, [])

  function toggleVoice() {
    setVoiceError(null)

    if (isListening) {
      recognitionRef.current?.stop()
      return
    }

    const SpeechRecognitionAPI = getSpeechRecognitionAPI()
    if (!SpeechRecognitionAPI) {
      setVoiceError(
        'Voice input is not supported on this browser. Please type your message.'
      )
      return
    }

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      const results = event.results
      const transcript = results[results.length - 1][0].transcript
      setInput((prev) => {
        const separator = prev.trim().length > 0 ? ' ' : ''
        return prev + separator + transcript
      })
    }

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setVoiceError(
          'Microphone permission denied. Please allow microphone access in your browser settings.'
        )
      } else if (event.error === 'no-speech') {
        setVoiceError('No speech detected. Please try again.')
      } else if (event.error === 'network') {
        setVoiceError('Could not connect to speech recognition service. Please check your connection.')
      } else if (event.error !== 'aborted') {
        setVoiceError('Voice input error. Please type your message.')
      }
    }

    recognition.onend = () => {
      setIsListening(false)
      recognitionRef.current = null
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    setInput('')
    setError(null)
    setVoiceError(null)
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }])
    setIsLoading(true)

    try {
      const res = await fetch('/api/ai-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, attemptId, message: trimmed }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        return
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }])
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

      {/* Drawer panel */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '82vh' }}
        aria-label="AI Tutor chat"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-purple-600 dark:text-purple-400">✦</span>
            <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">AI Tutor</span>
            <span className="text-xs text-gray-400 dark:text-gray-500 font-normal">
              — step by step
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 text-lg leading-none p-1 -mr-1"
            aria-label="Close AI Tutor"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
          {/* Intro line */}
          {messages.length === 0 && historyLoaded && (
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Let&apos;s work through this step by step.
              </p>
              {/* Starter prompts */}
              <div className="flex flex-wrap gap-2 justify-center">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
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

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
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
                    >
                      {normalizeLatex(msg.content)}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-2.5">
                <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                  Tutor is thinking…
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="shrink-0 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                setVoiceError(null)
              }}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? 'Listening…' : 'Ask a question… (Enter to send)'}
              rows={2}
              disabled={isLoading}
              className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none disabled:opacity-60"
            />

            {/* Mic button */}
            <button
              onClick={toggleVoice}
              disabled={isLoading}
              aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
              className={`shrink-0 flex flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-semibold transition-colors h-[4.5rem] w-12 ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                  : 'border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-purple-400 dark:hover:border-purple-600 hover:text-purple-600 dark:hover:text-purple-400 bg-white dark:bg-gray-800'
              } disabled:opacity-50`}
            >
              {isListening ? (
                <>
                  {/* Stop square icon */}
                  <span className="block w-3.5 h-3.5 rounded-sm bg-white" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  {/* Microphone icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                    aria-hidden="true"
                  >
                    <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                    <path d="M19 11a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V20H9a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2h-2v-2.08A7 7 0 0 0 19 11z" />
                  </svg>
                  <span>Mic</span>
                </>
              )}
            </button>

            {/* Send button */}
            <button
              onClick={() => sendMessage(input)}
              disabled={isLoading || input.trim().length === 0}
              className="shrink-0 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 dark:disabled:bg-purple-900 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors h-[4.5rem] flex items-center justify-center"
            >
              Send
            </button>
          </div>

          {/* Voice error / unsupported notice */}
          {voiceError && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">{voiceError}</p>
          )}
        </div>
      </div>
    </>
  )
}
