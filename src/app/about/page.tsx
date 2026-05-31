import type { Metadata } from 'next'
import { PublicNav } from '@/app/_components/PublicNav'

export const metadata: Metadata = {
  title: 'About — Nilexia',
  description:
    'Why Nilexia exists and how it helps PNG students prepare for national exams.',
}

export default function AboutPage() {
  return (
    <>
      <PublicNav />

      <main>
        {/* ── WHY IT EXISTS ──────────────────────────────────────────────── */}
        <section className="bg-white py-16 md:py-24 px-4">
          <div className="max-w-2xl mx-auto">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">
              About
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
              Why this platform exists
            </h1>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                PNG students already use past exam papers to prepare for national exams. That
                approach works. Nilexia simply makes it easier.
              </p>
              <p>
                The goal is not to replace studying. It is to remove the friction that gets in
                the way of consistent, effective practice — so that students spend more time
                learning and less time managing papers.
              </p>
              <p>
                When practice is more accessible and progress is tracked automatically, students
                are more likely to keep going.
              </p>
            </div>
          </div>
        </section>

        {/* ── MISSION ────────────────────────────────────────────────────── */}
        <section className="bg-gray-50 py-16 md:py-20 px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Mission</h2>
            <p className="text-gray-600 leading-relaxed text-lg">
              Help Papua New Guinea students prepare more effectively for national exams by
              making past paper practice accessible, consistent, and trackable — on any device.
            </p>
          </div>
        </section>

        {/* ── WHY MOBILE ─────────────────────────────────────────────────── */}
        <section className="bg-white py-16 md:py-20 px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why mobile matters</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Many students have access to a phone before they have regular access to a computer
              or reliable printing. Building for mobile first means the platform works for more
              students in more situations.
            </p>
            <ul className="space-y-3">
              {[
                'Practice anywhere — at home, on the bus, or during any free moment',
                'Continue exactly where you stopped — no losing your place',
                'Learn at your own pace — one question at a time, with explanations',
              ].map((item) => (
                <li key={item} className="flex gap-3 text-gray-700">
                  <span className="text-blue-500 font-bold mt-0.5 shrink-0">–</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── FOUNDER ────────────────────────────────────────────────────── */}
        <section className="bg-gray-50 py-16 md:py-20 px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">About the builder</h2>
            <p className="text-gray-600 mb-5 leading-relaxed">
              Nilexia was built by a PNG student who went through national exams and wanted to
              make exam practice more accessible for other students facing the same challenges.
            </p>
            <ul className="space-y-1.5 mb-8">
              {[
                'Studied at Sogeri National High School',
                'Currently studying at Florida Institute of Technology',
                'Interested in artificial intelligence and education technology',
              ].map((item) => (
                <li key={item} className="flex gap-2.5 text-sm text-gray-600">
                  <span className="text-blue-500 font-bold mt-0.5 shrink-0">–</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────────────────── */}
        <section className="bg-white py-12 md:py-16 px-4 border-t border-gray-100">
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3">
            <a
              href="/practice"
              className="inline-block bg-blue-600 text-white font-semibold px-7 py-3 rounded-xl hover:bg-blue-700 transition-colors text-sm text-center"
            >
              Browse Practice Papers
            </a>
            <a
              href="/signup"
              className="inline-block bg-white border border-gray-300 text-gray-800 font-semibold px-7 py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm text-center"
            >
              Create Account
            </a>
          </div>
        </section>
      </main>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-gray-200 py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <span>© {new Date().getFullYear()} Nilexia</span>
          <nav className="flex gap-4">
            <a href="/" className="hover:text-gray-600 transition-colors">Home</a>
            <a href="/about" className="hover:text-gray-600 transition-colors">About</a>
            <a href="/practice" className="hover:text-gray-600 transition-colors">Practice Papers</a>
            <a href="/login" className="hover:text-gray-600 transition-colors">Login</a>
          </nav>
        </div>
      </footer>
    </>
  )
}
