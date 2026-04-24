-- Run this in Supabase → SQL Editor

create table tasks (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  title            text not null,
  completed        boolean not null default false,
  priority         text not null default 'medium'
                     check (priority in ('low', 'medium', 'high')),
  due_date         date,
  scheduled_at     timestamptz,
  estimated_minutes integer,
  is_mit           boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Row Level Security — each user only sees their own tasks
alter table tasks enable row level security;

create policy "users_own_tasks"
  on tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tasks_updated_at
  before update on tasks
  for each row execute function update_updated_at();
