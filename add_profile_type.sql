-- Add profile_type column to distinguish Acompanhantes from Massagistas
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_type TEXT DEFAULT 'acompanhante';

-- All existing profiles default to 'acompanhante'
-- Any profile that had gender = 'Massagista' should be updated
UPDATE profiles SET profile_type = 'massagista', gender = 'Mulher cis' WHERE gender = 'Massagista';
