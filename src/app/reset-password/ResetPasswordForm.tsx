'use client'

import { useActionState } from 'react'
import { updatePassword } from '@/app/auth/actions'

type FormState = { error?: string; success?: boolean }

const inputClass =
  'w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'

function Spinner() {
  return (
    <svg className="animate-spin h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export function ResetPasswordForm() {
  const [state, action, isPending] = useActionState<FormState, FormData>(updatePassword, {})

  if (state.success) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl px-4 py-4 text-sm text-green-700 dark:text-green-400">
          Password updated successfully.
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

  return (
    <form action={action} className="flex flex-col gap-4">
      {state.error && (
        <p className="text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
          {state.error}
        </p>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="password">
          New Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">At least 8 characters.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="confirm_password">
          Confirm Password
        </label>
        <input
          id="confirm_password"
          name="confirm_password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
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
          'Update Password'
        )}
      </button>
    </form>
  )
}
