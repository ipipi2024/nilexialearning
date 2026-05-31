import type { Metadata } from 'next'
import { PublicNav } from '@/app/_components/PublicNav'

export const metadata: Metadata = {
  title: 'About — CQORIA',
  description:
    'Why CQORIA exists and how it helps PNG students prepare for national exams.',
}

export default function AboutPage() {
  return (
    <>
      <PublicNav />

      <main className="bg-white dark:bg-gray-950">

        {/* ── WHY CQORIA EXISTS ──────────────────────────────────────────── */}
        <section className="py-16 md:py-24 px-4 bg-white dark:bg-gray-950">
          <div className="max-w-2xl mx-auto">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3">
              About
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Why CQORIA exists
            </h1>
            <div className="space-y-4 text-gray-600 dark:text-gray-400 leading-relaxed">
              <p>
                PNG students already use past exam papers to prepare for national exams. That
                approach works. CQORIA simply removes the friction that gets in the way.
              </p>
              <p>
                The goal is not to replace studying — it is to make consistent practice easier.
                When practice is more accessible and progress is tracked automatically, students
                are more likely to keep going.
              </p>
            </div>
          </div>
        </section>

        {/* ── PROBLEM ────────────────────────────────────────────────────── */}
        <section className="py-16 md:py-20 px-4 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              The problem with paper-only practice
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              Most students already rely on past papers. But the traditional approach creates
              obstacles that get in the way of consistent, effective preparation.
            </p>
            <ul className="space-y-3">
              {[
                'Carrying printed papers to school, home, and everywhere in between',
                'Flipping between question pages and answer pages to check work',
                'Losing track of which questions have been completed or still need review',
                'Starting over from scratch each session instead of continuing where you left off',
                'No feedback until you manually locate the answer key',
              ].map((item) => (
                <li key={item} className="flex gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <span className="text-red-400 font-bold mt-0.5 shrink-0">✕</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── MISSION ────────────────────────────────────────────────────── */}
        <section className="py-16 md:py-20 px-4 bg-white dark:bg-gray-950">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Mission</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">
              Help Papua New Guinea students prepare more effectively for national exams by making
              past paper practice accessible, consistent, and trackable — on any device.
            </p>
          </div>
        </section>

        {/* ── WHAT WE'RE BUILDING NEXT ────────────────────────────────────── */}
        <section className="py-16 md:py-20 px-4 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              What we&apos;re building next
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              CQORIA is actively being developed. Upcoming features include:
            </p>
            <ul className="space-y-3">
              {[
                'More subjects and past paper years',
                'Detailed progress reports so you can see your weak areas',
                'Timed practice mode to simulate real exam conditions',
                'Offline support so you can practise without an internet connection',
              ].map((item) => (
                <li key={item} className="flex gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <span className="text-blue-500 font-bold mt-0.5 shrink-0">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────────────────── */}
        <section className="py-12 md:py-16 px-4 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3">
            <a
              href="/practice"
              className="inline-block bg-blue-600 text-white font-semibold px-7 py-3 rounded-xl hover:bg-blue-700 transition-colors text-sm text-center"
            >
              Browse Practice Papers
            </a>
            <a
              href="/signup"
              className="inline-block bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-semibold px-7 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm text-center"
            >
              Create Account
            </a>
          </div>
        </section>
      </main>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400 dark:text-gray-500">
          <span>© {new Date().getFullYear()} CQORIA</span>
          <nav className="flex gap-4">
            <a href="/" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Home</a>
            <a href="/about" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">About</a>
            <a href="/practice" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Practice Papers</a>
            <a href="/login" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Login</a>
          </nav>
        </div>
      </footer>
    </>
  )
}
