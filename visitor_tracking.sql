-- # Visitor Tracking Implementation
-- Adds visitor identity to profile analytics

-- 1. Create Analytics Table if not exists
CREATE TABLE IF NOT EXISTS profile_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'click')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster aggregation
CREATE INDEX IF NOT EXISTS idx_profile_analytics_composite ON profile_analytics (profile_id, created_at);

-- Add visitor_id column
ALTER TABLE profile_analytics 
ADD COLUMN IF NOT EXISTS visitor_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- 2. Update RPC: increment_views
-- Now accepts an optional visitor_id
CREATE OR REPLACE FUNCTION increment_views(profile_id UUID, visitor_id UUID DEFAULT NULL)
RETURNS void AS $$
BEGIN
  -- Basic counter update
  UPDATE profiles
  SET views_count = views_count + 1
  WHERE id = profile_id;

  -- Log event with visitor identity
  INSERT INTO profile_analytics (profile_id, event_type, visitor_id)
  VALUES (profile_id, 'view', visitor_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update RPC: increment_clicks
-- Now accepts an optional visitor_id
CREATE OR REPLACE FUNCTION increment_clicks(profile_id UUID, visitor_id UUID DEFAULT NULL)
RETURNS void AS $$
BEGIN
  -- Basic counter update
  UPDATE profiles
  SET clicks_count = clicks_count + 1
  WHERE id = profile_id;

  -- Log event with visitor identity
  INSERT INTO profile_analytics (profile_id, event_type, visitor_id)
  VALUES (profile_id, 'click', visitor_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Verify RLS
-- Models can see who visited them
DROP POLICY IF EXISTS "Models can view their own analytics" ON profile_analytics;
CREATE POLICY "Models can view their own analytics" 
ON profile_analytics FOR SELECT 
USING (auth.uid() = profile_id);
