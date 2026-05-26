import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
      <div className="text-center max-w-xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          PNG Exam Practice Platform
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Practice past exam papers online.
        </p>
        <a
          href={user ? '/dashboard' : '/login'}
          className="inline-block bg-blue-600 text-white text-base font-semibold px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Get Started
        </a>
      </div>
    </main>
  )
}
