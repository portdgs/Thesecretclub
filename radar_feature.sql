-- Add geospatial columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS latitude FLOAT8;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longitude FLOAT8;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_location_public BOOLEAN DEFAULT false;

-- Create an index for faster proximity queries
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles (latitude, longitude) WHERE is_location_public = true;

-- Function to find nearby members
CREATE OR REPLACE FUNCTION get_nearby_profiles(
  user_lat FLOAT8,
  user_lng FLOAT8,
  radius_km FLOAT8 DEFAULT 50,
  limit_val INT DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  profile_type TEXT,
  gender TEXT,
  city TEXT,
  neighborhood TEXT,
  verified BOOLEAN,
  boost_until TIMESTAMP WITH TIME ZONE,
  latitude FLOAT8,
  longitude FLOAT8,
  distance_km FLOAT8
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.profile_type,
    p.gender,
    p.city,
    p.neighborhood,
    p.verified,
    p.boost_until,
    p.latitude,
    p.longitude,
    (
      6371 * acos(
        cos(radians(user_lat)) * cos(radians(p.latitude)) *
        cos(radians(p.longitude) - radians(user_lng)) +
        sin(radians(user_lat)) * sin(radians(p.latitude))
      )
    ) AS distance
  FROM profiles p
  WHERE 
    p.is_location_public = true
    AND p.profile_type != 'cliente'
    AND p.latitude IS NOT NULL
    AND p.longitude IS NOT NULL
    AND (
      6371 * acos(
        cos(radians(user_lat)) * cos(radians(p.latitude)) *
        cos(radians(p.longitude) - radians(user_lng)) +
        sin(radians(user_lat)) * sin(radians(p.latitude))
      )
    ) <= radius_km
  ORDER BY distance ASC
  LIMIT limit_val;
END;
$$ LANGUAGE plpgsql;
