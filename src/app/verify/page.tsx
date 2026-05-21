import { verifyOtp } from '@/app/auth/actions'

type Props = {
  searchParams: Promise<{ email?: string; error?: string }>
}

export default async function VerifyPage({ searchParams }: Props) {
  const { email, error } = await searchParams

  if (!email) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white px-6">
        <p className="text-gray-500">
          Missing email.{' '}
          <a href="/signup" className="text-blue-600 hover:underline">
            Go back to sign up.
          </a>
        </p>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
        <p className="text-sm text-gray-500 mb-6">
          We sent a 8-digit code to <span className="font-medium text-gray-700">{email}</span>.
          Enter it below to confirm your account.
        </p>

        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        <form action={verifyOtp} className="flex flex-col gap-4">
          <input type="hidden" name="email" value={email} />

          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              htmlFor="token"
            >
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Verify
          </button>
        </form>

        <p className="mt-4 text-sm text-center text-gray-600">
          Wrong email?{' '}
          <a href="/signup" className="text-blue-600 hover:underline font-medium">
            Sign up again
          </a>
        </p>
      </div>
    </main>
  )
}
