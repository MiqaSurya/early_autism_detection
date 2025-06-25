-- IMMEDIATE FIX FOR RATE LIMIT ISSUE
-- Copy and paste this ENTIRE script into Supabase SQL Editor and run it

-- Step 1: Disable email confirmations (run this first)
-- Go to Supabase Dashboard → Authentication → Settings
-- Turn OFF "Enable email confirmations" and save

-- Step 2: Create test user directly (bypasses rate limit)
DO $$
DECLARE
    user_id UUID;
BEGIN
    -- Generate a new UUID for the user
    user_id := gen_random_uuid();
    
    -- Insert user into auth.users table
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
        user_id,
        'authenticated',
        'authenticated',
        'test@example.com',
        crypt('TestPass123!', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"display_name": "Test User", "full_name": "Test User", "email": "test@example.com"}',
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    );
    
    -- Create profile for the user
    INSERT INTO public.profiles (id, display_name, email, email_verified, created_at, updated_at)
    VALUES (
        user_id,
        'Test User',
        'test@example.com',
        true,
        NOW(),
        NOW()
    );
    
    -- Output success message
    RAISE NOTICE 'User created successfully!';
    RAISE NOTICE 'Email: test@example.com';
    RAISE NOTICE 'Password: TestPass123!';
    
END $$;

-- Step 3: Verify user was created
SELECT 
    'User verification:' as check_type,
    id,
    email,
    email_confirmed_at IS NOT NULL as email_confirmed,
    raw_user_meta_data->>'display_name' as display_name
FROM auth.users 
WHERE email = 'test@example.com';

-- Step 4: Verify profile was created
SELECT 
    'Profile verification:' as check_type,
    id,
    display_name,
    email,
    email_verified
FROM public.profiles 
WHERE email = 'test@example.com';

-- Step 5: Success message
SELECT 'SUCCESS! You can now login with:' as message;
SELECT 'Email: test@example.com' as login_info;
SELECT 'Password: TestPass123!' as login_info;
