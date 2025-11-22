-- Add is_warmup column to workout_set_logs
ALTER TABLE workout_set_logs ADD COLUMN IF NOT EXISTS is_warmup BOOLEAN DEFAULT FALSE;
