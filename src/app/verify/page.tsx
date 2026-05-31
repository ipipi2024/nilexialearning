import { verifyOtp } from '@/app/auth/actions'

type Props = {
  searchParams: Promise<{ email?: string; error?: string }>
}

export default async function VerifyPage({ searchParams }: Props) {
  const { email, error } = await searchParams

  if (!email) {
    return (
      <main className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
        <div className="px-6 py-4">
          <a href="/" className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">CQORIA</a>
        </div>
        <div className="flex-1 flex items-center justify-center px-6">
          <p className="text-gray-500 dark:text-gray-400">
            Missing email.{' '}
            <a href="/signup" className="text-blue-600 dark:text-blue-400 hover:underline">
              Go back to sign up.
            </a>
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Top bar */}
      <div className="px-6 py-4">
        <a href="/" className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">
          CQORIA
        </a>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Check your email</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            We sent an 8-digit code to{' '}
            <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span>.
            Enter it below to confirm your account.
          </p>

          {error && (
            <p className="mb-4 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <form action={verifyOtp} className="flex flex-col gap-4">
            <input type="hidden" name="email" value={email} />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="token">
                Verification code
              </label>
              <input
                id="token"
                name="token"
                type="text"
                inputMode="numeric"
                maxLength={8}
                required
                placeholder="12345678"
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-sm tracking-widest text-center text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Verify
            </button>
          </form>

          <p className="mt-5 text-sm text-center text-gray-500 dark:text-gray-400">
            Wrong email?{' '}
            <a href="/signup" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
              Sign up again
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}
