import { requestPasswordReset } from '@/app/auth/actions'
import { SubmitButton } from '@/components/SubmitButton'

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <div className="px-6 py-4">
        <a href="/" className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">
          CQORIA
        </a>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Reset your password</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Enter your email and we&apos;ll send you a reset code.
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
              pendingText="Sending code..."
              className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Send Reset Code
            </SubmitButton>
          </form>

          <p className="mt-5 text-sm text-center text-gray-500 dark:text-gray-400">
            <a href="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
              Back to login
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}
