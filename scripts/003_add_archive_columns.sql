-- Migration: Add archive functionality to habits
-- Run this in Supabase SQL Editor

-- Add archived column (default false for existing habits)
ALTER TABLE habits ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;

-- Add archived_at timestamp (null when not archived)
ALTER TABLE habits ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for faster filtering of non-archived habits
CREATE INDEX IF NOT EXISTS idx_habits_archived ON habits(archived) WHERE archived = false;

-- Comment for documentation
COMMENT ON COLUMN habits.archived IS 'Whether the habit is archived (hidden from main view)';
COMMENT ON COLUMN habits.archived_at IS 'Timestamp when the habit was archived';
