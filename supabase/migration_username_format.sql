-- Run this in Supabase → SQL Editor to allow spaces in username
-- and extend max length from 20 to 30 characters

alter table public.profiles
  drop constraint if exists profiles_username_format;

alter table public.profiles
  add constraint profiles_username_format
    check (char_length(username) >= 3 and char_length(username) <= 30);
