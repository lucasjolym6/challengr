-- Debug commenting issues
-- Run this in your Supabase SQL Editor

-- 1. Check current user authentication
SELECT 
    'Authentication Check' as info,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN '✅ User is authenticated'
        ELSE '❌ User is not authenticated'
    END as auth_status,
    auth.uid() as user_id;

-- 2. Check if user_challenges table is accessible
SELECT 
    'User Challenges Access' as info,
    COUNT(*) as total_user_challenges
FROM public.user_challenges;

-- 3. Check if posts table is accessible
SELECT 
    'Posts Access' as info,
    COUNT(*) as total_posts
FROM public.posts;

-- 4. Check if comments table is accessible
SELECT 
    'Comments Access' as info,
    COUNT(*) as total_comments
FROM public.comments;

-- 5. Test a simple insert into posts (this will fail if RLS is blocking)
-- Replace 'your-user-id' with an actual user ID from your auth.users table
SELECT 
    'Test Insert Permission' as info,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN 'Ready to test insert'
        ELSE 'Cannot test - no authenticated user'
    END as test_status;

-- 6. Check RLS policies
SELECT 
    'RLS Policies Status' as info,
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename IN ('user_challenges', 'posts', 'comments')
ORDER BY tablename, cmd;

-- 7. Check table permissions for authenticated users
SELECT 
    'Table Permissions' as info,
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges 
WHERE table_name IN ('user_challenges', 'posts', 'comments')
AND table_schema = 'public'
AND grantee IN ('authenticated', 'anon');

-- 8. Check if there are any foreign key constraint issues
SELECT 
    'Foreign Key Constraints' as info,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('user_challenges', 'posts', 'comments')
AND tc.table_schema = 'public';

SELECT 'Debug check complete!' as status;
