-- ============================================
-- THESECRETCLUB — SOCIAL NETWORK MODULE
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Update Profiles Table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- 2. Create Public Storage Bucket for User Content
-- Note: In Supabase, bucket creation via SQL requires inserting into storage.buckets.
-- We also need to set up RLS policies for the bucket.
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-content', 'user-content', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'user-content'
-- Allow public read access to user-content
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'user-content');

-- Allow authenticated users to upload to user-content
CREATE POLICY "Auth Insert" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'user-content' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own files
CREATE POLICY "Auth Update" ON storage.objects
FOR UPDATE TO authenticated WITH CHECK (
    bucket_id = 'user-content' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY "Auth Delete" ON storage.objects
FOR DELETE TO authenticated USING (
    bucket_id = 'user-content' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Create Posts Table
CREATE TABLE IF NOT EXISTS posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT,
    media_url TEXT,
    media_type TEXT CHECK (media_type IN ('image', 'video', null)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Post Policies
-- Anyone authenticated can read posts
CREATE POLICY "Authenticated users can read posts" ON posts
FOR SELECT TO authenticated USING (true);

-- Users can insert their own posts
CREATE POLICY "Users can create posts" ON posts
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts" ON posts
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Users can update their own posts
CREATE POLICY "Users can update own posts" ON posts
FOR UPDATE TO authenticated USING (auth.uid() = user_id);


-- 4. Create Post Likes Table
CREATE TABLE IF NOT EXISTS post_likes (
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

-- Enable RLS for Likes
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- Like Policies
-- Anyone authenticated can read likes
CREATE POLICY "Authenticated users can read likes" ON post_likes
FOR SELECT TO authenticated USING (true);

-- Users can insert their own likes
CREATE POLICY "Users can create likes" ON post_likes
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Users can delete own likes" ON post_likes
FOR DELETE TO authenticated USING (auth.uid() = user_id);
