'use client'

import { useState, useEffect, useCallback } from 'react'

type Props = {
  src: string
  alt: string
  className?: string
}

export function ZoomableImage({ src, alt, className }: Props) {
  const [open, setOpen] = useState(false)

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    // Prevent page scroll behind the modal
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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onClick={() => setOpen(true)}
        className={className}
      />

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
              className="max-w-full h-auto object-contain rounded-lg"
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
