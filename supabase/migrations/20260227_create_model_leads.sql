-- Create model_leads table for landing page candidates
CREATE TABLE IF NOT EXISTS model_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER,
  city TEXT NOT NULL,
  instagram TEXT,
  whatsapp TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE model_leads ENABLE ROW LEVEL SECURITY;

-- Policies
-- Allow anyone to submit a lead (INSERT)
CREATE POLICY "Anyone can submit a lead" 
ON model_leads FOR INSERT 
WITH CHECK (true);

-- Only admins can view leads (SELECT)
CREATE POLICY "Only admins can view leads" 
ON model_leads FOR SELECT 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Only admins can update leads (UPDATE)
CREATE POLICY "Only admins can update leads" 
ON model_leads FOR UPDATE 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
