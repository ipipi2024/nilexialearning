'use client'

import { useState } from 'react'
import { PAYMENT_DETAILS } from '@/config/payment'

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="shrink-0 text-xs px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

function DetailRow({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div className="min-w-0">
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white break-all">{value}</p>
      </div>
      {copyable && <CopyButton value={value} />}
    </div>
  )
}

export function PaymentDetails() {
  const p = PAYMENT_DETAILS

  return (
    <div className="space-y-4 mb-6">
      {/* Bank details card */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-3">
          Transfer Payment To
        </p>

        <div>
          <DetailRow label="Bank" value={p.bankName} />
          <DetailRow label="Account Name" value={p.accountName} copyable />
          <DetailRow label="Account Number" value={p.accountNumber} copyable />
          <DetailRow label="Branch" value={`${p.branchName} (${p.branchNumber})`} copyable />
        </div>
      </div>

      {/* Steps card */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-3">
          After Payment
        </p>
        <ol className="space-y-2">
          {[
            'Complete the bank transfer',
            'Take a screenshot of the payment confirmation',
            'Upload the proof below',
            'Submit your request for review',
            'Wait for approval before starting the exam',
          ].map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-gray-700 dark:text-gray-300">
              <span className="shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* Student name tip */}
      <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
        <span className="font-semibold">Tip:</span> Use your student name when submitting proof so payments can be matched faster.
      </div>
    </div>
  )
}
