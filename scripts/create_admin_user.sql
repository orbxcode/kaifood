-- Script to create admin user after migration
-- Run this after creating the user through Supabase Auth UI or API

-- Update an existing user to be admin (replace with actual admin email)
UPDATE profiles 
SET is_admin = TRUE 
WHERE email = 'admin@kaicatering.com';

-- Verify admin user was created
SELECT 
  id,
  email,
  full_name,
  user_type,
  is_admin,
  created_at
FROM profiles 
WHERE is_admin = TRUE;