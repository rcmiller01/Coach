-- Add ai_enabled column to users table
-- This serves as a kill switch for AI features per user
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN NOT NULL DEFAULT TRUE;
