-- Run this in the Supabase SQL Editor ONLY if you already applied 002_core_schema.sql.
-- If you are starting fresh, 002_core_schema.sql already includes these changes.

-- Add paper_number and paper_type to existing exams table.
-- Defaults cover any existing rows; new rows must supply explicit values.
alter table public.exams
  add column paper_number int  not null default 1,
  add column paper_type   text not null default 'objective';

-- Add long_response to the question_type enum.
-- IF NOT EXISTS is safe to run even if the value already exists.
alter type question_type add value if not exists 'long_response';
