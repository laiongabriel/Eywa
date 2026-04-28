-- Add avatar_style and language columns to profiles table
alter table public.profiles
  add column if not exists avatar_style text not null default 'notionists',
  add column if not exists language     text not null default 'pt';
