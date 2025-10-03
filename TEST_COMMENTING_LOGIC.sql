-- Test the complete commenting and validation logic
-- Run this in your Supabase SQL Editor

-- 1. Check current state of all related tables
SELECT 
    'Table Status Summary' as info,
    'user_challenges' as table_name,
    COUNT(*) as record_count
FROM public.user_challenges
UNION ALL
SELECT 
    'Table Status Summary' as info,
    'posts' as table_name,
    COUNT(*) as record_count
FROM public.posts
UNION ALL
SELECT 
    'Table Status Summary' as info,
    'comments' as table_name,
    COUNT(*) as record_count
FROM public.comments
UNION ALL
SELECT 
    'Table Status Summary' as info,
    'submissions' as table_name,
    COUNT(*) as record_count
FROM public.submissions;

-- 2. Check verification status distribution
SELECT 
    'Verification Status' as info,
    CASE 
        WHEN verified = true THEN 'Verified Posts'
        WHEN verified = false THEN 'Unverified Posts'
        ELSE 'Unknown Status'
    END as status_type,
    COUNT(*) as count
FROM public.posts
GROUP BY verified
ORDER BY verified;

-- 3. Check user challenges and their posts
SELECT 
    'User Challenge Posts' as info,
    uc.id as user_challenge_id,
    uc.user_id,
    uc.status as challenge_status,
    uc.validation_status,
    COUNT(p.id) as post_count,
    COUNT(CASE WHEN p.verified = true THEN 1 END) as verified_post_count
FROM public.user_challenges uc
LEFT JOIN public.posts p ON uc.id = p.user_challenge_id
GROUP BY uc.id, uc.user_id, uc.status, uc.validation_status
ORDER BY uc.created_at DESC
LIMIT 10;

-- 4. Check comments on posts
SELECT 
    'Comments on Posts' as info,
    p.id as post_id,
    p.verified as post_verified,
    COUNT(c.id) as comment_count,
    p.content as post_content
FROM public.posts p
LEFT JOIN public.comments c ON p.id = c.post_id
GROUP BY p.id, p.verified, p.content
ORDER BY p.created_at DESC
LIMIT 10;

-- 5. Check for any orphaned data
SELECT 
    'Orphaned Data Check' as info,
    'Posts without user_challenge' as issue,
    COUNT(*) as count
FROM public.posts p
LEFT JOIN public.user_challenges uc ON p.user_challenge_id = uc.id
WHERE uc.id IS NULL

UNION ALL

SELECT 
    'Orphaned Data Check' as info,
    'Comments without posts' as issue,
    COUNT(*) as count
FROM public.comments c
LEFT JOIN public.posts p ON c.post_id = p.id
WHERE p.id IS NULL;

-- 6. Test authentication and permissions
SELECT 
    'Permission Test' as info,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN '✅ User is authenticated'
        ELSE '❌ User is not authenticated'
    END as auth_status,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN 'User can create posts and comments'
        ELSE 'User cannot create posts and comments'
    END as capability_status;

-- 7. Check recent activity
SELECT 
    'Recent Activity' as info,
    'Recent Posts' as activity_type,
    p.id,
    p.content,
    p.verified,
    p.created_at
FROM public.posts p
ORDER BY p.created_at DESC
LIMIT 5

UNION ALL

SELECT 
    'Recent Activity' as info,
    'Recent Comments' as activity_type,
    c.id::text,
    c.content,
    NULL as verified,
    c.created_at
FROM public.comments c
ORDER BY c.created_at DESC
LIMIT 5;

SELECT 'Testing complete! Check the results above.' as status;
