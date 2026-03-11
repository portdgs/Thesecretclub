-- ============================================
-- THESECRETCLUB — FRIENDSHIP SYSTEM
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Create Friend Requests Table
CREATE TABLE IF NOT EXISTS friend_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(sender_id, receiver_id)
);

-- Enable RLS
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

-- Policies for Friend Requests
CREATE POLICY "Users can see their own sent/received requests" ON friend_requests
FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send friend requests" ON friend_requests
FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update requests they received" ON friend_requests
FOR UPDATE TO authenticated USING (auth.uid() = receiver_id OR auth.uid() = sender_id);

CREATE POLICY "Users can delete their own requests" ON friend_requests
FOR DELETE TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 2. Create Friends View (Optional but helpful)
-- Or just query the friend_requests table where status = 'accepted'

-- 3. Utility Function to check friendship status
CREATE OR REPLACE FUNCTION get_friend_status(user_a UUID, user_b UUID)
RETURNS TEXT AS $$
DECLARE
    req_status TEXT;
BEGIN
    SELECT status INTO req_status 
    FROM friend_requests 
    WHERE (sender_id = user_a AND receiver_id = user_b) 
       OR (sender_id = user_b AND receiver_id = user_a)
    LIMIT 1;
    
    RETURN COALESCE(req_status, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
