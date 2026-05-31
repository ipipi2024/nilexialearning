-- Add username and updated_at to existing profiles table.
-- The profiles table and its trigger already exist from 002_core_schema.sql.

alter table public.profiles
  add column if not exists username   text unique,
  add column if not exists updated_at timestamptz default now() not null;

-- Auto-update updated_at on every row update.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();
