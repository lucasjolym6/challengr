-- Verify table structure for commenting
-- Run this in your Supabase SQL Editor

-- 1. Check user_challenges table structure
SELECT 
    'user_challenges columns' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_challenges' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check posts table structure
SELECT 
    'posts columns' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check comments table structure
SELECT 
    'comments columns' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'comments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check foreign key constraints
SELECT 
    'Foreign Keys' as info,
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

-- 5. Check RLS status
SELECT 
    'RLS Status' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('user_challenges', 'posts', 'comments', 'likes')
AND schemaname = 'public';

-- 6. Test insert permissions (this should work for authenticated users)
SELECT 
    'Permission Test' as info,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN '✅ User is authenticated'
        ELSE '❌ User is not authenticated'
    END as auth_status;
