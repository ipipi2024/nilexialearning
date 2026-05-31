'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  sendAdminAiPaymentNotification,
  sendStudentAiPaymentReceived,
} from '@/lib/email'

const MAX_PROOF_SIZE = 10 * 1024 * 1024 // 10 MB

export async function submitAiPaymentRequest(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const planId = (formData.get('plan_id') as string | null)?.trim()
  const payerName = (formData.get('payer_name') as string | null)?.trim() || null
  const paymentReference = (formData.get('payment_reference') as string | null)?.trim() || null
  const note = (formData.get('note') as string | null)?.trim() || null
  const proofFile = formData.get('proof_image') as File | null

  if (!planId) redirect('/ai/upgrade?error=invalid')
  if (!proofFile || proofFile.size === 0) redirect('/ai/upgrade?error=no_proof')
  if (proofFile.size > MAX_PROOF_SIZE) redirect('/ai/upgrade?error=too_large')

  const admin = createAdminClient()

  // Verify plan exists
  const { data: plan } = await admin
    .from('ai_credit_plans')
    .select('id, name, price_amount, price_currency, monthly_message_limit')
    .eq('id', planId)
    .eq('is_active', true)
    .maybeSingle()

  if (!plan) redirect('/ai/upgrade?error=invalid')

  // Upload proof to payment-proofs bucket under ai-tutor/ prefix
  const safeName = proofFile.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100)
  const filePath = `ai-tutor/${user.id}/${Date.now()}-${safeName}`
  const buffer = Buffer.from(await proofFile.arrayBuffer())

  const { error: uploadError } = await admin.storage
    .from('payment-proofs')
    .upload(filePath, buffer, { contentType: proofFile.type })

  if (uploadError) redirect('/ai/upgrade?error=upload_failed')

  const { data: { publicUrl } } = admin.storage.from('payment-proofs').getPublicUrl(filePath)

  // Insert — partial unique index prevents duplicates
  const { error: insertError } = await admin.from('ai_payment_requests').insert({
    user_id: user.id,
    user_email: user.email ?? user.id,
    plan_id: planId,
    proof_image_url: publicUrl,
    payer_name: payerName,
    payment_reference: paymentReference,
    note,
  })

  if (insertError) {
    // Duplicate pending request (partial unique index violation)
    if (insertError.code === '23505') redirect('/ai/upgrade?error=duplicate')
    redirect('/ai/upgrade?error=failed')
  }

  // Best-effort emails — never block the submission flow
  await Promise.allSettled([
    sendAdminAiPaymentNotification({
      studentEmail: user.email ?? user.id,
      planName: plan.name,
      planPrice: plan.price_amount,
      currency: plan.price_currency,
      payerName,
      paymentReference,
      note,
    }),
    sendStudentAiPaymentReceived({
      studentEmail: user.email ?? user.id,
      planName: plan.name,
    }),
  ])

  redirect('/ai/upgrade?submitted=1')
}
