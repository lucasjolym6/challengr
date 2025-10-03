-- Validation Post Logic Setup
-- Run this in your Supabase SQL Editor

-- 1. Verify posts table structure
SELECT 
    'Posts Table Structure' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check current posts and their verification status
SELECT 
    'Current Posts Status' as info,
    COUNT(*) as total_posts,
    COUNT(CASE WHEN verified = true THEN 1 END) as verified_posts,
    COUNT(CASE WHEN verified = false THEN 1 END) as unverified_posts
FROM public.posts;

-- 3. Check posts with their related user_challenges
SELECT 
    'Posts with User Challenges' as info,
    p.id as post_id,
    p.content,
    p.verified,
    p.created_at,
    uc.status as user_challenge_status,
    uc.validation_status,
    uc.completed_at
FROM public.posts p
LEFT JOIN public.user_challenges uc ON p.user_challenge_id = uc.id
ORDER BY p.created_at DESC
LIMIT 10;

-- 4. Verify that validation process updates posts correctly
-- This query shows the relationship between submissions, user_challenges, and posts
SELECT 
    'Validation Flow Check' as info,
    s.id as submission_id,
    s.status as submission_status,
    uc.id as user_challenge_id,
    uc.status as user_challenge_status,
    uc.validation_status,
    p.id as post_id,
    p.verified as post_verified
FROM public.submissions s
LEFT JOIN public.user_challenges uc ON s.user_id = uc.user_id AND s.challenge_id = uc.challenge_id
LEFT JOIN public.posts p ON uc.id = p.user_challenge_id
WHERE s.status = 'approved'
ORDER BY s.created_at DESC
LIMIT 5;

-- 5. Create a function to ensure post verification is consistent
CREATE OR REPLACE FUNCTION sync_post_verification()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user_challenge is approved, mark related posts as verified
  IF NEW.validation_status = 'approved' AND OLD.validation_status != 'approved' THEN
    UPDATE public.posts 
    SET verified = true 
    WHERE user_challenge_id = NEW.id AND verified = false;
    
    RAISE NOTICE 'Marked posts as verified for user_challenge %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger to automatically sync post verification
DROP TRIGGER IF EXISTS sync_post_verification_trigger ON public.user_challenges;
CREATE TRIGGER sync_post_verification_trigger
  AFTER UPDATE ON public.user_challenges
  FOR EACH ROW
  EXECUTE FUNCTION sync_post_verification();

-- 7. Test the trigger by checking if it exists
SELECT 
    'Trigger Status' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'sync_post_verification_trigger';

-- 8. Verify RLS policies allow proper access
SELECT 
    'RLS Policies for Posts' as info,
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'posts'
ORDER BY cmd, policyname;

SELECT 'Validation post logic setup complete!' as status;
