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
