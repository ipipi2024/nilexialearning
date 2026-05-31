-- AI Tutor Attachments
-- Stores metadata for images students upload during a tutoring session.
-- Files live in the 'ai-tutor-attachments' Supabase Storage bucket.

create table public.ai_tutor_attachments (
  id          uuid        primary key default gen_random_uuid(),
  message_id  uuid        references public.ai_tutor_messages(id) on delete cascade,
  user_id     uuid        not null references auth.users(id) on delete cascade,
  question_id uuid        not null references public.questions(id) on delete cascade,
  file_url    text        not null,
  file_name   text,
  file_type   text,
  file_size   integer,
  created_at  timestamptz not null default now()
);

create index on public.ai_tutor_attachments (message_id);
create index on public.ai_tutor_attachments (user_id);
create index on public.ai_tutor_attachments (question_id);

alter table public.ai_tutor_attachments enable row level security;

create policy "ai_tutor_attachments: select own"
  on public.ai_tutor_attachments for select
  using (auth.uid() = user_id);

create policy "ai_tutor_attachments: insert own"
  on public.ai_tutor_attachments for insert
  with check (auth.uid() = user_id);

-- Storage bucket — public, following the same pattern as question-images etc.
-- Uploads are always done server-side via the service role (admin client),
-- so no storage insert policy is needed.
insert into storage.buckets (id, name, public)
values ('ai-tutor-attachments', 'ai-tutor-attachments', true);

create policy "Public read — ai tutor attachments"
  on storage.objects for select
  using (bucket_id = 'ai-tutor-attachments');
