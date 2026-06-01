-- Add sub_label and display_label to questions for sub-question support (e.g. 31(a), 31(b)).
-- sub_label  : the part after the question number, e.g. "a" for question 31(a)
-- display_label: the human-readable label shown everywhere, e.g. "31(a)" or "31"

alter table public.questions
  add column if not exists sub_label    text,
  add column if not exists display_label text;

-- Backfill existing questions: display_label = question number as text.
update public.questions
set display_label = number::text
where display_label is null;

-- Questions should be sorted by (number, sub_label nulls first).
-- No index needed — the existing number index handles most queries.
