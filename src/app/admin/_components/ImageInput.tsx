'use client'

import { useState, useRef, useEffect } from 'react'

type Props = {
  name: string
  label: string
  existingImageUrl?: string | null
  optional?: boolean
}

export function ImageInput({ name, label, existingImageUrl, optional = true }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const objUrlRef = useRef<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Revoke object URL on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      if (objUrlRef.current) URL.revokeObjectURL(objUrlRef.current)
    }
  }, [])

  function applyFile(file: File) {
    if (!file.type.startsWith('image/')) return
    if (objUrlRef.current) URL.revokeObjectURL(objUrlRef.current)
    // Attach the file to the hidden input so the form submits it normally
    const dt = new DataTransfer()
    dt.items.add(file)
    if (inputRef.current) inputRef.current.files = dt.files
    const url = URL.createObjectURL(file)
    objUrlRef.current = url
    setPreview(url)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) applyFile(file)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    // Only clear drag state when cursor leaves the zone entirely, not a child element
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) applyFile(file)
  }

  function handlePaste(e: React.ClipboardEvent) {
    const item = Array.from(e.clipboardData.items).find((i) =>
      i.type.startsWith('image/')
    )
    if (!item) return
    const file = item.getAsFile()
    if (file) applyFile(file)
  }

  function handleClear(e: React.MouseEvent) {
    // Stop propagation so the zone click handler doesn't re-open the file dialog
    e.stopPropagation()
    if (objUrlRef.current) URL.revokeObjectURL(objUrlRef.current)
    objUrlRef.current = null
    setPreview(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  function openFilePicker() {
    inputRef.current?.click()
  }

  const displayImage = preview ?? existingImageUrl ?? null
  const isExistingOnly = displayImage !== null && preview === null

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-gray-700">
        {label}
        {optional && <span className="ml-1 font-normal text-gray-400">(optional)</span>}
      </p>

      <div
        role="button"
        tabIndex={0}
        onClick={openFilePicker}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') openFilePicker()
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onPaste={handlePaste}
        className={[
          'relative rounded-xl border-2 border-dashed p-4 transition-colors cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
          isDragging
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 bg-white',
        ].join(' ')}
      >
        {displayImage ? (
          <div className="space-y-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayImage}
              alt="Preview"
              className="max-w-full h-auto max-h-48 object-contain rounded-lg border border-gray-200 mx-auto block"
            />
            <div className="flex items-center justify-center gap-3 text-xs">
              {isExistingOnly ? (
                <span className="text-gray-400">
                  Current image — click to replace, drag &amp; drop, or paste
                </span>
              ) : (
                <>
                  <span className="text-gray-500">New image selected — click to replace</span>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-red-500 hover:text-red-700 font-medium"
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="py-5 space-y-1 text-center select-none pointer-events-none">
            <p className="text-sm text-gray-500">
              Drag &amp; drop, or{' '}
              <span className="text-blue-600 font-medium">Choose File</span>
            </p>
            <p className="text-xs text-gray-400">Click here then press Ctrl+V to paste</p>
          </div>
        )}

        {/* Hidden input — server actions receive the File from this, unchanged */}
        <input
          ref={inputRef}
          type="file"
          name={name}
          accept="image/*"
          onChange={handleFileChange}
          onClick={(e) => e.stopPropagation()}
          className="sr-only"
          aria-label={label}
        />
      </div>
    </div>
  )
}
