-- Optional: run this in the Supabase SQL Editor to create a dedicated profiles table.
-- For Phase 2, full_name / school / grade are stored in auth.users.raw_user_meta_data
-- via signUp options.data, so this table is not required yet.
-- You will need this in a later phase when reading profiles at scale.

create table if not exists public.profiles (
  id         uuid        references auth.users(id) on delete cascade primary key,
  full_name  text,
  school     text,
  grade      text,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);
