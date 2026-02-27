-- # CLUBE PRIVADO - SUPABASE DATABASE SCHEMA
-- Business Model: Fatal Model (Escort Marketplace)

-- 1. EXTENSIONS (Run first)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER,
  verified BOOLEAN DEFAULT FALSE,
  city TEXT NOT NULL,
  neighborhood TEXT,
  whatsapp TEXT,
   price_min DECIMAL(10, 2),
   price_15min DECIMAL(10, 2),
   price_30min DECIMAL(10, 2),
   price_1h DECIMAL(10, 2),
   rating DECIMAL(3, 2) DEFAULT 0.0,
  bio TEXT,
  height TEXT,
  weight TEXT,
  ethnicity TEXT,
  hair_color TEXT,
  eye_color TEXT,
  avatar_url TEXT,        -- Added: Foto de Perfil (Circular)
  cover_url TEXT,         -- Added: Foto de Capa (Banner)
  gender TEXT,            -- Added: sexo
  specialty TEXT,         -- Added: especialidade
  sexual_role TEXT,       -- Added: passiva/ativa/etc
  validation_video_url TEXT, -- Added: Vídeo de Validação/Comparação
  role TEXT DEFAULT 'acompanhante' CHECK (role IN ('cliente', 'acompanhante')), -- Papel do usuário
  active_plan_id UUID,
  views_count INTEGER DEFAULT 0,
  clicks_count INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT FALSE,
  cpf TEXT,                    -- CPF do usuário (necessário para pagamentos Asaas)
  review_count INTEGER DEFAULT 0, -- Contador de avaliações
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Helper function to increment clicks securely via RPC
CREATE OR REPLACE FUNCTION increment_clicks(profile_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET clicks_count = clicks_count + 1
  WHERE id = profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Register popular services
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

INSERT INTO services (name) VALUES 
('Sexo Vaginal'), ('Sexo Anal'), ('Oral com Camisinha'), 
('Oral sem Camisinha'), ('Massagem Erótica'), ('Beijo na Boca'), 
('Fetiches'), ('Dominação'), ('Passeios'), ('Viagens')
ON CONFLICT (name) DO NOTHING;

-- Profile services mapping
CREATE TABLE IF NOT EXISTS profile_services (
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (profile_id, service_id)
);

-- Subscription Plans
CREATE TABLE IF NOT EXISTS plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, -- 'Bronze', 'Prata', 'Ouro', 'Platina'
  price DECIMAL(10, 2) NOT NULL,
  tier_weight INTEGER DEFAULT 1, -- Platina=4 (topo), Ouro=3, Prata=2, Bronze=1
  duration_days INTEGER DEFAULT 30,
  photos_limit INTEGER DEFAULT 5,
  videos_limit INTEGER DEFAULT 1
);

INSERT INTO plans (name, price, tier_weight, duration_days, photos_limit, videos_limit) VALUES
('Bronze', 50.00, 1, 30, 5, 0),
('Prata', 100.00, 2, 30, 10, 1),
('Ouro', 200.00, 3, 30, 20, 3),
('Platina', 500.00, 4, 30, 50, 10)
ON CONFLICT DO NOTHING;

-- Active Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id),
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ends_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' -- 'active', 'expired', 'canceled'
);

