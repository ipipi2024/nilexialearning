import { ResetPasswordForm } from './ResetPasswordForm'

type Props = {
  searchParams: Promise<{ email?: string }>
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { email } = await searchParams

  return (
    <main className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <div className="px-6 py-4">
        <a href="/" className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">
          CQORIA
        </a>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Reset your password
          </h1>

          <ResetPasswordForm email={email ?? ''} />

          <p className="mt-5 text-sm text-center text-gray-500 dark:text-gray-400">
            Didn&apos;t receive a code?{' '}
            <a
              href="/forgot-password"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Request again
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}
