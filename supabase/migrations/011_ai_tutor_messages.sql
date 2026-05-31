-- AI Tutor Messages
-- Stores per-question conversation history between a student and the AI tutor.

create table public.ai_tutor_messages (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id)       on delete cascade,
  question_id uuid        not null references public.questions(id) on delete cascade,
  attempt_id  uuid        references public.attempts(id)           on delete cascade,
  role        text        not null check (role in ('user', 'assistant')),
  content     text        not null,
  created_at  timestamptz not null default now()
);

create index on public.ai_tutor_messages (user_id);
create index on public.ai_tutor_messages (question_id);
create index on public.ai_tutor_messages (attempt_id);
create index on public.ai_tutor_messages (created_at);

alter table public.ai_tutor_messages enable row level security;

create policy "ai_tutor_messages: select own"
  on public.ai_tutor_messages for select
  using (auth.uid() = user_id);

create policy "ai_tutor_messages: insert own"
  on public.ai_tutor_messages for insert
  with check (auth.uid() = user_id);
