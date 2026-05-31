import { Resend } from 'resend'

const APP_URL = process.env.APP_URL ?? ''

function client(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

interface SendEmailParams {
  to: string
  subject: string
  html: string
  text: string
}

async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<void> {
  const resend = client()
  const from = process.env.EMAIL_FROM

  if (!resend || !from) {
    console.warn('[email] RESEND_API_KEY or EMAIL_FROM not set — skipping email to', to)
    return
  }

  try {
    await resend.emails.send({ from, to, subject, html, text })
  } catch (err) {
    console.error('[email] Failed to send to', to, ':', err)
  }
}

function fmt(exam: { subject: string; year: number; paper_number: number }) {
  return `${exam.subject} — Paper ${exam.paper_number} (${exam.year})`
}

// ── Email 1: Admin notification when student submits payment proof ────────────

export async function sendAdminPaymentNotification({
  studentEmail,
  studentName,
  exam,
  payerName,
  paymentReference,
  note,
}: {
  studentEmail: string
  studentName: string | null
  exam: { subject: string; year: number; paper_number: number }
  payerName: string | null
  paymentReference: string | null
  note: string | null
}) {
  const adminEmail = process.env.ADMIN_PAYMENT_EMAIL
  if (!adminEmail) {
    console.warn('[email] ADMIN_PAYMENT_EMAIL not set — skipping admin notification')
    return
  }

  const examTitle = fmt(exam)
  const dashboardUrl = APP_URL ? `${APP_URL}/admin/payments` : null
  const submittedAt = new Date().toLocaleString('en-AU', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  const rows = [
    ['Student', `${studentEmail}${studentName ? ` (${studentName})` : ''}`],
    ['Exam', examTitle],
    ...(payerName ? [['Payer Name', payerName]] : []),
    ...(paymentReference ? [['Reference', paymentReference]] : []),
    ...(note ? [['Note', note]] : []),
    ['Submitted', submittedAt],
  ]

  const tableRows = rows
    .map(([label, value]) => `<tr><td style="padding:8px 0;color:#666;width:140px;vertical-align:top;">${label}</td><td style="padding:8px 0;">${value}</td></tr>`)
    .join('')

  const html = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111;padding:24px;">
  <h2 style="font-size:18px;margin:0 0 20px;">New Payment Proof Submitted</h2>
  <table style="width:100%;border-collapse:collapse;font-size:14px;">${tableRows}</table>
  <p style="font-size:14px;color:#555;margin-top:20px;">
    The payment proof image can be reviewed in the admin dashboard.
  </p>
  ${dashboardUrl ? `<p style="font-size:14px;"><a href="${dashboardUrl}">View admin payments →</a></p>` : ''}
</div>`

  const textLines = rows.map(([l, v]) => `${l}: ${v}`).join('\n')
  const text = `New Payment Proof Submitted\n\n${textLines}\n\nReview at: ${dashboardUrl ?? 'admin dashboard'}`

  await sendEmail({ to: adminEmail, subject: 'New payment proof submitted — CQORIA', html, text })
}

// ── Email 2: Student confirmation after submitting proof ─────────────────────

export async function sendStudentPaymentReceived({
  studentEmail,
  exam,
}: {
  studentEmail: string
  exam: { subject: string; year: number; paper_number: number }
}) {
  const examTitle = fmt(exam)

  const html = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111;padding:24px;">
  <h2 style="font-size:18px;margin:0 0 12px;">Payment Proof Received</h2>
  <p style="font-size:14px;color:#555;margin:0 0 16px;">Thank you for submitting your payment proof.</p>
  <p style="font-size:14px;margin:0 0 6px;"><strong>Exam:</strong> ${examTitle}</p>
  <p style="font-size:14px;margin:0 0 16px;"><strong>Status:</strong> Pending review</p>
  <p style="font-size:14px;color:#555;">
    You will receive another email once your payment has been approved or rejected.
  </p>
</div>`

  const text = `Payment Proof Received\n\nExam: ${examTitle}\nStatus: Pending review\n\nYou will be notified by email once your payment is reviewed.`

  await sendEmail({ to: studentEmail, subject: 'Payment proof received — CQORIA', html, text })
}

// ── Email 3: Student notified of approval ────────────────────────────────────

export async function sendStudentPaymentApproved({
  studentEmail,
  exam,
}: {
  studentEmail: string
  exam: { subject: string; year: number; paper_number: number }
}) {
  const examTitle = fmt(exam)
  const practiceUrl = APP_URL ? `${APP_URL}/practice` : null

  const html = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111;padding:24px;">
  <h2 style="font-size:18px;margin:0 0 12px;color:#16a34a;">Access Approved</h2>
  <p style="font-size:14px;margin:0 0 8px;">Your payment has been approved. You now have access to:</p>
  <p style="font-size:14px;font-weight:bold;margin:0 0 16px;">${examTitle}</p>
  <p style="font-size:14px;color:#555;margin:0 0 12px;">Log in to CQORIA to start practising.</p>
  ${practiceUrl ? `<p style="font-size:14px;"><a href="${practiceUrl}">Go to practice papers →</a></p>` : ''}
</div>`

  const text = `Access Approved\n\nYour payment for ${examTitle} has been approved.\n\nLog in to CQORIA to start practising.${practiceUrl ? `\n${practiceUrl}` : ''}`

  await sendEmail({ to: studentEmail, subject: 'Access approved — CQORIA', html, text })
}

// ── AI Tutor email helpers ────────────────────────────────────────────────────

export async function sendAdminAiPaymentNotification({
  studentEmail,
  planName,
  planPrice,
  currency,
  payerName,
  paymentReference,
  note,
}: {
  studentEmail: string
  planName: string
  planPrice: number
  currency: string
  payerName: string | null
  paymentReference: string | null
  note: string | null
}) {
  const adminEmail = process.env.ADMIN_PAYMENT_EMAIL
  if (!adminEmail) return

  const dashboardUrl = APP_URL ? `${APP_URL}/admin/ai-payments` : null
  const rows = [
    ['Student', studentEmail],
    ['Plan', `${planName} — ${currency} ${Number(planPrice).toFixed(2)}/month`],
    ...(payerName ? [['Payer Name', payerName]] : []),
    ...(paymentReference ? [['Reference', paymentReference]] : []),
    ...(note ? [['Note', note]] : []),
  ]
  const tableRows = rows
    .map(([l, v]) => `<tr><td style="padding:8px 0;color:#666;width:140px;vertical-align:top;">${l}</td><td style="padding:8px 0;">${v}</td></tr>`)
    .join('')

  const html = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111;padding:24px;">
  <h2 style="font-size:18px;margin:0 0 20px;">New AI Plan Payment Submitted</h2>
  <table style="width:100%;border-collapse:collapse;font-size:14px;">${tableRows}</table>
  ${dashboardUrl ? `<p style="font-size:14px;margin-top:20px;"><a href="${dashboardUrl}">Review in admin →</a></p>` : ''}
</div>`
  const text = `New AI Plan Payment\n\n${rows.map(([l, v]) => `${l}: ${v}`).join('\n')}`
  await sendEmail({ to: adminEmail, subject: 'New AI plan payment submitted — CQORIA', html, text })
}

export async function sendStudentAiPaymentReceived({
  studentEmail,
  planName,
}: {
  studentEmail: string
  planName: string
}) {
  const html = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111;padding:24px;">
  <h2 style="font-size:18px;margin:0 0 12px;">AI Plan Payment Received</h2>
  <p style="font-size:14px;color:#555;margin:0 0 16px;">Thank you for submitting your payment proof.</p>
  <p style="font-size:14px;margin:0 0 6px;"><strong>Plan:</strong> ${planName}</p>
  <p style="font-size:14px;color:#555;">You will receive another email once your payment is reviewed.</p>
</div>`
  const text = `AI Plan Payment Received\n\nPlan: ${planName}\nStatus: Pending review\n\nYou will be notified once reviewed.`
  await sendEmail({ to: studentEmail, subject: 'AI plan payment received — CQORIA', html, text })
}

export async function sendStudentAiPlanApproved({
  studentEmail,
  planName,
  messagesTotal,
  expiresAt,
}: {
  studentEmail: string
  planName: string
  messagesTotal: number
  expiresAt: string
}) {
  const upgradeUrl = APP_URL ? `${APP_URL}/ai/upgrade` : null
  const expiry = new Date(expiresAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
  const html = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111;padding:24px;">
  <h2 style="font-size:18px;margin:0 0 12px;color:#16a34a;">AI Tutor Plan Activated</h2>
  <p style="font-size:14px;margin:0 0 8px;">Your payment has been approved. Your AI Tutor plan is now active:</p>
  <p style="font-size:14px;font-weight:bold;margin:0 0 6px;">${planName} — ${messagesTotal} AI messages</p>
  <p style="font-size:14px;color:#555;margin:0 0 16px;">Valid until ${expiry}.</p>
  ${upgradeUrl ? `<p style="font-size:14px;"><a href="${upgradeUrl}">View your plan →</a></p>` : ''}
</div>`
  const text = `AI Tutor Plan Activated\n\n${planName} — ${messagesTotal} messages\nValid until ${expiry}`
  await sendEmail({ to: studentEmail, subject: 'AI Tutor plan activated — CQORIA', html, text })
}

export async function sendStudentAiPlanRejected({
  studentEmail,
  planName,
  adminNote,
}: {
  studentEmail: string
  planName: string
  adminNote: string | null
}) {
  const html = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111;padding:24px;">
  <h2 style="font-size:18px;margin:0 0 12px;color:#dc2626;">AI Plan Payment Rejected</h2>
  <p style="font-size:14px;margin:0 0 8px;">Unfortunately your payment for <strong>${planName}</strong> could not be approved.</p>
  ${adminNote ? `<p style="font-size:14px;margin:0 0 16px;"><strong>Reason:</strong> ${adminNote}</p>` : ''}
  <p style="font-size:14px;color:#555;">Please resubmit your payment proof or contact support.</p>
</div>`
  const text = `AI Plan Payment Rejected\n\nPlan: ${planName}${adminNote ? `\nReason: ${adminNote}` : ''}\n\nPlease resubmit or contact support.`
  await sendEmail({ to: studentEmail, subject: 'AI plan payment rejected — CQORIA', html, text })
}

// ── Email 4: Student notified of rejection ────────────────────────────────────

export async function sendStudentPaymentRejected({
  studentEmail,
  exam,
  adminNote,
}: {
  studentEmail: string
  exam: { subject: string; year: number; paper_number: number }
  adminNote: string | null
}) {
  const examTitle = fmt(exam)

  const html = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111;padding:24px;">
  <h2 style="font-size:18px;margin:0 0 12px;color:#dc2626;">Payment Request Rejected</h2>
  <p style="font-size:14px;margin:0 0 8px;">Unfortunately, your payment proof could not be approved for:</p>
  <p style="font-size:14px;font-weight:bold;margin:0 0 16px;">${examTitle}</p>
  ${adminNote ? `<p style="font-size:14px;margin:0 0 16px;"><strong>Reason:</strong> ${adminNote}</p>` : ''}
  <p style="font-size:14px;color:#555;">
    Please double-check your payment details and submit a new proof,
    or contact support if you believe this is an error.
  </p>
</div>`

  const text = `Payment Request Rejected\n\nYour payment proof for ${examTitle} could not be approved.${adminNote ? `\n\nReason: ${adminNote}` : ''}\n\nPlease resubmit your payment proof or contact support.`

  await sendEmail({ to: studentEmail, subject: 'Payment request rejected — CQORIA', html, text })
}
