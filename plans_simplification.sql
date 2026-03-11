-- Phase 9: Plans Simplification and Super Admin Configuration

-- 1. Ensure the 'Full' plan is the only one
DO $$
BEGIN
    -- Check if 'plans' table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'plans') THEN
        -- Delete all existing plans to start fresh (avoids constraint errors)
        DELETE FROM plans;
        
        -- Insert the single 'Full' plan
        INSERT INTO plans (name, price, tier_weight)
        VALUES ('Full', 39.99, 4);
    END IF;
END $$;

-- 2. Configure the Super Admin (portdgs@gmail.com)
-- This assumes the auth.users entry already exists.

-- Ensure the column exists before updating (Fixes 42703 error)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_tier_weight INTEGER DEFAULT 0;

DO $$
DECLARE
    admin_id UUID;
    full_plan_id UUID;
BEGIN
    -- Get the admin UUID
    SELECT id INTO admin_id FROM auth.users WHERE email = 'portdgs@gmail.com';
    
    -- Get the Full plan UUID if the table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'plans') THEN
        SELECT id INTO full_plan_id FROM plans WHERE name = 'Full' LIMIT 1;
    END IF;

    IF admin_id IS NOT NULL THEN
        -- Link the profile to the admin user, set as admin, and assign the plan
        UPDATE profiles 
        SET is_admin = true, 
            is_ambassador = true, -- Super Admin is also the top ambassador
            active_plan_id = full_plan_id, -- Fixed column name
            plan_tier_weight = 4,          -- Ensure weight is maxed
            verified = true
        WHERE id = admin_id;
        
        -- Fallback if the profile doesn't exist (unlikely if they logged in)
        IF NOT FOUND THEN
            INSERT INTO profiles (id, name, city, gender, is_admin, is_ambassador, active_plan_id, plan_tier_weight, verified)
            VALUES (admin_id, 'Super Admin', 'Não informado', 'Não informado', true, true, full_plan_id, 4, true);
        END IF;
    END IF;
END $$;
