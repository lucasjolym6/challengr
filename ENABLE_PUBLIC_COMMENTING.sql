-- Enable public commenting for all authenticated users
-- Run this in your Supabase SQL Editor

-- 1. Fix user_challenges policies to allow anyone to create a record
-- ================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can create their own challenges" ON public.user_challenges;
DROP POLICY IF EXISTS "Users can update their own challenges" ON public.user_challenges;

-- Create new policies that allow any authenticated user to create user_challenges
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

-- 2. Fix posts policies to allow public posting
-- =============================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can create their own posts" ON public.posts;

-- Create new policies that allow any authenticated user to create posts
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

-- 3. Fix comments policies to allow public commenting
-- ==================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can create their own comments" ON public.comments;

-- Create new policies that allow any authenticated user to create comments
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

-- 4. Fix likes policies
-- ====================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can create their own likes" ON public.likes;

-- Create new policies that allow any authenticated user to create likes
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

-- 5. Verify all policies are in place
-- ==================================

SELECT 
    'RLS Policies Status' as info,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('user_challenges', 'posts', 'comments', 'likes')
GROUP BY tablename
ORDER BY tablename;

-- 6. Test policy by checking if user can insert (replace with actual user ID)
-- ===========================================================================

-- This query should return true for any authenticated user
SELECT 
    'Policy Test' as info,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN '✅ User is authenticated'
        ELSE '❌ User is not authenticated'
    END as auth_status;

SELECT 'Public commenting enabled!' as status;
SELECT 'All authenticated users can now create posts and comments' as note;
