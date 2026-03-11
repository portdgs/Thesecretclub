-- Fix missing columns in profiles table
-- Run this in the Supabase SQL Editor

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS weight TEXT,
ADD COLUMN IF NOT EXISTS hair_color TEXT,
ADD COLUMN IF NOT EXISTS eye_color TEXT,
ADD COLUMN IF NOT EXISTS ethnicity TEXT,
ADD COLUMN IF NOT EXISTS pix_key TEXT,
ADD COLUMN IF NOT EXISTS pix_key_type TEXT;

-- Verify columns exist (optional check)
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' 
-- AND column_name IN ('weight', 'hair_color', 'eye_color', 'ethnicity', 'pix_key', 'pix_key_type');
