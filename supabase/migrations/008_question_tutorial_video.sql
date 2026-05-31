-- Adds optional YouTube tutorial video URL to questions.
alter table public.questions
  add column if not exists tutorial_video_url text;
