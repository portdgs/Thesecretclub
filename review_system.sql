-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(profile_id, user_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_reviews_profile_id ON reviews(profile_id);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Reviews are viewable by everyone" 
ON reviews FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviews" 
ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their reviews" 
ON reviews FOR UPDATE USING (auth.uid() = user_id);

-- Function to update profile rating
CREATE OR REPLACE FUNCTION update_profile_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles
    SET 
        rating = (SELECT COALESCE(AVG(rating)::FLOAT, 0) FROM reviews WHERE profile_id = COALESCE(NEW.profile_id, OLD.profile_id)),
        reviews_count = (SELECT COUNT(*)::INT FROM reviews WHERE profile_id = COALESCE(NEW.profile_id, OLD.profile_id))
    WHERE id = COALESCE(NEW.profile_id, OLD.profile_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS tr_update_profile_rating ON reviews;
CREATE TRIGGER tr_update_profile_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_profile_rating();
