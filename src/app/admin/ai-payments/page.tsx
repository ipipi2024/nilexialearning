import { createAdminClient } from '@/lib/supabase/admin'
import { approveAiPaymentRequest, rejectAiPaymentRequest } from '@/app/admin/actions'
import { SubmitButton } from '@/components/SubmitButton'

export const dynamic = 'force-dynamic'

type Props = {
  searchParams: Promise<{ status?: string }>
}

export default async function AiPaymentsPage({ searchParams }: Props) {
  const { status: statusFilter } = await searchParams
  const admin = createAdminClient()

  let query = admin
    .from('ai_payment_requests')
    .select('*, ai_credit_plans(name, price_amount, price_currency, monthly_message_limit)')
    .order('created_at', { ascending: false })

  if (statusFilter && ['pending', 'approved', 'rejected'].includes(statusFilter)) {
    query = query.eq('status', statusFilter) as typeof query
  }

  const { data: allRequests } = await query

  // Pending first, then rest
  const requests = [
    ...(allRequests?.filter((r) => r.status === 'pending') ?? []),
    ...(allRequests?.filter((r) => r.status !== 'pending') ?? []),
  ]

  const counts = {
    all: allRequests?.length ?? 0,
    pending: allRequests?.filter((r) => r.status === 'pending').length ?? 0,
    approved: allRequests?.filter((r) => r.status === 'approved').length ?? 0,
    rejected: allRequests?.filter((r) => r.status === 'rejected').length ?? 0,
  }

  const tabClass = (tab: string | undefined) =>
    `text-sm font-medium px-3 py-1.5 rounded-xl transition-colors ${
      statusFilter === tab
        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">AI Plan Payments</h1>
        {counts.pending > 0 && (
          <span className="text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full">
            {counts.pending} pending
          </span>
        )}
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        <a href="/admin/ai-payments" className={tabClass(undefined)}>All ({counts.all})</a>
        <a href="/admin/ai-payments?status=pending" className={tabClass('pending')}>Pending ({counts.pending})</a>
        <a href="/admin/ai-payments?status=approved" className={tabClass('approved')}>Approved ({counts.approved})</a>
        <a href="/admin/ai-payments?status=rejected" className={tabClass('rejected')}>Rejected ({counts.rejected})</a>
      </div>

      {requests.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No AI plan payment requests found.</p>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const plan = (req as any).ai_credit_plans as {
              name: string
              price_amount: number
              price_currency: string
              monthly_message_limit: number
            } | null

            return (
              <div
                key={req.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4 overflow-hidden min-w-0"
              >
                {/* Status + date */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      req.status === 'pending'
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                        : req.status === 'approved'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}
                  >
                    {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(req.created_at).toLocaleDateString('en-AU', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </span>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Student</p>
                    <p className="font-medium text-gray-800 dark:text-gray-200 break-words">{req.user_email}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Plan</p>
                    <p className="font-medium text-gray-800 dark:text-gray-200 break-words">
                      {plan
                        ? `${plan.name} — ${plan.price_currency} ${Number(plan.price_amount).toFixed(0)}/mo (${plan.monthly_message_limit} msgs)`
                        : req.plan_id}
                    </p>
                  </div>
                  {req.payer_name && (
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Payer Name</p>
                      <p className="text-gray-700 dark:text-gray-300 break-words">{req.payer_name}</p>
                    </div>
                  )}
                  {req.payment_reference && (
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Reference</p>
                      <p className="text-gray-700 dark:text-gray-300 break-words">{req.payment_reference}</p>
                    </div>
                  )}
                </div>

                {req.note && (
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Note from student</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                      {req.note}
                    </p>
                  </div>
                )}

                {/* Proof image */}
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Payment Proof</p>
                  <a href={req.proof_image_url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={req.proof_image_url}
                      alt="Payment proof"
                      className="max-w-full h-auto max-h-48 object-contain rounded-xl border border-gray-200 dark:border-gray-700"
                    />
                  </a>
                  <a
                    href={req.proof_image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block"
                  >
                    View full size →
                  </a>
                </div>

                {/* Actions */}
                {req.status === 'pending' && (
                  <div className="flex flex-col gap-3 pt-3 border-t border-gray-100 dark:border-gray-700 sm:flex-row">
                    <form action={approveAiPaymentRequest}>
                      <input type="hidden" name="request_id" value={req.id} />
                      <SubmitButton
                        pendingText="Activating…"
                        className="w-full sm:w-auto bg-green-600 text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-green-700 transition-colors"
                      >
                        Approve &amp; Activate
                      </SubmitButton>
                    </form>
                    <form action={rejectAiPaymentRequest} className="flex flex-col gap-2 sm:flex-row sm:flex-1 sm:items-center">
                      <input type="hidden" name="request_id" value={req.id} />
                      <input
                        name="admin_note"
                        type="text"
                        placeholder="Rejection reason (optional)"
                        className="min-w-0 w-full sm:flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-400"
                      />
                      <SubmitButton
                        pendingText="Rejecting…"
                        className="w-full sm:w-auto bg-red-500 dark:bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-red-600 dark:hover:bg-red-700 transition-colors"
                      >
                        Reject
                      </SubmitButton>
                    </form>
                  </div>
                )}

                {req.status === 'rejected' && req.admin_note && (
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Admin note</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{req.admin_note}</p>
                  </div>
                )}

                {req.status !== 'pending' && req.reviewed_at && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 pt-1 border-t border-gray-100 dark:border-gray-700">
                    Reviewed{' '}
                    {new Date(req.reviewed_at).toLocaleDateString('en-AU', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
