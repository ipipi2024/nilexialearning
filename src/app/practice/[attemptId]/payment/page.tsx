// NOTE: This page lives under [attemptId] for filesystem compatibility with the
// existing practice session route. When accessed as /practice/[examId]/payment,
// params.attemptId holds the exam UUID — not an attempt UUID.

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { submitPaymentRequest } from '@/app/practice/actions'

type Props = {
  params: Promise<{ attemptId: string }>
  searchParams: Promise<{ error?: string }>
}

export default async function PaymentPage({ params, searchParams }: Props) {
  const { attemptId: examId } = await params
  const { error } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch the exam — RLS ensures it's published.
  const { data: exam } = await supabase
    .from('exams')
    .select('id, subject, year, paper_number, paper_type, access_type, price_amount, price_currency')
    .eq('id', examId)
    .maybeSingle()

  if (!exam || exam.access_type !== 'paid') redirect('/practice')

  // If user already has access, send them straight to practice.
  const { data: existingAccess } = await supabase
    .from('user_exam_access')
    .select('id')
    .eq('exam_id', examId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingAccess) redirect('/practice')

  // Check for an existing pending request to decide whether to show the form.
  const { data: pendingRequest } = await supabase
    .from('payment_requests')
    .select('id, created_at')
    .eq('exam_id', examId)
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .maybeSingle()

  const inputClass =
    'w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-lg mx-auto">
        <a href="/practice" className="text-sm text-gray-500 hover:text-gray-700">
          ← Exam Papers
        </a>

        <h1 className="text-xl font-bold text-gray-900 mt-3 mb-1">Request Access</h1>
        <p className="text-sm text-gray-500 mb-6">
          {exam.subject} — Paper {exam.paper_number} ({exam.year})
        </p>

        {/* Price display */}
        {exam.price_amount != null && (
          <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 mb-6">
            <p className="text-xs text-gray-400 mb-1">Exam Fee</p>
            <p className="text-2xl font-bold text-gray-900">
              {exam.price_currency} {Number(exam.price_amount).toFixed(2)}
            </p>
          </div>
        )}

        {/* Pending notice — shown instead of the form */}
        {pendingRequest ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-5 space-y-2">
            <p className="text-sm font-semibold text-amber-800">Payment Under Review</p>
            <p className="text-sm text-amber-700">
              Your payment proof has been submitted and is awaiting admin approval.
              You will be able to start the exam once it is approved.
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Submitted{' '}
              {new Date(pendingRequest.created_at).toLocaleDateString('en-AU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        ) : (
          <>
            {/* Duplicate submission error */}
            {error === 'duplicate' && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-5 py-3 text-sm text-red-700">
                A pending request already exists for this exam. Please wait for admin review.
              </div>
            )}

            {/* Payment instructions */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 mb-6 space-y-1">
              <p className="text-sm font-semibold text-blue-800">Payment Instructions</p>
              <p className="text-sm text-blue-700">
                Transfer the exam fee to the bank account provided by your school or exam
                coordinator. Then take a clear photo or screenshot of your receipt and upload it
                below.
              </p>
            </div>

            {/* Upload form */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <form
                action={submitPaymentRequest}
                className="space-y-4"
                encType="multipart/form-data"
              >
                <input type="hidden" name="exam_id" value={examId} />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="payer_name">
                    Your Name{' '}
                    <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <input
                    id="payer_name"
                    name="payer_name"
                    type="text"
                    placeholder="Full name on receipt"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                    htmlFor="payment_reference"
                  >
                    Payment Reference{' '}
                    <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <input
                    id="payment_reference"
                    name="payment_reference"
                    type="text"
                    placeholder="Transaction ID or reference number"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                    htmlFor="proof_image"
                  >
                    Payment Proof <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="proof_image"
                    name="proof_image"
                    type="file"
                    accept="image/*,.pdf"
                    required
                    className="w-full text-sm text-gray-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-gray-300 file:text-sm file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-50"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Receipt photo or screenshot. Max 10 MB.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="note">
                    Note{' '}
                    <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <textarea
                    id="note"
                    name="note"
                    rows={2}
                    placeholder="Any additional information for the admin…"
                    className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Submit Payment Proof
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
