import { createAdminClient } from '@/lib/supabase/admin'
import { approvePaymentRequest, rejectPaymentRequest } from '@/app/admin/actions'

export const dynamic = 'force-dynamic'

type Props = {
  searchParams: Promise<{ status?: string }>
}

export default async function PaymentsPage({ searchParams }: Props) {
  const { status: statusFilter } = await searchParams
  const admin = createAdminClient()

  let query = admin
    .from('payment_requests')
    .select('*, exams(subject, year, paper_number, paper_type)')
    .order('created_at', { ascending: false })

  if (statusFilter && ['pending', 'approved', 'rejected'].includes(statusFilter)) {
    query = query.eq('status', statusFilter) as typeof query
  }

  const { data: allRequests } = await query

  // Sort so pending appears first, then by created_at descending
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
    `text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
      statusFilter === tab
        ? 'bg-gray-900 text-white'
        : 'text-gray-600 hover:bg-gray-100'
    }`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Payment Requests</h1>
        {counts.pending > 0 && (
          <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
            {counts.pending} pending
          </span>
        )}
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2">
        <a href="/admin/payments" className={tabClass(undefined)}>
          All ({counts.all})
        </a>
        <a href="/admin/payments?status=pending" className={tabClass('pending')}>
          Pending ({counts.pending})
        </a>
        <a href="/admin/payments?status=approved" className={tabClass('approved')}>
          Approved ({counts.approved})
        </a>
        <a href="/admin/payments?status=rejected" className={tabClass('rejected')}>
          Rejected ({counts.rejected})
        </a>
      </div>

      {requests.length === 0 ? (
        <p className="text-sm text-gray-500">No payment requests found.</p>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const exam = (req as any).exams as {
              subject: string
              year: number
              paper_number: number
              paper_type: string
            } | null

            return (
              <div
                key={req.id}
                className="bg-white border border-gray-200 rounded-xl p-5 space-y-4"
              >
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      req.status === 'pending'
                        ? 'bg-amber-100 text-amber-700'
                        : req.status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(req.created_at).toLocaleDateString('en-AU', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Student</p>
                    <p className="font-medium text-gray-800">{req.user_email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Exam</p>
                    <p className="font-medium text-gray-800">
                      {exam
                        ? `${exam.subject} — Paper ${exam.paper_number} (${exam.year})`
                        : req.exam_id}
                    </p>
                  </div>
                  {req.payer_name && (
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Payer Name</p>
                      <p className="text-gray-700">{req.payer_name}</p>
                    </div>
                  )}
                  {req.payment_reference && (
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Reference</p>
                      <p className="text-gray-700">{req.payment_reference}</p>
                    </div>
                  )}
                </div>

                {req.note && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Note from student</p>
                    <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
                      {req.note}
                    </p>
                  </div>
                )}

                {/* Proof image */}
                <div>
                  <p className="text-xs text-gray-400 mb-2">Payment Proof</p>
                  <a
                    href={req.proof_image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={req.proof_image_url}
                      alt="Payment proof"
                      className="max-w-xs h-auto max-h-48 object-contain rounded-lg border border-gray-200"
                    />
                  </a>
                  <a
                    href={req.proof_image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                  >
                    View full size →
                  </a>
                </div>

                {/* Approve / Reject actions */}
                {req.status === 'pending' && (
                  <div className="flex gap-3 pt-3 border-t border-gray-100">
                    <form action={approvePaymentRequest}>
                      <input type="hidden" name="request_id" value={req.id} />
                      <input type="hidden" name="user_id" value={req.user_id} />
                      <input type="hidden" name="exam_id" value={req.exam_id} />
                      <button
                        type="submit"
                        className="bg-green-600 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Approve Access
                      </button>
                    </form>
                    <form action={rejectPaymentRequest} className="flex flex-1 gap-2 items-center">
                      <input type="hidden" name="request_id" value={req.id} />
                      <input
                        name="admin_note"
                        type="text"
                        placeholder="Rejection reason (optional)"
                        className="flex-1 border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400"
                      />
                      <button
                        type="submit"
                        className="bg-red-500 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-600 transition-colors whitespace-nowrap"
                      >
                        Reject
                      </button>
                    </form>
                  </div>
                )}

                {/* Admin note on rejected requests */}
                {req.status === 'rejected' && req.admin_note && (
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-0.5">Admin note</p>
                    <p className="text-sm text-gray-600">{req.admin_note}</p>
                  </div>
                )}

                {req.status !== 'pending' && req.reviewed_at && (
                  <p className="text-xs text-gray-400 pt-1 border-t border-gray-100">
                    Reviewed{' '}
                    {new Date(req.reviewed_at).toLocaleDateString('en-AU', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
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
