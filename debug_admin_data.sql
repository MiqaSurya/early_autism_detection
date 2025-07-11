-- Debug script to check admin dashboard data
-- Run this in your Supabase SQL Editor to see what data exists

-- 1. Check profiles table
SELECT 
    'profiles' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as records_with_email,
    COUNT(CASE WHEN display_name IS NOT NULL THEN 1 END) as records_with_display_name
FROM public.profiles;

-- 2. Check children table
SELECT 
    'children' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT parent_id) as unique_parents
FROM public.children;

-- 3. Check assessments table
SELECT 
    'assessments' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_assessments,
    COUNT(DISTINCT child_id) as unique_children_with_assessments
FROM public.assessments;

-- 4. Check user-children-assessments relationship
SELECT 
    p.id as user_id,
    p.email,
    p.display_name,
    COUNT(DISTINCT c.id) as children_count,
    COUNT(DISTINCT a.id) as assessments_count,
    COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END) as completed_assessments_count
FROM public.profiles p
LEFT JOIN public.children c ON p.id = c.parent_id
LEFT JOIN public.assessments a ON c.id = a.child_id
GROUP BY p.id, p.email, p.display_name
ORDER BY children_count DESC, assessments_count DESC;

-- 5. Check if there are children without profiles
SELECT 
    c.parent_id,
    COUNT(*) as children_count,
    'Missing profile' as issue
FROM public.children c
LEFT JOIN public.profiles p ON c.parent_id = p.id
WHERE p.id IS NULL
GROUP BY c.parent_id;

-- 6. Check if there are assessments without children
SELECT 
    a.child_id,
    COUNT(*) as assessment_count,
    'Missing child record' as issue
FROM public.assessments a
LEFT JOIN public.children c ON a.child_id = c.id
WHERE c.id IS NULL
GROUP BY a.child_id;

-- 7. Sample data from each table
SELECT 'Sample profiles:' as info;
SELECT id, email, display_name, created_at FROM public.profiles LIMIT 5;

SELECT 'Sample children:' as info;
SELECT id, parent_id, name, created_at FROM public.children LIMIT 5;

SELECT 'Sample assessments:' as info;
SELECT id, child_id, status, started_at, completed_at FROM public.assessments LIMIT 5;
