-- Adds optional image URL column to choices (for diagram-based answer options).
-- Also creates the choice-images storage bucket.
-- Safe to run on existing databases that already applied 002 and 003.
-- Fresh installs that already have 002 (with column) and 003 (with bucket)
-- are handled by IF NOT EXISTS / ON CONFLICT guards.

alter table public.choices
  add column if not exists choice_image_url text;

-- Create choice-images bucket (no-op if fresh install already created it via 003).
insert into storage.buckets (id, name, public)
values ('choice-images', 'choice-images', true)
on conflict (id) do nothing;

-- Public read policy (no-op if already created via 003).
do $$
begin
  create policy "Public read — choice images"
    on storage.objects for select
    using (bucket_id = 'choice-images');
exception when duplicate_object then null;
end;
$$;
