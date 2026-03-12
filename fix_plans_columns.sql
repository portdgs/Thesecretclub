-- Add missing columns to the plans table if they don't exist
ALTER TABLE plans ADD COLUMN IF NOT EXISTS photos_limit INTEGER DEFAULT 5;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS videos_limit INTEGER DEFAULT 0;

-- Update the 'Full' plan to have the correct limits (200 photos, 50 videos)
UPDATE plans SET photos_limit = 200, videos_limit = 50 WHERE name = 'Full';
