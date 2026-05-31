import type { Metadata } from 'next'
import { PublicNav } from '@/app/_components/PublicNav'

export const metadata: Metadata = {
  title: 'Nilexia — Practice PNG Exam Papers',
  description:
    'Prepare for Papua New Guinea national exams with mobile-friendly past papers, instant explanations, and automatic progress tracking.',
}

export default function HomePage() {
  return (
    <>
      <PublicNav />

      <main>
        {/* ── HERO ───────────────────────────────────────────────────────── */}
        <section className="bg-white py-20 md:py-28 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight mb-5">
              Practice PNG Exam Papers
              <br className="hidden md:block" /> Anywhere, Anytime
            </h1>
            <p className="text-base md:text-lg text-gray-600 max-w-xl mx-auto mb-8 leading-relaxed">
              Prepare for national exams with mobile-friendly past papers, instant explanations,
              progress tracking, and tutorial videos.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/practice"
                className="inline-block bg-blue-600 text-white font-semibold px-7 py-3 rounded-xl hover:bg-blue-700 transition-colors text-sm"
              >
                Try Free Papers
              </a>
              <a
                href="/signup"
                className="inline-block bg-white border border-gray-300 text-gray-800 font-semibold px-7 py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
              >
                Create Account
              </a>
            </div>
            <p className="mt-6 text-xs text-gray-400">
              No paper stacks. No lost progress. Study anywhere.
            </p>
          </div>
        </section>

        {/* ── PROBLEM ────────────────────────────────────────────────────── */}
        <section className="bg-gray-50 py-16 md:py-20 px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Past papers work. But paper-based practice has friction.
            </h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Most students already use past exam papers to prepare. That approach works. But
              the traditional method creates obstacles that get in the way of consistent practice.
            </p>
            <ul className="space-y-3">
              {[
                'Carrying printed papers to school, home, and everywhere in between',
                'Flipping between question pages and answer pages to check answers',
                'Losing track of which questions you have completed or still need to review',
                'Starting over from the beginning each session instead of continuing where you left off',
              ].map((item) => (
                <li key={item} className="flex gap-3 text-gray-700">
                  <span className="text-red-400 font-bold mt-0.5 shrink-0">✕</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── SOLUTION ───────────────────────────────────────────────────── */}
        <section className="bg-white py-16 md:py-20 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Nilexia makes past paper practice easier
            </h2>
            <p className="text-gray-600 mb-10 leading-relaxed">
              The same past papers. Less friction. Practice on your phone,
              track your progress, and continue where you left off.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                {
                  title: 'Practice on your phone',
                  body: 'No printing needed. Wherever your phone is, your study session is.',
                },
                {
                  title: 'Save progress automatically',
                  body: 'Pick up exactly where you left off — no bookmarks or notes needed.',
                },
                {
                  title: 'Get explanations instantly',
                  body: 'Every question includes a written explanation you can read right after answering.',
                },
                {
                  title: 'Watch tutorial videos',
                  body: 'Some questions link to short video walkthroughs to help you understand the method.',
                },
                {
                  title: 'Practice one question at a time',
                  body: 'Work at your own pace without managing a full paper at once.',
                },
                {
                  title: 'Study anywhere',
                  body: 'On the bus, at home, during lunch. Any time you have a few minutes.',
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="border border-gray-200 rounded-xl px-5 py-4 bg-white"
                >
                  <p className="font-semibold text-gray-900 mb-1">{f.title}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ───────────────────────────────────────────────── */}
        <section className="bg-gray-50 py-16 md:py-20 px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-10">
              How it works
            </h2>
            <ol className="space-y-6">
              {[
                {
                  step: '1',
                  title: 'Choose an exam paper',
                  body: 'Browse available past exam papers by subject and year.',
                },
                {
                  step: '2',
                  title: 'Answer questions at your own pace',
                  body: 'Work through multiple-choice, short-answer, and long-response questions.',
                },
                {
                  step: '3',
                  title: 'Review explanations',
                  body: 'After each question, check the explanation and mark yourself right or wrong.',
                },
                {
                  step: '4',
                  title: 'Continue next time',
                  body: 'Your answers are saved. Come back and continue exactly where you stopped.',
                },
              ].map((s) => (
                <li key={s.step} className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">
                    {s.step}
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900 mb-0.5">{s.title}</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── FREE PAPERS ────────────────────────────────────────────────── */}
        <section className="bg-white py-16 md:py-20 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Try the platform for free
            </h2>
            <p className="text-gray-600 mb-3 leading-relaxed">
              Some exam papers are available as free samples so you can try the platform
              before purchasing access to additional papers.
            </p>
            <p className="text-gray-500 text-sm mb-8">
              No commitment needed. Start with a free paper today.
            </p>
            <a
              href="/practice"
              className="inline-block bg-blue-600 text-white font-semibold px-7 py-3 rounded-xl hover:bg-blue-700 transition-colors text-sm"
            >
              Browse Free Papers
            </a>
          </div>
        </section>

        {/* ── FOUNDER ────────────────────────────────────────────────────── */}
        <section className="bg-gray-50 py-16 md:py-20 px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Built by someone who went through it
            </h2>
            <p className="text-gray-600 mb-5 leading-relaxed">
              Nilexia was built by a student who went through PNG national exams and
              understands the challenges students face when preparing with limited resources.
            </p>
            <ul className="space-y-1.5">
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

        {/* ── FINAL CTA ──────────────────────────────────────────────────── */}
        <section className="bg-blue-600 py-16 md:py-20 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Start Practicing Today
            </h2>
            <p className="text-blue-100 mb-8 text-sm leading-relaxed">
              Consistent practice is the best preparation. Start with a free paper.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/practice"
                className="inline-block bg-white text-blue-600 font-semibold px-7 py-3 rounded-xl hover:bg-blue-50 transition-colors text-sm"
              >
                Browse Papers
              </a>
              <a
                href="/signup"
                className="inline-block bg-blue-700 text-white font-semibold px-7 py-3 rounded-xl hover:bg-blue-800 transition-colors text-sm border border-blue-500"
              >
                Create Account
              </a>
            </div>
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
