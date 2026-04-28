-- Run this in Supabase → SQL Editor
-- Adds the reminder column required for browser notification scheduling.

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS reminder_offset_minutes integer DEFAULT NULL;
