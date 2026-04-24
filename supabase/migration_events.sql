-- Run this in Supabase → SQL Editor

create table events (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text not null,
  start_at      timestamptz not null,
  end_at        timestamptz not null,
  all_day       boolean not null default false,
  color         text not null default 'blue',
  recurrence    text check (recurrence in ('none','daily','weekly','monthly')) default 'none',
  recur_until   date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table events enable row level security;

create policy "users_own_events"
  on events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger events_updated_at
  before update on events
  for each row execute function update_updated_at();
