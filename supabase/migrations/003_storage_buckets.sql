-- Run this in the Supabase SQL Editor.
-- Creates two public storage buckets for media uploads.
-- Writes are done via the service role key (bypasses RLS),
-- so only read policies are needed here.

insert into storage.buckets (id, name, public)
values
  ('question-images',    'question-images',    true),
  ('explanation-images', 'explanation-images', true),
  ('choice-images',      'choice-images',      true),
  ('payment-proofs',     'payment-proofs',     true);

-- Allow anyone to read public image URLs
create policy "Public read — question images"
  on storage.objects for select
  using (bucket_id = 'question-images');

create policy "Public read — explanation images"
  on storage.objects for select
  using (bucket_id = 'explanation-images');

create policy "Public read — choice images"
  on storage.objects for select
  using (bucket_id = 'choice-images');

create policy "Public read — payment proofs"
  on storage.objects for select
  using (bucket_id = 'payment-proofs');
