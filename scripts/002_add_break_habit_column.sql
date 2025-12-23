-- Add break_habit column to habits table
ALTER TABLE habits 
ADD COLUMN IF NOT EXISTS break_habit BOOLEAN DEFAULT false;
