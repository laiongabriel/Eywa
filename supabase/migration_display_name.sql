-- Add display_name column to profiles table.
-- This is the name displayed throughout the app (editable).
-- Username remains the unique login identifier (read-only after creation).

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