-- 3. SECURITY (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can view, only owner can edit
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile" 
ON profiles FOR UPDATE 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Subscriptions: Only owners can see their own
DROP POLICY IF EXISTS "Users can view own subscriptions." ON subscriptions;
CREATE POLICY "Users can view own subscriptions." ON subscriptions FOR SELECT USING (auth.uid() = profile_id);

-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, user_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Storage Buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('public-photos', 'public-photos', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('public-videos', 'public-videos', true) ON CONFLICT DO NOTHING;

-- Storage Policies (Photos)
CREATE POLICY "Public Photos are viewable by everyone" ON storage.objects FOR SELECT USING (bucket_id = 'public-photos');
CREATE POLICY "Users can upload their own photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'public-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own photos" ON storage.objects FOR DELETE USING (bucket_id = 'public-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage Policies (Videos)
CREATE POLICY "Public Videos are viewable by everyone" ON storage.objects FOR SELECT USING (bucket_id = 'public-videos');
CREATE POLICY "Users can upload their own videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'public-videos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own videos" ON storage.objects FOR DELETE USING (bucket_id = 'public-videos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Authenticated users can view reviews" ON reviews FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert reviews for others" ON reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- Verification Requests Table
CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Endorsements Table (Confirm as Real)
CREATE TABLE IF NOT EXISTS endorsements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  model_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, model_id)
);

ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE endorsements ENABLE ROW LEVEL SECURITY;

-- Trigger to update profile average rating
CREATE OR REPLACE FUNCTION update_profile_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM reviews
    WHERE profile_id = COALESCE(NEW.profile_id, OLD.profile_id)
  )
  WHERE id = COALESCE(NEW.profile_id, OLD.profile_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_review_change
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_profile_rating();

-- 4. STORAGE SETUP
-- Run this if the AI doesn't create the bucket for you:
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('public-photos', 'public-photos', true),
  ('public-videos', 'public-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'public-photos'
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'public-photos');

-- Verification Docs Bucket (Private)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('verification-docs', 'verification-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Verification Requests Policies
CREATE POLICY "Users can view their own requests" ON verification_requests
FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Admins can view all requests" ON verification_requests
FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Models can insert requests" ON verification_requests
FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Admins can update requests" ON verification_requests
FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Endorsements Policies
CREATE POLICY "Public can view endorsements count" ON endorsements
FOR SELECT USING (true);

CREATE POLICY "Clients can insert endorsements" ON endorsements
FOR INSERT WITH CHECK (auth.uid() = client_id);

-- Storage Policies for verification-docs (Private)
CREATE POLICY "Admins can view verification docs" 
ON storage.objects FOR SELECT 
USING (
    bucket_id = 'verification-docs' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

CREATE POLICY "Users can upload verification docs" 
ON storage.objects FOR INSERT 
WITH CHECK (
    auth.role() = 'authenticated' AND 
    bucket_id = 'verification-docs' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view own verification docs" 
ON storage.objects FOR SELECT 
USING (
    bucket_id = 'verification-docs' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload photos" 
ON storage.objects FOR INSERT 
WITH CHECK (
    auth.role() = 'authenticated' AND 
    bucket_id = 'public-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;
CREATE POLICY "Users can delete own photos" 
ON storage.objects FOR DELETE 
USING (
    auth.role() = 'authenticated' AND 
    bucket_id = 'public-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage Policies for 'public-videos'
DROP POLICY IF EXISTS "Public Access Videos" ON storage.objects;
CREATE POLICY "Public Access Videos" ON storage.objects FOR SELECT USING (bucket_id = 'public-videos');

DROP POLICY IF EXISTS "Authenticated users can upload videos" ON storage.objects;
CREATE POLICY "Authenticated users can upload videos" 
ON storage.objects FOR INSERT 
WITH CHECK (
    auth.role() = 'authenticated' AND 
    bucket_id = 'public-videos' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete own videos" ON storage.objects;
CREATE POLICY "Users can delete own videos" 
ON storage.objects FOR DELETE 
USING (
    auth.role() = 'authenticated' AND 
    bucket_id = 'public-videos' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. AUTO-VERIFICATION LOGIC
-- Function to check if profile should be verified
CREATE OR REPLACE FUNCTION check_and_verify_profile()
RETURNS TRIGGER AS $$
DECLARE
  target_profile_id UUID;
  video_url TEXT;
  endorsement_count INTEGER;
BEGIN
  -- Determine profile_id based on who triggered (endorsements insert or profiles update)
  IF TG_TABLE_NAME = 'endorsements' THEN
    target_profile_id := NEW.model_id;
  ELSIF TG_TABLE_NAME = 'profiles' THEN
    target_profile_id := NEW.id;
  END IF;

  -- Get current data
  SELECT validation_video_url INTO video_url FROM profiles WHERE id = target_profile_id;
  SELECT COUNT(*) INTO endorsement_count FROM endorsements WHERE model_id = target_profile_id;

  -- Check conditions: Has Video AND >= 4 Endorsements
  IF video_url IS NOT NULL AND video_url != '' AND endorsement_count >= 4 THEN
    UPDATE profiles SET verified = TRUE WHERE id = target_profile_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on Endorsements (After Insert)
DROP TRIGGER IF EXISTS on_endorsement_added ON endorsements;
CREATE TRIGGER on_endorsement_added
AFTER INSERT ON endorsements
FOR EACH ROW EXECUTE FUNCTION check_and_verify_profile();

-- Trigger on Profiles (After Update of validation_video_url)
DROP TRIGGER IF EXISTS on_profile_video_update ON profiles;
CREATE TRIGGER on_profile_video_update
AFTER UPDATE OF validation_video_url ON profiles
FOR EACH ROW EXECUTE FUNCTION check_and_verify_profile();


-- 6. EXECUTION
-- Copy all this code and paste it into the "SQL Editor" in your Supabase Dashboard.
-- Click "Run" to initialize your database and storage permissions.
