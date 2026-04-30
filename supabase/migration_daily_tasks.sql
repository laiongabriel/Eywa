-- Run this in Supabase → SQL Editor
-- Adds daily recurring task support

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_daily boolean NOT NULL DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS last_completed_date date;
