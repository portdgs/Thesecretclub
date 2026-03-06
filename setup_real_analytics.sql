-- # Real Analytics Implementation

-- 1. Create Analytics Table
CREATE TABLE IF NOT EXISTS profile_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'click')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster aggregation by hour and profile
CREATE INDEX IF NOT EXISTS idx_profile_analytics_composite ON profile_analytics (profile_id, created_at);

-- 2. Redefine increment_views to log events
CREATE OR REPLACE FUNCTION increment_views(profile_id UUID)
RETURNS void AS $$
BEGIN
  -- Basic counter update
  UPDATE profiles
  SET views_count = views_count + 1
  WHERE id = profile_id;

  -- Log event for heatmap
  INSERT INTO profile_analytics (profile_id, event_type)
  VALUES (profile_id, 'view');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Redefine increment_clicks to log events
CREATE OR REPLACE FUNCTION increment_clicks(profile_id UUID)
RETURNS void AS $$
BEGIN
  -- Basic counter update
  UPDATE profiles
  SET clicks_count = clicks_count + 1
  WHERE id = profile_id;

  -- Log event for heatmap
  INSERT INTO profile_analytics (profile_id, event_type)
  VALUES (profile_id, 'click');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on analytics table
ALTER TABLE profile_analytics ENABLE ROW LEVEL SECURITY;

-- Analytics: Models can view their own metrics, Public can't read directly
CREATE POLICY "Models can view their own analytics" 
ON profile_analytics FOR SELECT 
USING (auth.uid() = profile_id);
