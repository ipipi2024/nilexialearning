import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PaymentDetails } from '@/components/PaymentDetails'
import { SubmitButton } from '@/components/SubmitButton'
import { submitAiPaymentRequest } from '@/app/ai/actions'
import type { AiCreditPlan } from '@/types/database'

export const dynamic = 'force-dynamic'

const ERROR_MESSAGES: Record<string, string> = {
  invalid: 'Invalid plan selected. Please try again.',
  no_proof: 'Please upload a payment proof image.',
  too_large: 'File is too large. Maximum size is 10 MB.',
  upload_failed: 'Failed to upload the file. Please try again.',
  duplicate: 'You already have a pending AI plan request under review.',
  failed: 'Something went wrong. Please try again.',
}

const inputClass =
  'w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'

type Props = {
  searchParams: Promise<{ error?: string; submitted?: string }>
}

export default async function AiUpgradePage({ searchParams }: Props) {
  const { error, submitted } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  // Load data in parallel
  const [
    { data: credits },
    { data: plans },
    { data: pendingRequest },
  ] = await Promise.all([
    admin
      .from('ai_user_credits')
      .select('messages_used, monthly_message_limit, expires_at, plan_id, ai_credit_plans(name)')
      .eq('user_id', user.id)
      .maybeSingle(),
    admin
      .from('ai_credit_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_amount'),
    admin
      .from('ai_payment_requests')
      .select('id, plan_id, created_at, ai_credit_plans(name)')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle(),
  ])

  const messagesUsed = credits?.messages_used ?? 0
  const monthlyLimit = credits?.monthly_message_limit ?? 50
  const remaining = Math.max(0, monthlyLimit - messagesUsed)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentPlanName = (credits?.ai_credit_plans as any)?.name ?? 'Free'
  const expiresAt = credits?.expires_at
    ? new Date(credits.expires_at).toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  const paidPlans = (plans ?? []).filter((p: AiCreditPlan) => p.price_amount > 0)

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-10">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Back link */}
        <a
          href="/practice"
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          ← Back to Practice
        </a>

        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">AI Tutor Credits</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Upgrade your monthly AI message limit.
          </p>
        </div>

        {/* Error banner */}
        {error && ERROR_MESSAGES[error] && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {ERROR_MESSAGES[error]}
          </div>
        )}

        {/* Success banner */}
        {submitted === '1' && (
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl px-5 py-5 space-y-2">
            <p className="text-sm font-semibold text-green-800 dark:text-green-400">
              Payment proof submitted successfully.
            </p>
            <p className="text-sm text-green-700 dark:text-green-500">
              Your request is pending review.
            </p>
            <p className="text-sm text-green-700 dark:text-green-500">
              Please check your email — you will receive a notification once your payment is approved or rejected.
            </p>
            <p className="text-sm text-green-700 dark:text-green-500">
              Once approved, your AI Tutor credits will be activated automatically.
            </p>
          </div>
        )}

        {/* Current plan card */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Current Plan
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{currentPlanName}</p>
              {expiresAt && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Expires {expiresAt}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{remaining}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">of {monthlyLimit} remaining</p>
            </div>
          </div>
          {/* Usage bar */}
          <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                remaining === 0
                  ? 'bg-red-500'
                  : remaining < monthlyLimit * 0.2
                  ? 'bg-amber-400'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(100, (messagesUsed / monthlyLimit) * 100)}%` }}
            />
          </div>
        </div>

        {/* Pending notice */}
        {pendingRequest && (
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl px-5 py-4 space-y-1">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">
              Payment request under review
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-500">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              Your request for <strong>{(pendingRequest.ai_credit_plans as any)?.name ?? 'a plan'}</strong> is being reviewed.
              You will be notified by email once approved.
            </p>
          </div>
        )}

        {/* Plan options */}
        {!pendingRequest && submitted !== '1' && (
          <>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                Choose a Plan
              </h2>
              <div className="space-y-3">
                {paidPlans.map((plan: AiCreditPlan) => (
                  <div
                    key={plan.id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{plan.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          {plan.monthly_message_limit} AI messages · 30 days
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {plan.price_currency} {Number(plan.price_amount).toFixed(0)}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">per month</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <PaymentDetails />

            {/* Payment proof form */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Submit Payment Proof
              </h2>
              <form action={submitAiPaymentRequest} className="space-y-4" encType="multipart/form-data">
                {/* Plan selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Plan <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="plan_id"
                    required
                    className={inputClass}
                    defaultValue=""
                  >
                    <option value="" disabled>Select a plan…</option>
                    {paidPlans.map((plan: AiCreditPlan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} — {plan.price_currency} {Number(plan.price_amount).toFixed(0)}/month ({plan.monthly_message_limit} messages)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="ai_payer_name">
                    Your Name{' '}
                    <span className="font-normal text-gray-400 dark:text-gray-500">(optional)</span>
                  </label>
                  <input
                    id="ai_payer_name"
                    name="payer_name"
                    type="text"
                    placeholder="Full name on receipt"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="ai_payment_reference">
                    Payment Reference{' '}
                    <span className="font-normal text-gray-400 dark:text-gray-500">(optional)</span>
                  </label>
                  <input
                    id="ai_payment_reference"
                    name="payment_reference"
                    type="text"
                    placeholder="Transaction ID or reference number"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="ai_proof_image">
                    Payment Proof <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="ai_proof_image"
                    name="proof_image"
                    type="file"
                    accept="image/*,.pdf"
                    required
                    className="w-full text-sm text-gray-700 dark:text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-gray-300 dark:file:border-gray-600 file:text-sm file:font-medium file:bg-white dark:file:bg-gray-700 file:text-gray-700 dark:file:text-gray-300 hover:file:bg-gray-50 dark:hover:file:bg-gray-600"
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Receipt photo or screenshot. Max 10 MB.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="ai_note">
                    Note{' '}
                    <span className="font-normal text-gray-400 dark:text-gray-500">(optional)</span>
                  </label>
                  <textarea
                    id="ai_note"
                    name="note"
                    rows={2}
                    placeholder="Any additional information…"
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <SubmitButton
                  pendingText="Uploading proof…"
                  className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Submit Payment Proof
                </SubmitButton>
              </form>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
