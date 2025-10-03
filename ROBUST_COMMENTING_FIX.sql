-- Robust script to enable public commenting
-- Run this in your Supabase SQL Editor

-- 1. Check current policies
-- ========================

SELECT 
    'Current Policies' as info,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('user_challenges', 'posts', 'comments', 'likes')
ORDER BY tablename, cmd;

-- 2. Drop and recreate policies properly
-- =====================================

-- User challenges policies
DROP POLICY IF EXISTS "Users can create their own challenges" ON public.user_challenges;
DROP POLICY IF EXISTS "Users can update their own challenges" ON public.user_challenges;
DROP POLICY IF EXISTS "Users can view their own user_challenges" ON public.user_challenges;

CREATE POLICY "Authenticated users can create user_challenges"
ON public.user_challenges
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own user_challenges"
ON public.user_challenges
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own user_challenges"
ON public.user_challenges
FOR SELECT
USING (auth.uid() = user_id);

-- Posts policies
DROP POLICY IF EXISTS "Users can create their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can view all posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;

CREATE POLICY "Authenticated users can create posts"
ON public.posts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all posts"
ON public.posts
FOR SELECT
USING (true);

CREATE POLICY "Users can update their own posts"
ON public.posts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
ON public.posts
FOR DELETE
USING (auth.uid() = user_id);

-- Comments policies
DROP POLICY IF EXISTS "Users can create their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can view all comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;

CREATE POLICY "Authenticated users can create comments"
ON public.comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all comments"
ON public.comments
FOR SELECT
USING (true);

CREATE POLICY "Users can update their own comments"
ON public.comments
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.comments
FOR DELETE
USING (auth.uid() = user_id);

-- Likes policies
DROP POLICY IF EXISTS "Users can create their own likes" ON public.likes;
DROP POLICY IF EXISTS "Users can view all likes" ON public.likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON public.likes;

CREATE POLICY "Authenticated users can create likes"
ON public.likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all likes"
ON public.likes
FOR SELECT
USING (true);

CREATE POLICY "Users can delete their own likes"
ON public.likes
FOR DELETE
USING (auth.uid() = user_id);

-- 3. Verify all policies are created
-- ==================================

SELECT 
    'Final Policy Status' as info,
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename IN ('user_challenges', 'posts', 'comments', 'likes')
ORDER BY tablename, cmd;

-- 4. Count policies per table
-- ===========================

SELECT 
    'Policy Count' as info,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('user_challenges', 'posts', 'comments', 'likes')
GROUP BY tablename
ORDER BY tablename;

-- 5. Test authentication check
-- ============================

SELECT 
    'Authentication Test' as info,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN '✅ User is authenticated'
        ELSE '❌ User is not authenticated'
    END as auth_status;

SELECT 'Public commenting setup complete!' as status;
