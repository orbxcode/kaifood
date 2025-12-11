-- Create admin user - Simplified approach
-- This script creates an admin user by working with existing auth system

-- Method 1: If you can create the user through your app's signup
-- Just run this after the user signs up normally:

-- Promote existing user to admin (if user exists)
DO $$
DECLARE
  admin_user_id UUID;
  user_exists BOOLEAN;
BEGIN
  -- Check if user exists in auth.users
  SELECT id, TRUE INTO admin_user_id, user_exists 
  FROM auth.users 
  WHERE email = 'admin@kaifood.co.za'
  LIMIT 1;
  
  IF user_exists THEN
    -- User exists, create/update profile
    INSERT INTO profiles (
      id,
      email,
      full_name,
      user_type,
      is_admin,
      created_at,
      updated_at
    ) VALUES (
      admin_user_id,
      'admin@kaifood.co.za',
      'Admin User',
      'admin',
      TRUE,
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Admin profile created for existing user: %', admin_user_id;
    
  ELSE
    -- User doesn't exist, we need to create it
    RAISE NOTICE 'User admin@kaifood.co.za does not exist in auth.users';
    RAISE NOTICE 'Please create the user first through one of these methods:';
    RAISE NOTICE '1. Sign up normally through your app with email: admin@kaifood.co.za';
    RAISE NOTICE '2. Use Supabase CLI: supabase auth signup --email admin@kaifood.co.za --password Admin1234$';
    RAISE NOTICE '3. Create through your app''s registration form';
    RAISE NOTICE 'Then run this script again to promote to admin';
  END IF;
  
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, just update it
    UPDATE profiles 
    SET user_type = 'admin', is_admin = TRUE, updated_at = NOW()
    WHERE email = 'admin@kaifood.co.za';
    RAISE NOTICE 'Updated existing profile to admin status';
END $$;

-- Alternative: Create user directly (may require superuser privileges)
-- Uncomment this section if you have the necessary permissions:

/*
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) 
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@kaifood.co.za',
  crypt('Admin1234$', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Admin User"}',
  false,
  'authenticated'
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'admin@kaifood.co.za'
);
*/

-- Verify admin user
SELECT 
  CASE 
    WHEN u.id IS NOT NULL THEN 'User exists in auth.users ✓'
    ELSE 'User NOT found in auth.users ✗'
  END as auth_status,
  CASE 
    WHEN p.id IS NOT NULL THEN 'Profile exists ✓'
    ELSE 'Profile NOT found ✗'
  END as profile_status,
  CASE 
    WHEN p.is_admin = TRUE THEN 'Admin privileges ✓'
    ELSE 'NOT admin ✗'
  END as admin_status,
  u.email,
  p.full_name,
  p.user_type
FROM auth.users u
FULL OUTER JOIN profiles p ON u.id = p.id
WHERE u.email = 'admin@kaifood.co.za' OR p.email = 'admin@kaifood.co.za';

-- Show all admin users
SELECT 
  u.email,
  p.full_name,
  p.user_type,
  p.is_admin,
  p.created_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.is_admin = TRUE;