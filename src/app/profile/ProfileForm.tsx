'use client'

import { useActionState } from 'react'
import { updateProfile } from './actions'
import type { ProfileFormState } from './actions'

const inputClass =
  'w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'

type Props = {
  fullName: string | null
  username: string | null
}

export function ProfileForm({ fullName, username }: Props) {
  const [state, action, isPending] = useActionState<ProfileFormState, FormData>(
    updateProfile,
    {}
  )

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="full_name">
          Full Name{' '}
          <span className="font-normal text-gray-400 dark:text-gray-500">(optional)</span>
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          defaultValue={fullName ?? ''}
          placeholder="Your full name"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="username">
          Username{' '}
          <span className="font-normal text-gray-400 dark:text-gray-500">(optional)</span>
        </label>
        <input
          id="username"
          name="username"
          type="text"
          defaultValue={username ?? ''}
          placeholder="e.g. john_doe"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className={inputClass}
        />
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Lowercase letters, numbers, and underscores only. 3–20 characters.
        </p>
      </div>

      {state.error && (
        <p className="text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
          {state.error}
        </p>
      )}

      {state.success && (
        <p className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3">
          Profile updated successfully.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <span className="inline-flex items-center justify-center gap-2">
            <svg className="animate-spin h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Saving...
          </span>
        ) : (
          'Save Profile'
        )}
      </button>
    </form>
  )
}
