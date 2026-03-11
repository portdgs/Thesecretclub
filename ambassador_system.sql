-- ============================================
-- THESECRETCLUB — ADVANCED AMBASSADOR & INVITE SYSTEM
-- Run this in the Supabase SQL Editor
-- ============================================

-- Ensure pgcrypto is enabled for token generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Update Profiles Table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_ambassador BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS invites_remaining_this_month INTEGER DEFAULT 10;

-- 2. Create generated_invites Table
CREATE TABLE IF NOT EXISTS generated_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inviter_id UUID REFERENCES profiles(id) NOT NULL,
  invited_email TEXT NOT NULL,
  final_token TEXT UNIQUE NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  commission_rate DECIMAL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE,
  used_by_user_id UUID REFERENCES auth.users(id)
);

ALTER TABLE generated_invites ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view invites they generated
CREATE POLICY "Users can view their generated invites"
ON generated_invites FOR SELECT
USING (auth.uid() = inviter_id);

-- Policy: Anyone can validate tokens (needed during signup before auth)
CREATE POLICY "Anyone can validate generated invites"
ON generated_invites FOR SELECT
USING (true);

-- 3. RPC: generate_secure_invite
-- Creates a single-use token bound to a specific email.
-- Decrements remaining invites if the user is a common member.
CREATE OR REPLACE FUNCTION generate_secure_invite(inviter_uuid UUID, guest_email TEXT)
RETURNS TEXT AS $$
DECLARE
  is_amb BOOLEAN;
  invites_left INTEGER;
  new_token TEXT;
  rate DECIMAL;
BEGIN
  -- Get user info
  SELECT is_ambassador, invites_remaining_this_month 
  INTO is_amb, invites_left
  FROM profiles WHERE id = inviter_uuid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inviter profile not found.';
  END IF;

  -- Check quota for common members
  IF NOT is_amb AND (invites_left IS NULL OR invites_left <= 0) THEN
    RAISE EXCEPTION 'No invites remaining this month.';
  END IF;

  -- Generate token (Simple hash logic representation: first 8 chars of a uuid appended to email md5)
  new_token := encode(digest(guest_email || gen_random_uuid()::text, 'sha256'), 'hex');
  
  -- Set commission rate
  IF is_amb THEN
    rate := 0.20; -- 20% commission for ambassadors
  ELSE
    rate := 0.00;
  END IF;

  -- Insert invite
  INSERT INTO generated_invites (inviter_id, invited_email, final_token, commission_rate)
  VALUES (inviter_uuid, LOWER(guest_email), new_token, rate);

  -- Decrement quota if not ambassador
  IF NOT is_amb THEN
    UPDATE profiles SET invites_remaining_this_month = invites_remaining_this_month - 1
    WHERE id = inviter_uuid;
  END IF;

  RETURN new_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. RPC: validate_and_use_secure_invite
-- Atomically checks if email matches the token, marks as used, and returns the inviter_id
CREATE OR REPLACE FUNCTION validate_and_use_secure_invite(guest_email TEXT, token TEXT, new_user_uuid UUID)
RETURNS UUID AS $$
DECLARE
  found_id UUID;
  linked_inviter_id UUID;
BEGIN
  SELECT id, inviter_id INTO found_id, linked_inviter_id 
  FROM generated_invites
  WHERE final_token = token
    AND invited_email = LOWER(guest_email)
    AND is_used = FALSE
  FOR UPDATE;

  IF found_id IS NULL THEN
    RETURN NULL; -- Invalid, already used, or email mismatch
  END IF;

  UPDATE generated_invites 
  SET is_used = TRUE, used_at = NOW(), used_by_user_id = new_user_uuid 
  WHERE id = found_id;
  
  RETURN linked_inviter_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. RPC: reset_monthly_invites
-- Can be called via cron/pg_cron or manually at the 1st of every month
CREATE OR REPLACE FUNCTION reset_monthly_invites()
RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET invites_remaining_this_month = 10 
  WHERE is_ambassador = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
