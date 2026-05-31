import type { Metadata } from 'next'
import { PublicNav } from '@/app/_components/PublicNav'

export const metadata: Metadata = {
  title: 'CQORIA — Practice PNG Exam Papers',
  description:
    'Prepare for Papua New Guinea national exams with mobile-friendly past papers, instant explanations, and automatic progress tracking.',
}

export default function HomePage() {
  return (
    <>
      <PublicNav />

      <main className="bg-white dark:bg-gray-950">

        {/* ── HERO ───────────────────────────────────────────────────────── */}
        <section className="py-20 md:py-28 px-4 bg-white dark:bg-gray-950">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

            {/* Left: text */}
            <div>
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3">
                PNG National Exam Prep
              </p>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-5">
                Practice exam papers — on your phone
              </h1>
              <p className="text-base text-gray-600 dark:text-gray-400 mb-8 leading-relaxed max-w-md">
                Every question. Instant explanations. Progress saved automatically.
                Study whenever you have a few minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="/practice"
                  className="inline-block bg-blue-600 text-white font-semibold px-7 py-3 rounded-xl hover:bg-blue-700 transition-colors text-sm text-center"
                >
                  Try Free Papers
                </a>
                <a
                  href="/signup"
                  className="inline-block bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-semibold px-7 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm text-center"
                >
                  Create Account
                </a>
              </div>
            </div>

            {/* Right: phone mockup card */}
            <div className="flex justify-center md:justify-end">
              <div className="w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden">
                {/* Header bar */}
                <div className="bg-blue-600 px-4 py-3 flex items-center justify-between">
                  <span className="text-white text-xs font-semibold">Mathematics — 2023</span>
                  <span className="text-blue-200 text-xs">Q12 of 50</span>
                </div>

                {/* Progress bar */}
                <div className="px-4 pt-3 pb-1">
                  <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '24%' }} />
                  </div>
                </div>

                {/* Question body */}
                <div className="px-4 pt-3 pb-2">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Question 12</p>
                  <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed mb-4">
                    Simplify: <span className="font-mono font-bold">3x² + 5x − 2</span> when <span className="font-mono">x = 2</span>.
                  </p>

                  {/* MC choices */}
                  <div className="space-y-2 mb-4">
                    {[
                      { label: 'A', text: '20', selected: false },
                      { label: 'B', text: '24', selected: true },
                      { label: 'C', text: '18', selected: false },
                      { label: 'D', text: '16', selected: false },
                    ].map((opt) => (
                      <div
                        key={opt.label}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs transition-colors ${
                          opt.selected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold'
                            : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            opt.selected
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                          }`}
                        >
                          {opt.label}
                        </span>
                        {opt.text}
                      </div>
                    ))}
                  </div>

                  {/* Indicators */}
                  <div className="flex gap-2">
                    <span className="text-xs bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 px-2 py-1 rounded-md">
                      Explanation available
                    </span>
                    <span className="text-xs bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 px-2 py-1 rounded-md">
                      Video tutorial
                    </span>
                  </div>
                </div>

                {/* Bottom bar */}
                <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                  <span className="text-xs text-gray-400">← Previous</span>
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Next →</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── WHY CQORIA ─────────────────────────────────────────────────── */}
        <section className="py-16 md:py-20 px-4 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">
              Why CQORIA
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-center text-sm mb-10">
              Everything you need to practise effectively — in one place.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                {
                  icon: '📱',
                  title: 'Mobile-first',
                  body: 'Your phone is already in your pocket. Study anywhere — on the bus, at home, during lunch.',
                },
                {
                  icon: '💡',
                  title: 'Instant explanations',
                  body: 'Every question comes with a written explanation and, for some, a video walkthrough.',
                },
                {
                  icon: '📊',
                  title: 'Progress saved',
                  body: 'Your answers are saved automatically. Come back and continue exactly where you stopped.',
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-6 py-6 hover:shadow-md dark:hover:shadow-gray-900 transition-shadow"
                >
                  <div className="text-3xl mb-4">{card.icon}</div>
                  <p className="font-semibold text-gray-900 dark:text-white mb-2">{card.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FROM PAPER TO PHONE ─────────────────────────────────────────── */}
        <section className="py-16 md:py-20 px-4 bg-white dark:bg-gray-950">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-10 text-center">
              From paper to phone
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

              {/* Old way */}
              <div className="border border-red-200 dark:border-red-900 rounded-2xl overflow-hidden">
                <div className="bg-red-50 dark:bg-red-950 px-5 py-3 border-b border-red-200 dark:border-red-900">
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400">The old way</p>
                </div>
                <ul className="px-5 py-4 space-y-3">
                  {[
                    'Carry printed papers everywhere',
                    'Flip between question and answer pages',
                    'Lose track of where you were',
                    'Start over each new session',
                    'No feedback until you check manually',
                  ].map((item) => (
                    <li key={item} className="flex gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <span className="text-red-400 font-bold shrink-0 mt-0.5">✕</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CQORIA way */}
              <div className="border border-blue-200 dark:border-blue-900 rounded-2xl overflow-hidden">
                <div className="bg-blue-50 dark:bg-blue-950 px-5 py-3 border-b border-blue-200 dark:border-blue-900">
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">With CQORIA</p>
                </div>
                <ul className="px-5 py-4 space-y-3">
                  {[
                    'Practice on your phone — no printing',
                    'Explanation shown right after each answer',
                    'Progress saved automatically',
                    'Continue exactly where you stopped',
                    'Instant feedback on every question',
                  ].map((item) => (
                    <li key={item} className="flex gap-3 text-sm text-gray-700 dark:text-gray-300">
                      <span className="text-blue-500 font-bold shrink-0 mt-0.5">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ───────────────────────────────────────────────── */}
        <section className="py-16 md:py-20 px-4 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-10 text-center">
              How it works
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              {[
                {
                  step: '1',
                  title: 'Choose a paper',
                  body: 'Browse past exam papers by subject and year.',
                },
                {
                  step: '2',
                  title: 'Answer at your pace',
                  body: 'Work through questions one at a time — no time pressure.',
                },
                {
                  step: '3',
                  title: 'Review & learn',
                  body: 'Read the explanation after each answer. Watch the tutorial if available.',
                },
                {
                  step: '4',
                  title: 'Continue next time',
                  body: 'Come back anytime — your progress is always saved.',
                },
              ].map((s) => (
                <div
                  key={s.step}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-5 hover:shadow-md dark:hover:shadow-gray-900 transition-shadow"
                >
                  <span className="flex w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold items-center justify-center mb-4">
                    {s.step}
                  </span>
                  <p className="font-semibold text-gray-900 dark:text-white mb-1.5">{s.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FREE PAPERS CTA ─────────────────────────────────────────────── */}
        <section className="py-16 md:py-20 px-4 bg-white dark:bg-gray-950">
          <div className="max-w-2xl mx-auto">
            <div className="bg-blue-600 dark:bg-blue-700 rounded-2xl px-8 py-10 text-center">
              <p className="text-xs font-semibold text-blue-200 uppercase tracking-widest mb-3">
                No account required
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                Try the platform for free
              </h2>
              <p className="text-blue-100 text-sm leading-relaxed mb-8 max-w-md mx-auto">
                Some papers are available as free samples. Start practising today — no commitment needed.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="/practice"
                  className="inline-block bg-white text-blue-600 font-semibold px-7 py-3 rounded-xl hover:bg-blue-50 transition-colors text-sm"
                >
                  Browse Free Papers
                </a>
                <a
                  href="/signup"
                  className="inline-block bg-blue-700 dark:bg-blue-800 border border-blue-500 text-white font-semibold px-7 py-3 rounded-xl hover:bg-blue-800 dark:hover:bg-blue-900 transition-colors text-sm"
                >
                  Create Account
                </a>
              </div>
            </div>
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
