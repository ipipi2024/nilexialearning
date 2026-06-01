'use client'

import { useState, useEffect, useCallback } from 'react'

type Variant = 'question' | 'choice' | 'explanation'

// Constrain thumbnail display size per context. Images are never up-scaled
// (w-auto keeps natural size when smaller than the max), and the zoom modal
// always shows the original at full resolution.
const thumbnailClass: Record<Variant, string> = {
  question:    'block mx-auto w-auto h-auto max-w-full max-h-[320px] object-contain',
  choice:      'block mx-auto w-auto h-auto max-w-[220px] max-h-[160px] object-contain',
  explanation: 'block mx-auto w-auto h-auto max-w-full max-h-[360px] object-contain',
}

// Minimum wrapper height while the image is still loading, so the skeleton
// has visible space. Chosen to match typical image sizes for each context.
const skeletonMinHeight: Record<Variant, number> = {
  question:    180,
  choice:      120,
  explanation: 160,
}

type Props = {
  src: string
  alt: string
  variant: Variant
  /** Extra positional classes only, e.g. mt-3 — applied to the outer wrapper */
  className?: string
}

export function ZoomableImage({ src, alt, variant, className }: Props) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')

  // Reset whenever the source URL changes (e.g. component re-keyed with new src)
  useEffect(() => { setStatus('loading') }, [src])

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  return (
    <>
      {/* Wrapper — provides min-height while loading so the skeleton is visible.
          The img is always in the DOM so the browser fetches it and fires onLoad. */}
      <div
        className={`relative${className ? ` ${className}` : ''}`}
        style={status !== 'loaded' ? { minHeight: skeletonMinHeight[variant] } : undefined}
      >
        {/* Skeleton — shown while loading */}
        {status === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse">
            <span className="text-xs text-gray-400 dark:text-gray-500 select-none">
              Loading image…
            </span>
          </div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/60">
            <span className="text-xs text-gray-400 dark:text-gray-500 select-none">
              Image unavailable
            </span>
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-blue-500 dark:text-blue-400 hover:underline"
            >
              Open directly →
            </a>
          </div>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          onClick={() => status === 'loaded' && setOpen(true)}
          className={`${thumbnailClass[variant]} cursor-zoom-in transition-opacity duration-300 ${
            status === 'loaded' ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          className="fixed inset-0 z-50 flex flex-col bg-black/90"
          onClick={close}
        >
          {/* Header with close button */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-white/60 text-xs">
              Pinch to zoom on mobile
            </span>
            <button
              onClick={close}
              aria-label="Close image viewer"
              className="text-white bg-white/20 hover:bg-white/35 rounded-full w-9 h-9 flex items-center justify-center text-xl leading-none transition-colors"
            >
              ×
            </button>
          </div>

          {/* Scrollable image area — stopPropagation so panning doesn't close modal */}
          <div
            className="flex-1 overflow-auto flex items-center justify-center px-4 pb-2"
            onClick={(e) => e.stopPropagation()}
            style={{ touchAction: 'auto' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              className="max-w-full h-auto object-contain"
              style={{ touchAction: 'auto' }}
            />
          </div>

          {/* Footer instruction */}
          <p
            className="text-center text-white/40 text-xs py-3 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            Tap outside or press Escape to close
          </p>
        </div>
      )}
    </>
  )
}
