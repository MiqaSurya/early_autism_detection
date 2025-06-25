-- CREATE TEST USER - BYPASS RATE LIMIT
-- Run this in Supabase SQL Editor to create a test user without hitting rate limits

-- STEP 1: Disable email confirmations first
-- Go to Supabase Dashboard → Authentication → Settings
-- Turn OFF "Enable email confirmations"

-- STEP 2: Create a test user directly in the database
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'testuser@example.com',
  crypt('TestPass123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"display_name": "Test User", "full_name": "Test User", "email": "testuser@example.com"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- STEP 3: Create profile for the user
INSERT INTO public.profiles (id, display_name, email, email_verified)
SELECT 
  id,
  'Test User',
  email,
  true
FROM auth.users 
WHERE email = 'testuser@example.com';

-- STEP 4: Verify the user was created
SELECT 
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data
FROM auth.users 
WHERE email = 'testuser@example.com';

-- STEP 5: Verify the profile was created
SELECT 
  id,
  display_name,
  email,
  email_verified
FROM public.profiles 
WHERE email = 'testuser@example.com';

-- SUCCESS MESSAGE
SELECT 'Test user created successfully! You can now login with:' as message;
SELECT 'Email: testuser@example.com' as credentials;
SELECT 'Password: TestPass123!' as credentials;
