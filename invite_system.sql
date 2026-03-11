-- ============================================
-- THESECRETCLUB — INVITE SYSTEM
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Table: invite_codes
CREATE TABLE IF NOT EXISTS invite_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  used_by UUID REFERENCES auth.users(id),
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE  -- optional expiration
);

ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to check/validate invite codes
CREATE POLICY "Anyone can validate invite codes"
ON invite_codes FOR SELECT
USING (true);

-- Policies: Only admins can see all codes, users can check validity via RPC
CREATE POLICY "Admins can view all invite codes"
ON invite_codes FOR SELECT
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Service role can manage invite codes"
ON invite_codes FOR ALL
USING (auth.role() = 'service_role');

-- 2. RPC: validate_and_use_invite
-- Atomically validates and consumes an invite code
CREATE OR REPLACE FUNCTION validate_and_use_invite(invite_code TEXT, user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  found_id UUID;
BEGIN
  SELECT id INTO found_id FROM invite_codes
  WHERE code = invite_code
    AND used_by IS NULL
    AND (expires_at IS NULL OR expires_at > NOW())
  FOR UPDATE;

  IF found_id IS NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE invite_codes SET used_by = user_uuid, used_at = NOW() WHERE id = found_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Sample invite codes for testing (remove in production)
INSERT INTO invite_codes (code) VALUES
  ('SECRET-ALPHA-001'),
  ('SECRET-ALPHA-002'),
  ('SECRET-ALPHA-003'),
  ('SECRET-BETA-001'),
  ('SECRET-BETA-002')
ON CONFLICT (code) DO NOTHING;
