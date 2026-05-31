-- =============================================================
-- PNG Exam Practice Platform — Core Schema
-- Run this in the Supabase SQL Editor (supersedes 001_profiles.sql).
-- Run once on a clean schema. Do NOT run on top of 001 if it was
-- already applied — drop that table first or skip the profiles block.
-- =============================================================


-- =============================================================
-- ENUMS
-- =============================================================

create type question_type    as enum ('multiple_choice', 'short_answer', 'long_response');
create type attempt_mode     as enum ('practice', 'exam');
create type block_type       as enum ('text', 'image');
create type self_check_status as enum ('correct', 'incorrect');


-- =============================================================
-- TABLES
-- =============================================================

-- 1. profiles
--    One row per auth user. Created automatically via trigger below.
create table public.profiles (
  id         uuid        references auth.users(id) on delete cascade primary key,
  full_name  text,
  school     text,
  grade      text,
  created_at timestamptz default now() not null
);

-- 2. exams
--    A single past exam paper (Subject + Year).
create table public.exams (
  id               uuid        primary key default gen_random_uuid(),
  subject          text        not null,
  year             int         not null,
  paper_number     int         not null default 1,
  paper_type       text        not null default 'objective',
  duration_minutes int         not null,
  total_marks      int         not null,
  status           text        not null default 'draft'
                               check (status in ('draft', 'published')),
  access_type      text        not null default 'free'
                               check (access_type in ('free', 'paid')),
  price_amount     numeric,
  price_currency   text        not null default 'PGK',
  created_at       timestamptz default now() not null
);

-- 3. sections
--    A named block inside an exam (e.g. "Section A — Multiple Choice").
create table public.sections (
  id             uuid primary key default gen_random_uuid(),
  exam_id        uuid not null references public.exams(id) on delete cascade,
  name           text not null,
  section_type   text not null,
  marks          int  not null,
  question_start int  not null,
  question_end   int  not null
);

-- 4. questions
--    A single question. Belongs to both an exam and a section.
create table public.questions (
  id                  uuid          primary key default gen_random_uuid(),
  exam_id             uuid          not null references public.exams(id)    on delete cascade,
  section_id          uuid          not null references public.sections(id) on delete cascade,
  number              int           not null,
  question_text       text          not null,
  question_type       question_type not null,
  question_image_url  text,
  tutorial_video_url  text,
  marks               int           not null,
  created_at          timestamptz   default now() not null
);

-- 5. choices
--    Answer options for multiple_choice questions.
create table public.choices (
  id               uuid    primary key default gen_random_uuid(),
  question_id      uuid    not null references public.questions(id) on delete cascade,
  label            text    not null,   -- "A", "B", "C", "D"
  text             text    not null,
  is_correct       boolean not null default false,
  choice_image_url text                -- optional image for diagram-based options
);

-- 6. explanation_blocks
--    Ordered explanation content for a question (text or image).
create table public.explanation_blocks (
  id          uuid       primary key default gen_random_uuid(),
  question_id uuid       not null references public.questions(id) on delete cascade,
  block_order int        not null,
  block_type  block_type not null,
  content     text       not null    -- raw text OR image URL
);

-- 7. attempts
--    One attempt = one student sitting an exam (practice or timed).
create table public.attempts (
  id           uuid         primary key default gen_random_uuid(),
  user_id      uuid         not null references auth.users(id) on delete cascade,
  exam_id      uuid         not null references public.exams(id) on delete cascade,
  mode         attempt_mode not null,
  score        numeric,                    -- null until submitted
  started_at   timestamptz  default now() not null,
  submitted_at timestamptz             -- null until submitted
);

-- 8. user_answers
--    One row per question per attempt.
create table public.user_answers (
  id                uuid              primary key default gen_random_uuid(),
  attempt_id        uuid              not null references public.attempts(id)  on delete cascade,
  question_id       uuid              not null references public.questions(id) on delete cascade,
  answer            text,             -- selected choice label OR typed short answer
  is_correct        boolean,          -- set after auto-grade (multiple_choice) or ignored
  self_check_status self_check_status, -- set by student for short_answer
  created_at        timestamptz       default now() not null
);

-- 9. payment_requests
--    Students upload payment proof; admin reviews and approves/rejects.
create table public.payment_requests (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references auth.users(id)   on delete cascade,
  exam_id           uuid        not null references public.exams(id) on delete cascade,
  user_email        text        not null,
  payer_name        text,
  payment_reference text,
  proof_image_url   text        not null,
  note              text,
  admin_note        text,
  status            text        not null default 'pending'
                                check (status in ('pending', 'approved', 'rejected')),
  created_at        timestamptz default now() not null,
  reviewed_at       timestamptz,
  reviewed_by       uuid        references auth.users(id)
);

