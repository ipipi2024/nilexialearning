-- 009: Manual exam access control
-- Adds free/paid access type to exams, payment proof submissions, and access grants.
-- Run in Supabase SQL Editor. Safe to re-run (uses IF NOT EXISTS / ON CONFLICT DO NOTHING).

-- ── exams: add access control columns ─────────────────────────────────────────
ALTER TABLE exams
  ADD COLUMN IF NOT EXISTS access_type    text    NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS price_amount   numeric,
  ADD COLUMN IF NOT EXISTS price_currency text    NOT NULL DEFAULT 'PGK';

ALTER TABLE exams
  DROP CONSTRAINT IF EXISTS exams_access_type_check;
ALTER TABLE exams
  ADD CONSTRAINT exams_access_type_check
  CHECK (access_type IN ('free', 'paid'));

-- ── payment_requests ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_requests (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        NOT NULL REFERENCES auth.users(id)   ON DELETE CASCADE,
  exam_id           uuid        NOT NULL REFERENCES exams(id)        ON DELETE CASCADE,
  user_email        text        NOT NULL,
  payer_name        text,
  payment_reference text,
  proof_image_url   text        NOT NULL,
  note              text,
  admin_note        text,
  status            text        NOT NULL DEFAULT 'pending',
  created_at        timestamptz DEFAULT now() NOT NULL,
  reviewed_at       timestamptz,
  reviewed_by       uuid        REFERENCES auth.users(id),
  CONSTRAINT payment_requests_status_check
    CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Partial unique index: prevents duplicate pending requests for the same user+exam.
-- Rejected requests do not block resubmission.
CREATE UNIQUE INDEX IF NOT EXISTS payment_requests_pending_unique
  ON payment_requests (user_id, exam_id)
  WHERE (status = 'pending');

CREATE INDEX IF NOT EXISTS idx_payment_requests_user_id ON payment_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_exam_id ON payment_requests (exam_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status  ON payment_requests (status);

-- ── user_exam_access ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_exam_access (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id    uuid        NOT NULL REFERENCES exams(id)      ON DELETE CASCADE,
  granted_at timestamptz DEFAULT now() NOT NULL,
  granted_by uuid        REFERENCES auth.users(id),
  source     text        NOT NULL DEFAULT 'manual_payment',
  UNIQUE(user_id, exam_id)
);

CREATE INDEX IF NOT EXISTS idx_user_exam_access_user_id ON user_exam_access (user_id);
CREATE INDEX IF NOT EXISTS idx_user_exam_access_exam_id ON user_exam_access (exam_id);

-- ── RLS: payment_requests ─────────────────────────────────────────────────────
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_requests: user can select own" ON payment_requests;
CREATE POLICY "payment_requests: user can select own"
  ON payment_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "payment_requests: user can insert own" ON payment_requests;
CREATE POLICY "payment_requests: user can insert own"
  ON payment_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ── RLS: user_exam_access ─────────────────────────────────────────────────────
ALTER TABLE user_exam_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_exam_access: user can select own" ON user_exam_access;
CREATE POLICY "user_exam_access: user can select own"
  ON user_exam_access FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ── Storage: payment-proofs bucket ────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
  VALUES ('payment-proofs', 'payment-proofs', true)
  ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "payment-proofs: public read" ON storage.objects;
CREATE POLICY "payment-proofs: public read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'payment-proofs');
