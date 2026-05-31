-- Adds draft/published status to exams.
-- New exams default to draft; admin must explicitly publish.
-- RLS policies are tightened so authenticated users (students) can only
-- read content belonging to published exams. Admin uses the service role
-- which bypasses RLS and always sees everything.

-- 1. Column + constraint (idempotent)
alter table public.exams
  add column if not exists status text not null default 'draft';

do $$ begin
  alter table public.exams
    add constraint exams_status_check
    check (status in ('draft', 'published'));
exception when duplicate_object then null;
end $$;


-- 2. Exams — students may only see published exams
drop policy if exists "exams: authenticated read" on public.exams;
drop policy if exists "exams: authenticated read published" on public.exams;
create policy "exams: authenticated read published"
  on public.exams for select
  using (auth.role() = 'authenticated' and status = 'published');


-- 3. Sections — only from published exams
drop policy if exists "sections: authenticated read" on public.sections;
drop policy if exists "sections: authenticated read published" on public.sections;
create policy "sections: authenticated read published"
  on public.sections for select
  using (
    exists (
      select 1 from public.exams
      where exams.id = sections.exam_id
        and exams.status = 'published'
    )
  );


-- 4. Questions — only from published exams
drop policy if exists "questions: authenticated read" on public.questions;
drop policy if exists "questions: authenticated read published" on public.questions;
create policy "questions: authenticated read published"
  on public.questions for select
  using (
    exists (
      select 1 from public.exams
      where exams.id = questions.exam_id
        and exams.status = 'published'
    )
  );


-- 5. Choices — only from published exams (join through questions)
drop policy if exists "choices: authenticated read" on public.choices;
drop policy if exists "choices: authenticated read published" on public.choices;
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


-- 6. Explanation blocks — only from published exams (join through questions)
drop policy if exists "explanation_blocks: authenticated read" on public.explanation_blocks;
drop policy if exists "explanation_blocks: authenticated read published" on public.explanation_blocks;
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
