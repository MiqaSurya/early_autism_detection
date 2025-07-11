-- Debug script to check children table and policies
-- Run this in your Supabase SQL Editor to diagnose the 409 error

-- 1. Check if children table exists and its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'children' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if RLS is enabled on children table
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'children' 
AND schemaname = 'public';

-- 3. Check existing policies on children table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'children' 
AND schemaname = 'public';

-- 4. Check for any unique constraints on children table
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'children' 
AND tc.table_schema = 'public'
AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY');

-- 5. Check for foreign key constraints
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'children'
AND tc.table_schema = 'public';

-- 6. Check if there are any existing children records
SELECT COUNT(*) as total_children FROM public.children;

-- 7. Check if there are any triggers on the children table
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'children'
AND event_object_schema = 'public';
