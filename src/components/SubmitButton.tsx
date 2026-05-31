'use client'

import { useFormStatus } from 'react-dom'

function Spinner() {
  return (
    <svg
      className="animate-spin h-3.5 w-3.5 shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

type Props = {
  children: React.ReactNode
  pendingText: string
  className?: string
  disabled?: boolean
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
}

export function SubmitButton({ children, pendingText, className = '', disabled, onClick }: Props) {
  const { pending } = useFormStatus()
  const isDisabled = pending || !!disabled

  return (
    <button
      type="submit"
      disabled={isDisabled}
      onClick={onClick}
      className={`${className} disabled:opacity-70 disabled:cursor-not-allowed`}
    >
      {pending ? (
        <span className="inline-flex items-center justify-center gap-2">
          <Spinner />
          {pendingText}
        </span>
      ) : (
        children
      )}
    </button>
  )
}