-- 10. user_exam_access
--     Admin grants students access to paid exams after payment approval.
create table public.user_exam_access (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id)   on delete cascade,
  exam_id    uuid        not null references public.exams(id) on delete cascade,
  granted_at timestamptz default now() not null,
  granted_by uuid        references auth.users(id),
  source     text        not null default 'manual_payment',
  unique(user_id, exam_id)
);


-- =============================================================
-- INDEXES
-- =============================================================

create index on public.sections           (exam_id);
create index on public.questions          (exam_id);
create index on public.questions          (section_id);
create index on public.choices            (question_id);
create index on public.explanation_blocks (question_id);
create index on public.explanation_blocks (question_id, block_order);
create index on public.attempts           (user_id);
create index on public.attempts           (exam_id);
create index on public.user_answers       (attempt_id);
create index on public.user_answers       (question_id);

create index on public.payment_requests   (user_id);
create index on public.payment_requests   (exam_id);
create index on public.payment_requests   (status);
create unique index payment_requests_pending_unique
  on public.payment_requests (user_id, exam_id)
  where (status = 'pending');

create index on public.user_exam_access   (user_id);
create index on public.user_exam_access   (exam_id);


-- =============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

alter table public.profiles          enable row level security;
alter table public.exams             enable row level security;
alter table public.sections          enable row level security;
alter table public.questions         enable row level security;
alter table public.choices           enable row level security;
alter table public.explanation_blocks enable row level security;
alter table public.attempts          enable row level security;
alter table public.user_answers      enable row level security;
alter table public.payment_requests  enable row level security;
alter table public.user_exam_access  enable row level security;


-- profiles: users manage only their own row
create policy "profiles: select own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: insert own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id);


-- exam content: students may only read published exams and their dependent content.
-- admin uses the service role which bypasses RLS and sees everything.
create policy "exams: authenticated read published"
  on public.exams for select
  using (auth.role() = 'authenticated' and status = 'published');

create policy "sections: authenticated read published"
  on public.sections for select
  using (
    exists (
      select 1 from public.exams
      where exams.id = sections.exam_id
        and exams.status = 'published'
    )
  );

create policy "questions: authenticated read published"
  on public.questions for select
  using (
    exists (
      select 1 from public.exams
      where exams.id = questions.exam_id
        and exams.status = 'published'
    )
  );

create policy "choices: authenticated read published"
  on public.choices for select
  using (
    exists (
      select 1 from public.questions q
      join public.exams e on e.id = q.exam_id
      where q.id = choices.question_id
        and e.status = 'published'
    )
  );

create policy "explanation_blocks: authenticated read published"
  on public.explanation_blocks for select
  using (
    exists (
      select 1 from public.questions q
      join public.exams e on e.id = q.exam_id
      where q.id = explanation_blocks.question_id
        and e.status = 'published'
    )
  );


-- attempts: users access only their own
create policy "attempts: select own"
  on public.attempts for select
  using (auth.uid() = user_id);

create policy "attempts: insert own"
  on public.attempts for insert
  with check (auth.uid() = user_id);

create policy "attempts: update own"
  on public.attempts for update
  using (auth.uid() = user_id);


-- payment_requests: users insert and read their own rows only
create policy "payment_requests: select own"
  on public.payment_requests for select
  using (auth.uid() = user_id);

create policy "payment_requests: insert own"
  on public.payment_requests for insert
  with check (auth.uid() = user_id);


-- user_exam_access: users read their own rows only (admin writes via service role)
create policy "user_exam_access: select own"
  on public.user_exam_access for select
  using (auth.uid() = user_id);


-- user_answers: access only answers that belong to the user's own attempts
create policy "user_answers: select own"
  on public.user_answers for select
  using (
    exists (
      select 1 from public.attempts
      where attempts.id = user_answers.attempt_id
        and attempts.user_id = auth.uid()
    )
  );

create policy "user_answers: insert own"
  on public.user_answers for insert
  with check (
    exists (
      select 1 from public.attempts
      where attempts.id = user_answers.attempt_id
        and attempts.user_id = auth.uid()
    )
  );

create policy "user_answers: update own"
  on public.user_answers for update
  using (
    exists (
      select 1 from public.attempts
      where attempts.id = user_answers.attempt_id
        and attempts.user_id = auth.uid()
    )
  );
