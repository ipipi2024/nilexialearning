-- AI Tutor Credit System
-- Implements monthly message credits, plan management, and manual payment requests.

-- =============================================================
-- TABLES
-- =============================================================

-- Plans catalog (admin-managed, read-only for students)
create table public.ai_credit_plans (
  id                    uuid        primary key default gen_random_uuid(),
  name                  text        not null,
  price_amount          numeric     not null,
  price_currency        text        not null default 'PGK',
  monthly_message_limit integer     not null,
  is_active             boolean     not null default true,
  created_at            timestamptz not null default now()
);

-- One row per user — their current plan and usage for the active period
create table public.ai_user_credits (
  user_id               uuid        primary key references auth.users(id) on delete cascade,
  plan_id               uuid        references public.ai_credit_plans(id),
  monthly_message_limit integer     not null default 50,
  messages_used         integer     not null default 0,
  starts_at             timestamptz not null default now(),
  expires_at            timestamptz,          -- null = free plan (renews each calendar month)
  updated_at            timestamptz not null default now()
);

-- AI plan payment requests (mirrors exam payment_requests structure)
create table public.ai_payment_requests (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references auth.users(id) on delete cascade,
  user_email        text        not null,
  plan_id           uuid        not null references public.ai_credit_plans(id),
  proof_image_url   text        not null,
  payer_name        text,
  payment_reference text,
  note              text,
  admin_note        text,
  status            text        not null default 'pending'
                                check (status in ('pending', 'approved', 'rejected')),
  created_at        timestamptz not null default now(),
  reviewed_at       timestamptz,
  reviewed_by       uuid        references auth.users(id)
);


-- =============================================================
-- SEED PLANS
-- =============================================================

insert into public.ai_credit_plans (name, price_amount, price_currency, monthly_message_limit) values
  ('Free',       0,  'PGK',  50),
  ('AI Starter', 20, 'PGK',  300),
  ('AI Plus',    50, 'PGK',  1000);


-- =============================================================
-- INDEXES
-- =============================================================

create index on public.ai_user_credits  (plan_id);
create index on public.ai_payment_requests (user_id);
create index on public.ai_payment_requests (plan_id);
create index on public.ai_payment_requests (status);

-- Only one pending AI payment request per user at a time
create unique index ai_payment_requests_pending_unique
  on public.ai_payment_requests (user_id)
  where (status = 'pending');


-- =============================================================
-- ATOMIC INCREMENT FUNCTION
-- Increments messages_used by 1. Called server-side after each
-- successful AI response to avoid read-then-write races.
-- =============================================================

create or replace function public.increment_ai_messages_used(p_user_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.ai_user_credits
  set messages_used = messages_used + 1,
      updated_at    = now()
  where user_id = p_user_id;
$$;

grant execute on function public.increment_ai_messages_used(uuid) to authenticated;


-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

alter table public.ai_credit_plans    enable row level security;
alter table public.ai_user_credits    enable row level security;
alter table public.ai_payment_requests enable row level security;

-- Plans: any authenticated user can read active plans
create policy "ai_credit_plans: authenticated read active"
  on public.ai_credit_plans for select
  using (auth.role() = 'authenticated' and is_active = true);

-- User credits: users read only their own row
create policy "ai_user_credits: select own"
  on public.ai_user_credits for select
  using (auth.uid() = user_id);

-- AI payment requests: users read and insert their own
create policy "ai_payment_requests: select own"
  on public.ai_payment_requests for select
  using (auth.uid() = user_id);

create policy "ai_payment_requests: insert own"
  on public.ai_payment_requests for insert
  with check (auth.uid() = user_id);
