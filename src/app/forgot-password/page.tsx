import { requestPasswordReset } from '@/app/auth/actions'
import { SubmitButton } from '@/components/SubmitButton'

type Props = {
  searchParams: Promise<{ sent?: string }>
}

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const { sent } = await searchParams

  return (
    <main className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <div className="px-6 py-4">
        <a href="/" className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">
          CQORIA
        </a>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Reset password</h1>

          {sent ? (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Check your inbox for next steps.
              </p>
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl px-4 py-4 text-sm text-green-700 dark:text-green-400">
                If an account exists for this email, a reset link has been sent. It may take a
                minute to arrive.
              </div>
              <p className="mt-5 text-sm text-center text-gray-500 dark:text-gray-400">
                <a href="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  Back to login
                </a>
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Enter your email and we&apos;ll send you a link to reset your password.
              </p>

              <form action={requestPasswordReset} className="flex flex-col gap-4">
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    htmlFor="email"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <SubmitButton
                  pendingText="Sending reset link..."
                  className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Send Reset Link
                </SubmitButton>
              </form>

              <p className="mt-5 text-sm text-center text-gray-500 dark:text-gray-400">
                <a href="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  Back to login
                </a>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
