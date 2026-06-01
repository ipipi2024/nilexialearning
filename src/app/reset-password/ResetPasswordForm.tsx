'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'

type Step = 'verify' | 'password' | 'success'

const inputClass =
  'w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'

const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'

const stepLabel = 'text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-4 block'

function Spinner() {
  return (
    <svg className="animate-spin h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <p className="text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
      {message}
    </p>
  )
}

export function ResetPasswordForm({ email: initialEmail }: { email: string }) {
  const [step, setStep] = useState<Step>('verify')
  const [email, setEmail] = useState(initialEmail)
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const supabase = createClient()
      const { error: otpError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type: 'recovery',
      })

      if (otpError) {
        setError('Invalid or expired reset code. Please try again or request a new one.')
        return
      }

      setStep('password')
    })
  }

  function handlePasswordReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    startTransition(async () => {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) {
        setError(updateError.message)
        return
      }

      setStep('success')
    })
  }

  // ── Success ──────────────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl px-4 py-4 text-sm text-green-700 dark:text-green-400">
          Password updated successfully. Please log in with your new password.
        </div>
        <a
          href="/login"
          className="block w-full text-center bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm"
        >
          Go to login →
        </a>
      </div>
    )
  }

  // ── Step 1: Verify OTP ───────────────────────────────────────────────────────
  if (step === 'verify') {
    return (
      <form onSubmit={handleVerify} className="flex flex-col gap-4">
        <span className={stepLabel}>Step 1 of 2 — Verify Code</span>

        {error && <ErrorBanner message={error} />}

        <div>
          <label className={labelClass} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="token">
            Reset Code
          </label>
          <input
            id="token"
            type="text"
            inputMode="numeric"
            maxLength={8}
            required
            placeholder="12345678"
            autoComplete="one-time-code"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-sm tracking-widest text-center text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Check your email for the digit reset code.
          </p>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Spinner />
              Verifying...
            </span>
          ) : (
            'Verify Code'
          )}
        </button>
      </form>
    )
  }

  // ── Step 2: Set new password ─────────────────────────────────────────────────
  return (
    <form onSubmit={handlePasswordReset} className="flex flex-col gap-4">
      <span className={stepLabel}>Step 2 of 2 — Create New Password</span>

      {error && <ErrorBanner message={error} />}

      <div>
        <label className={labelClass} htmlFor="password">
          New Password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">At least 8 characters.</p>
      </div>

      <div>
        <label className={labelClass} htmlFor="confirm_password">
          Confirm Password
        </label>
        <input
          id="confirm_password"
          type="password"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <span className="inline-flex items-center justify-center gap-2">
            <Spinner />
            Updating password...
          </span>
        ) : (
          'Reset Password'
        )}
      </button>
    </form>
  )
}
