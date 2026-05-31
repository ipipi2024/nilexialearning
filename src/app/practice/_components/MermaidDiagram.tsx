'use client'

import { useEffect, useRef, useState } from 'react'

// Unique ID counter — Mermaid requires each render call to use a distinct ID
let counter = 0

function sanitizeSvg(svg: string): string {
  return svg
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
}

export function MermaidDiagram({ code }: { code: string }) {
  const [svg, setSvg] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const idRef = useRef(`mermaid-${++counter}`)

  useEffect(() => {
    let cancelled = false
    setSvg(null)
    setError(false)

    // Increment counter so re-renders after code changes use a fresh ID
    idRef.current = `mermaid-${++counter}`

    async function render() {
      try {
        const { default: mermaid } = await import('mermaid')
        const isDark =
          typeof document !== 'undefined' &&
          document.documentElement.classList.contains('dark')

        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'default',
          securityLevel: 'strict',
          fontFamily: 'inherit',
        })

        const { svg: rendered } = await mermaid.render(idRef.current, code)
        if (!cancelled) setSvg(sanitizeSvg(rendered))
      } catch {
        if (!cancelled) setError(true)
      }
    }

    render()
    return () => {
      cancelled = true
    }
  }, [code])

  if (error) {
    // Graceful fallback — show the raw diagram code so the student can still read it
    return (
      <pre className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-lg px-3 py-2 overflow-x-auto whitespace-pre-wrap my-2">
        {code}
      </pre>
    )
  }

  if (!svg) {
    return (
      <div className="text-xs text-gray-400 dark:text-gray-500 italic my-2 py-1">
        rendering diagram…
      </div>
    )
  }

  return (
    <div
      className="my-3 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-100 p-3 [&_svg]:max-w-full [&_svg]:h-auto"
      // SVG is sanitized above; content is AI-generated from our controlled system prompt
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
