-- Add boost_until column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS boost_until TIMESTAMP WITH TIME ZONE;

-- Create an index to improve sorting performance for boosted profiles
CREATE INDEX IF NOT EXISTS idx_profiles_boost_until ON profiles (boost_until DESC);
