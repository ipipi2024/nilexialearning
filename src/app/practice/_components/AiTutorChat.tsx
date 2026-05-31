'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { createClient } from '@/lib/supabase/client'
import type { AiTutorMessage } from '@/types/database'

type ChatMessage = Pick<AiTutorMessage, 'role' | 'content'>

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

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    setInput('')
    setError(null)
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
                      {msg.content}
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
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question… (Enter to send)"
              rows={2}
              disabled={isLoading}
              className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none disabled:opacity-60"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={isLoading || input.trim().length === 0}
              className="shrink-0 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 dark:disabled:bg-purple-900 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors h-[4.5rem] flex items-center justify-center"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
