-- Run this in Supabase → SQL Editor AFTER migration_profiles.sql
-- Adds avatar_url to the profiles table

alter table public.profiles
  add column if not exists avatar_url text;

-- Storage bucket for avatars:
-- Create a public bucket named "avatars" via Supabase Dashboard →
-- Storage → New bucket → name "avatars" → toggle Public on.
-- Then add this RLS policy so users can only upload their own avatar:
--
--   create policy "avatars_owner_upload"
--     on storage.objects for insert
--     with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
--
--   create policy "avatars_public_read"
--     on storage.objects for select
--     using (bucket_id = 'avatars');
