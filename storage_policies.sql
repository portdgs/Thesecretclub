-- This SQL snippet sets up the required storage buckets and security policies
-- Run this in the Supabase SQL Editor

-- 1. Permite acesso público para imagens (SELECT) no storage
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id IN ('TheSecretclub', 'Thesecretclub-video', 'user-content') );

-- 2. Permite uploads de usuários autenticados (INSERT) 
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
WITH CHECK ( auth.role() = 'authenticated' );

-- 3. Permite deletar arquivos aos donos
DROP POLICY IF EXISTS "Allow owners to delete their files" ON storage.objects;
CREATE POLICY "Allow owners to delete their files"
ON storage.objects FOR DELETE
USING ( auth.uid() = owner );

-- 4. Permite editar arquivos aos donos
DROP POLICY IF EXISTS "Allow owners to update their files" ON storage.objects;
CREATE POLICY "Allow owners to update their files"
ON storage.objects FOR UPDATE
USING ( auth.uid() = owner );
