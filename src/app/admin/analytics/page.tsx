/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from '@/lib/supabase/admin'
import {
  card,
  cardPad,
  pageTitle,
  sectionTitle,
  muted,
  mutedXs,
  badgeGreen,
  badgeGray,
  badgeAmber,
  badgeRed,
  badgeBlue,
} from '@/app/_components/ui/ds'

export const dynamic = 'force-dynamic'

function fmt(n: number | null | undefined): string {
  return (n ?? 0).toLocaleString()
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function fmtDateTime(d: string | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <div className={cardPad}>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
    </div>
  )
}

function SectionHead({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mb-4">
      <h2 className={sectionTitle}>{title}</h2>
      {desc && <p className={`${muted} mt-0.5`}>{desc}</p>}
    </div>
  )
}

export default async function AnalyticsPage() {
  const admin = createAdminClient()

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    totalUsersRes,
    newUsersTodayRes,
    newUsersWeekRes,
    totalAttemptsRes,
    totalAnswersRes,
    totalAiRes,
    pendingExamPayRes,
    pendingAiPayRes,
    aiTodayRes,
    aiWeekRes,
    activeWeekRes,
    recentAttemptsRes,
    recentAiRes,
    recentExamPayRes,
    examsRes,
    allAttemptsRes,
    allAnswersRes,
    profilesRes,
    allAiMsgsRes,
    aiCreditsRes,
    examPaymentsRes,
    aiPaymentsRes,
    examAccessRes,
    questionsRes,
  ] = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
    admin.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
    admin.from('attempts').select('*', { count: 'exact', head: true }),
    admin.from('user_answers').select('*', { count: 'exact', head: true }),
    admin.from('ai_tutor_messages').select('*', { count: 'exact', head: true }),
    admin.from('payment_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('ai_payment_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('ai_tutor_messages').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
    admin.from('ai_tutor_messages').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
    admin.from('attempts').select('user_id').gte('started_at', weekAgo),
    admin
      .from('attempts')
      .select('id, user_id, exam_id, started_at, mode')
      .order('started_at', { ascending: false })
      .limit(20),
    admin
      .from('ai_tutor_messages')
      .select('id, user_id, created_at')
      .eq('role', 'user')
      .order('created_at', { ascending: false })
      .limit(20),
    admin
      .from('payment_requests')
      .select('id, user_id, user_email, exam_id, created_at')
      .order('created_at', { ascending: false })
      .limit(20),
    admin
      .from('exams')
      .select('id, subject, year, paper_number, paper_type, status, access_type, price_amount, price_currency, total_marks')
      .order('year', { ascending: false }),
    admin.from('attempts').select('id, user_id, exam_id, score, started_at, submitted_at, mode'),
    admin.from('user_answers').select('attempt_id, question_id, is_correct, self_check_status'),
    admin.from('profiles').select('id, full_name, username, created_at').order('created_at', { ascending: false }),
    admin.from('ai_tutor_messages').select('user_id, question_id, role'),
    admin.from('ai_user_credits').select('user_id, messages_used, monthly_message_limit'),
    admin.from('payment_requests').select('id, user_id, user_email, exam_id, status, created_at'),
    admin.from('ai_payment_requests').select('id, user_id, user_email, plan_id, status, created_at'),
    admin.from('user_exam_access').select('user_id, exam_id'),
    admin.from('questions').select('id, display_label, number, sub_label, question_type, tutorial_video_url, exam_id'),
  ])

  const authUsersRaw = await (admin.auth.admin as any).listUsers({ perPage: 1000, page: 1 })
  const authUsers: any[] = authUsersRaw?.data?.users ?? []

  // ── Overview counts ──
  const totalUsers = totalUsersRes.count ?? 0
  const newUsersToday = newUsersTodayRes.count ?? 0
  const newUsersWeek = newUsersWeekRes.count ?? 0
  const totalAttempts = totalAttemptsRes.count ?? 0
  const totalAnswers = totalAnswersRes.count ?? 0
  const totalAiMessages = totalAiRes.count ?? 0
  const pendingPayments = (pendingExamPayRes.count ?? 0) + (pendingAiPayRes.count ?? 0)
  const aiToday = aiTodayRes.count ?? 0
  const aiWeek = aiWeekRes.count ?? 0
  const activeStudentsWeek = new Set((activeWeekRes.data ?? []).map((r: any) => r.user_id)).size

  // ── Data arrays ──
  const exams = (examsRes.data ?? []) as any[]
  const allAttempts = (allAttemptsRes.data ?? []) as any[]
  const allAnswers = (allAnswersRes.data ?? []) as any[]
  const profiles = (profilesRes.data ?? []) as any[]
  const allAiMsgs = (allAiMsgsRes.data ?? []) as any[]
  const aiCredits = (aiCreditsRes.data ?? []) as any[]
  const examPayments = (examPaymentsRes.data ?? []) as any[]
  const aiPayments = (aiPaymentsRes.data ?? []) as any[]
  const examAccess = (examAccessRes.data ?? []) as any[]
  const questions = (questionsRes.data ?? []) as any[]

  // ── Lookup maps ──
  const emailMap = new Map<string, string>(authUsers.map((u: any) => [u.id, u.email ?? ''] as [string, string]))
  const profileMap = new Map<string, any>(profiles.map((p: any) => [p.id, p]))
  const examMap = new Map<string, any>(exams.map((e: any) => [e.id, e]))
  const attemptUserMap = new Map<string, string>(allAttempts.map((a: any) => [a.id, a.user_id] as [string, string]))

  // ── Section 2: Recent Activity ──
  const recentAttempts = (recentAttemptsRes.data ?? []) as any[]
  const recentAi = (recentAiRes.data ?? []) as any[]
  const recentExamPay = (recentExamPayRes.data ?? []) as any[]

  type ActivityItem = {
    id: string
    email: string
    type: string
    label: string
    examLabel: string
    timestamp: string
  }

  const activityItems: ActivityItem[] = [
    ...recentAttempts.map((a: any) => {
      const ex = examMap.get(a.exam_id)
      return {
        id: a.id,
        email: emailMap.get(a.user_id) ?? '—',
        type: 'Attempt',
        label: `${a.mode === 'exam' ? 'Exam' : 'Practice'} started`,
        examLabel: ex ? `${ex.subject} ${ex.year} P${ex.paper_number}` : '—',
        timestamp: a.started_at,
      }
    }),
    ...recentAi.map((a: any) => ({
      id: a.id,
      email: emailMap.get(a.user_id) ?? '—',
      type: 'AI Tutor',
      label: 'Used AI tutor',
      examLabel: '—',
      timestamp: a.created_at,
    })),
    ...recentExamPay.map((p: any) => {
      const ex = examMap.get(p.exam_id)
      return {
        id: p.id,
        email: p.user_email ?? emailMap.get(p.user_id) ?? '—',
        type: 'Payment',
        label: 'Payment submitted',
        examLabel: ex ? `${ex.subject} ${ex.year} P${ex.paper_number}` : '—',
        timestamp: p.created_at,
      }
    }),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 30)

  // ── Section 3: Exam Performance ──
  const examStats = exams
    .map((exam: any) => {
      const attempts = allAttempts.filter((a: any) => a.exam_id === exam.id)
      const uniqueStudents = new Set(attempts.map((a: any) => a.user_id)).size
      const scores = attempts.filter((a: any) => a.score !== null).map((a: any) => Number(a.score))
      const avgScore = scores.length > 0 ? scores.reduce((s: number, x: number) => s + x, 0) / scores.length : null
      const completed = attempts.filter((a: any) => a.submitted_at !== null).length
      return { ...exam, attemptCount: attempts.length, uniqueStudents, avgScore, completed }
    })
    .sort((a: any, b: any) => b.attemptCount - a.attemptCount)

  // ── Section 4: Question Analytics ──
  type QStats = { total: number; correct: number; incorrect: number; scCorrect: number; scIncorrect: number }
  const qAnswerMap = new Map<string, QStats>()
  for (const ans of allAnswers) {
    if (!qAnswerMap.has(ans.question_id)) {
      qAnswerMap.set(ans.question_id, { total: 0, correct: 0, incorrect: 0, scCorrect: 0, scIncorrect: 0 })
    }
    const s = qAnswerMap.get(ans.question_id)!
    s.total++
    if (ans.is_correct === true) s.correct++
    else if (ans.is_correct === false) s.incorrect++
    if (ans.self_check_status === 'correct') s.scCorrect++
    else if (ans.self_check_status === 'incorrect') s.scIncorrect++
  }

  const questionStats = questions
    .map((q: any) => {
      const s = qAnswerMap.get(q.id) ?? { total: 0, correct: 0, incorrect: 0, scCorrect: 0, scIncorrect: 0 }
      const mcqTotal = s.correct + s.incorrect
      const correctRate = mcqTotal > 0 ? (s.correct / mcqTotal) * 100 : null
      const ex = examMap.get(q.exam_id)
      return {
        id: q.id,
        label: q.display_label ?? `Q${q.number}${q.sub_label ? `(${q.sub_label})` : ''}`,
        examLabel: ex ? `${ex.subject} ${ex.year} P${ex.paper_number}` : '—',
        type: q.question_type as string,
        hasVideo: !!q.tutorial_video_url,
        total: s.total,
        correct: s.correct,
        incorrect: s.incorrect,
        scCorrect: s.scCorrect,
        scIncorrect: s.scIncorrect,
        correctRate,
      }
    })
    .filter((q: any) => q.total > 0)
    .sort((a: any, b: any) => {
      if (a.correctRate !== null && b.correctRate !== null) return a.correctRate - b.correctRate
      if (a.correctRate !== null) return -1
      if (b.correctRate !== null) return 1
      return b.total - a.total
    })
    .slice(0, 50)

  const questionsWithVideo = questions.filter((q: any) => !!q.tutorial_video_url).length

  // ── Section 5: Student Analytics ──
  const answersPerUser = new Map<string, number>()
  for (const ans of allAnswers) {
    const userId = ans.attempt_id ? attemptUserMap.get(ans.attempt_id) : undefined
    if (userId) answersPerUser.set(userId, (answersPerUser.get(userId) ?? 0) + 1)
  }

  const aiMsgsPerUser = new Map<string, number>()
  for (const msg of allAiMsgs) {
    if (msg.role === 'user') aiMsgsPerUser.set(msg.user_id, (aiMsgsPerUser.get(msg.user_id) ?? 0) + 1)
  }

  const accessPerUser = new Map<string, number>()
  for (const a of examAccess) accessPerUser.set(a.user_id, (accessPerUser.get(a.user_id) ?? 0) + 1)

  const attemptsPerUser = new Map<string, any[]>()
  for (const a of allAttempts) {
    if (!attemptsPerUser.has(a.user_id)) attemptsPerUser.set(a.user_id, [])
    attemptsPerUser.get(a.user_id)!.push(a)
  }

  const studentStats = profiles.map((p: any) => {
    const userAttempts = attemptsPerUser.get(p.id) ?? []
    const lastAttempt =
      userAttempts.length > 0
        ? userAttempts.reduce((latest: any, a: any) =>
            new Date(a.started_at) > new Date(latest.started_at) ? a : latest
          )
        : null
    return {
      id: p.id,
      email: emailMap.get(p.id) ?? '—',
      full_name: p.full_name ?? '',
      username: p.username ?? '',
      created_at: p.created_at,
      attemptCount: userAttempts.length,
      answeredCount: answersPerUser.get(p.id) ?? 0,
      aiCount: aiMsgsPerUser.get(p.id) ?? 0,
      paidPapers: accessPerUser.get(p.id) ?? 0,
      lastActivity: lastAttempt?.started_at ?? null,
    }
  })

  // ── Section 6: AI Analytics ──
  const questionAiMap = new Map<string, number>()
  for (const msg of allAiMsgs) {
    if (msg.role === 'user' && msg.question_id) {
      questionAiMap.set(msg.question_id, (questionAiMap.get(msg.question_id) ?? 0) + 1)
    }
  }

  const topAiQuestions = [...questionAiMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([qId, count]) => {
      const q = questions.find((q: any) => q.id === qId)
      const ex = q ? examMap.get(q.exam_id) : null
      return {
        questionId: qId,
        label: q ? (q.display_label ?? `Q${q.number}`) : 'Unknown',
        examLabel: ex ? `${ex.subject} ${ex.year} P${ex.paper_number}` : '—',
        count,
      }
    })

  const topAiUsers = [...aiMsgsPerUser.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([userId, count]) => ({
      userId,
      email: emailMap.get(userId) ?? '—',
      name: profileMap.get(userId)?.full_name ?? '',
      count,
    }))

  const atLimitStudents = aiCredits
    .filter((c: any) => c.monthly_message_limit > 0 && c.messages_used >= c.monthly_message_limit * 0.8)
    .map((c: any) => ({
      userId: c.user_id,
      email: emailMap.get(c.user_id) ?? '—',
      name: profileMap.get(c.user_id)?.full_name ?? '',
      used: c.messages_used as number,
      limit: c.monthly_message_limit as number,
      pct: Math.round((c.messages_used / c.monthly_message_limit) * 100),
    }))
    .sort((a: any, b: any) => b.pct - a.pct)

  // ── Section 7: Payment Analytics ──
  const examPayStats = {
    pending: examPayments.filter((p: any) => p.status === 'pending').length,
    approved: examPayments.filter((p: any) => p.status === 'approved').length,
    rejected: examPayments.filter((p: any) => p.status === 'rejected').length,
    total: examPayments.length,
  }
  const aiPayStats = {
    pending: aiPayments.filter((p: any) => p.status === 'pending').length,
    approved: aiPayments.filter((p: any) => p.status === 'approved').length,
    rejected: aiPayments.filter((p: any) => p.status === 'rejected').length,
    total: aiPayments.length,
  }
  const revenueEstimate = examPayments
    .filter((p: any) => p.status === 'approved')
    .reduce((sum: number, p: any) => sum + Number(examMap.get(p.exam_id)?.price_amount ?? 0), 0)
  const currency = exams.find((e: any) => e.price_currency)?.price_currency ?? 'PGK'

  // ── RENDER ──
  return (
    <div className="space-y-10">
      {/* Title */}
      <div>
        <h1 className={pageTitle}>Analytics</h1>
        <p className={`${muted} mt-1`}>Platform overview — data from existing records</p>
      </div>

      {/* ── 1: Overview Cards ── */}
      <section>
        <SectionHead title="Overview" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Users" value={fmt(totalUsers)} />
          <StatCard label="New Today" value={fmt(newUsersToday)} sub="users registered today" />
          <StatCard label="New This Week" value={fmt(newUsersWeek)} sub="last 7 days" />
          <StatCard label="Active Students" value={fmt(activeStudentsWeek)} sub="attempted this week" />
          <StatCard label="Total Attempts" value={fmt(totalAttempts)} />
          <StatCard label="Questions Answered" value={fmt(totalAnswers)} />
          <StatCard label="AI Messages" value={fmt(totalAiMessages)} />
          <StatCard
            label="Pending Payments"
            value={fmt(pendingPayments)}
            sub="exam + AI plan requests"
          />
        </div>
      </section>

      {/* ── 2: Recent Activity ── */}
      <section>
        <SectionHead
          title="Recent Activity"
          desc="Latest events across attempts, AI tutor, and payments"
        />
        {activityItems.length === 0 ? (
          <p className={muted}>No recent activity.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm min-w-[540px]">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">User</th>
                  <th className="text-left px-4 py-3 font-medium">Action</th>
                  <th className="text-left px-4 py-3 font-medium">Exam</th>
                  <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 bg-white dark:bg-gray-800">
                {activityItems.map((item) => (
                  <tr key={`${item.type}-${item.id}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 max-w-[170px] truncate">
                      {item.email}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={
                          item.type === 'Attempt'
                            ? badgeBlue
                            : item.type === 'AI Tutor'
                            ? badgeGreen
                            : badgeAmber
                        }
                      >
                        {item.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-[160px] truncate">
                      {item.examLabel}
                    </td>
                    <td className="px-4 py-3 text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      {fmtDateTime(item.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── 3: Exam Performance ── */}
      <section>
        <SectionHead title="Exam Performance" desc="Attempt statistics per exam" />
        {examStats.length === 0 ? (
          <p className={muted}>No exams found.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm min-w-[680px]">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Exam</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Access</th>
                  <th className="text-right px-4 py-3 font-medium">Attempts</th>
                  <th className="text-right px-4 py-3 font-medium">Students</th>
                  <th className="text-right px-4 py-3 font-medium">Completed</th>
                  <th className="text-right px-4 py-3 font-medium">Avg Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 bg-white dark:bg-gray-800">
                {examStats.map((e: any) => (
                  <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      {e.subject} — P{e.paper_number} ({e.year})
                    </td>
                    <td className="px-4 py-3">
                      <span className={e.status === 'published' ? badgeGreen : badgeGray}>{e.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={e.access_type === 'free' ? badgeBlue : badgeAmber}>{e.access_type}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">{fmt(e.attemptCount)}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">{fmt(e.uniqueStudents)}</td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{fmt(e.completed)}</td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">
                      {e.avgScore !== null
                        ? e.total_marks
                          ? `${e.avgScore.toFixed(1)} / ${e.total_marks}`
                          : e.avgScore.toFixed(1)
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── 4: Question Analytics ── */}
      <section>
        <SectionHead
          title="Question Analytics"
          desc={`${questionStats.length} most-attempted questions sorted by lowest correct rate · ${questionsWithVideo} question${questionsWithVideo !== 1 ? 's' : ''} have tutorial videos`}
        />
        {questionStats.length === 0 ? (
          <p className={muted}>No question attempts yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm min-w-[680px]">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Question</th>
                  <th className="text-left px-4 py-3 font-medium">Exam</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-right px-4 py-3 font-medium">Attempts</th>
                  <th className="text-right px-4 py-3 font-medium">Correct</th>
                  <th className="text-right px-4 py-3 font-medium">Incorrect</th>
                  <th className="text-right px-4 py-3 font-medium">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 bg-white dark:bg-gray-800">
                {questionStats.map((q: any) => (
                  <tr key={q.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                      {q.label}
                      {q.hasVideo && (
                        <span className="ml-1.5 text-xs text-blue-500 dark:text-blue-400">▶</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-[150px] truncate">
                      {q.examLabel}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          q.type === 'multiple_choice'
                            ? badgeBlue
                            : q.type === 'short_answer'
                            ? badgeGray
                            : badgeGray
                        }
                      >
                        {q.type === 'multiple_choice' ? 'MCQ' : q.type === 'short_answer' ? 'Short' : 'Long'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">{fmt(q.total)}</td>
                    <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">
                      {q.type === 'multiple_choice'
                        ? fmt(q.correct)
                        : q.scCorrect > 0
                        ? fmt(q.scCorrect)
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-red-500 dark:text-red-400">
                      {q.type === 'multiple_choice'
                        ? fmt(q.incorrect)
                        : q.scIncorrect > 0
                        ? fmt(q.scIncorrect)
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {q.correctRate !== null ? (
                        <span
                          className={
                            q.correctRate >= 70
                              ? 'text-green-600 dark:text-green-400 font-semibold'
                              : q.correctRate >= 40
                              ? 'text-amber-600 dark:text-amber-400 font-semibold'
                              : 'text-red-600 dark:text-red-400 font-semibold'
                          }
                        >
                          {q.correctRate.toFixed(0)}%
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── 5: Student Analytics ── */}
      <section>
        <SectionHead title="Student Analytics" desc={`${profiles.length} registered students`} />
        {studentStats.length === 0 ? (
          <p className={muted}>No students yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Student</th>
                  <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Joined</th>
                  <th className="text-right px-4 py-3 font-medium">Attempts</th>
                  <th className="text-right px-4 py-3 font-medium whitespace-nowrap">Q Answered</th>
                  <th className="text-right px-4 py-3 font-medium whitespace-nowrap">AI Msgs</th>
                  <th className="text-right px-4 py-3 font-medium whitespace-nowrap">Paid Papers</th>
                  <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 bg-white dark:bg-gray-800">
                {studentStats.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                    <td className="px-4 py-3 max-w-[190px]">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{s.email}</p>
                      {s.full_name && (
                        <p className={`${mutedXs} truncate`}>{s.full_name}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {fmtDate(s.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">{s.attemptCount}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">{s.answeredCount}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">{s.aiCount}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">{s.paidPapers}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {s.lastActivity ? fmtDate(s.lastActivity) : <span className={mutedXs}>No activity</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── 6: AI Tutor Analytics ── */}
      <section>
        <SectionHead title="AI Tutor Analytics" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <StatCard label="Total AI Messages" value={fmt(totalAiMessages)} />
          <StatCard label="AI Messages Today" value={fmt(aiToday)} />
          <StatCard label="AI Messages This Week" value={fmt(aiWeek)} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className={card}>
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className={sectionTitle}>Top AI Users</h3>
            </div>
            {topAiUsers.length === 0 ? (
              <p className={`${muted} px-5 py-4`}>No AI usage yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700/60">
                {topAiUsers.map((u: any) => (
                  <li key={u.userId} className="flex items-center justify-between px-5 py-3 text-sm gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{u.email}</p>
                      {u.name && <p className={mutedXs}>{u.name}</p>}
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-gray-100 shrink-0">{fmt(u.count)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={card}>
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className={sectionTitle}>Most AI-Asked Questions</h3>
            </div>
            {topAiQuestions.length === 0 ? (
              <p className={`${muted} px-5 py-4`}>No AI usage yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700/60">
                {topAiQuestions.map((q: any) => (
                  <li key={q.questionId} className="flex items-center justify-between px-5 py-3 text-sm gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{q.label}</p>
                      <p className={mutedXs}>{q.examLabel}</p>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-gray-100 shrink-0">{fmt(q.count)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {atLimitStudents.length > 0 && (
          <div className={`${card} mt-6`}>
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className={sectionTitle}>Students Near / Over AI Credit Limit</h3>
              <p className={`${mutedXs} mt-0.5`}>At or above 80% of their monthly limit</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[400px]">
                <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="text-left px-5 py-2.5 font-medium">Student</th>
                    <th className="text-right px-5 py-2.5 font-medium">Used</th>
                    <th className="text-right px-5 py-2.5 font-medium">Limit</th>
                    <th className="text-right px-5 py-2.5 font-medium">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                  {atLimitStudents.map((s: any) => (
                    <tr key={s.userId} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
                          {s.email}
                        </p>
                        {s.name && <p className={mutedXs}>{s.name}</p>}
                      </td>
                      <td className="px-5 py-3 text-right text-gray-900 dark:text-gray-100">{s.used}</td>
                      <td className="px-5 py-3 text-right text-gray-500 dark:text-gray-400">{s.limit}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={s.pct >= 100 ? badgeRed : badgeAmber}>{s.pct}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* ── 7: Payment Analytics ── */}
      <section>
        <SectionHead title="Payment Analytics" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className={cardPad}>
            <h3 className={`${sectionTitle} mb-3`}>Exam Payment Requests</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <dt className={muted}>Pending</dt>
                <dd><span className={badgeAmber}>{examPayStats.pending}</span></dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className={muted}>Approved</dt>
                <dd><span className={badgeGreen}>{examPayStats.approved}</span></dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className={muted}>Rejected</dt>
                <dd><span className={badgeRed}>{examPayStats.rejected}</span></dd>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
                <dt className="font-medium text-gray-700 dark:text-gray-300">Total</dt>
                <dd className="font-semibold text-gray-900 dark:text-white">{examPayStats.total}</dd>
              </div>
            </dl>
          </div>

          <div className={cardPad}>
            <h3 className={`${sectionTitle} mb-3`}>AI Plan Payment Requests</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <dt className={muted}>Pending</dt>
                <dd><span className={badgeAmber}>{aiPayStats.pending}</span></dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className={muted}>Approved</dt>
                <dd><span className={badgeGreen}>{aiPayStats.approved}</span></dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className={muted}>Rejected</dt>
                <dd><span className={badgeRed}>{aiPayStats.rejected}</span></dd>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
                <dt className="font-medium text-gray-700 dark:text-gray-300">Total</dt>
                <dd className="font-semibold text-gray-900 dark:text-white">{aiPayStats.total}</dd>
              </div>
            </dl>
          </div>
        </div>

        {revenueEstimate > 0 && (
          <div className={`${cardPad} mt-4`}>
            <p className={muted}>Estimated revenue from approved exam payments</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {currency}{' '}
              {revenueEstimate.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className={`${mutedXs} mt-1`}>
              Approved payments × exam price. Excludes AI plan payments.
            </p>
          </div>
        )}
      </section>

      {/* ── Video Analytics note ── */}
      <section>
        <div className="bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-4">
          <h3 className={`${sectionTitle} mb-1`}>Video Analytics</h3>
          <p className={muted}>
            {questionsWithVideo} question{questionsWithVideo !== 1 ? 's' : ''} have tutorial video
            links. Watch duration tracking is not yet implemented — no YouTube iframe events are
            captured. Future: video started, completed, and watch-time events via YouTube Player API.
          </p>
        </div>
      </section>
    </div>
  )
}
