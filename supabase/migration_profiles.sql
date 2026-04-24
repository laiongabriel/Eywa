-- Run this in Supabase → SQL Editor AFTER migration_tasks.sql
-- Enables: login with username, username uniqueness, auto-profile creation on signup

-- ── 1. Profiles table ────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text not null,
  created_at timestamptz not null default now(),
  constraint profiles_username_unique unique (username),
  constraint profiles_username_format check (username ~ '^[a-zA-Z0-9_]{3,20}$')
);

alter table public.profiles enable row level security;

-- Anyone authenticated can read profiles (username lookup)
create policy "profiles_read"
  on public.profiles for select
  using (true);

-- Users can only update their own profile
create policy "profiles_owner_write"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ── 2. Auto-create profile on signup ────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Only create profile if username was supplied (email/password signup)
  if new.raw_user_meta_data->>'username' is not null then
    insert into public.profiles (id, username)
    values (new.id, new.raw_user_meta_data->>'username')
    on conflict do nothing;
  end if;
  return new;
end;
$$;

-- Drop trigger if it already exists, then recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 3. RPC: look up email by username (used for username login) ──────────────
-- security definer allows access to auth.users from client RPC calls
create or replace function public.get_email_by_username(p_username text)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  v_email text;
begin
  select u.email into v_email
  from public.profiles p
  join auth.users u on u.id = p.id
  where lower(p.username) = lower(p_username)
  limit 1;
  return v_email;
end;
$$;

-- Grant execute to authenticated and anonymous (needed for login before auth)
grant execute on function public.get_email_by_username(text) to anon, authenticated;
