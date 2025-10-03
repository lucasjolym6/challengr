-- Clean script to enable public commenting
-- Run this in your Supabase SQL Editor

-- 1. Check current policies
SELECT 
    'Current Policies' as info,
    tablename,
    policyname, 
    cmd
FROM pg_policies 
WHERE tablename IN ('user_challenges', 'posts', 'comments', 'likes')
ORDER BY tablename, cmd;

-- 2. Drop ALL existing policies and recreate them
-- ================================================

-- Drop all user_challenges policies
DROP POLICY IF EXISTS "Users can create their own challenges" ON public.user_challenges;
DROP POLICY IF EXISTS "Users can update their own challenges" ON public.user_challenges;
DROP POLICY IF EXISTS "Users can view their own user_challenges" ON public.user_challenges;
DROP POLICY IF EXISTS "Authenticated users can create user_challenges" ON public.user_challenges;

-- Drop all posts policies
DROP POLICY IF EXISTS "Users can create their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can view all posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.posts;

-- Drop all comments policies
DROP POLICY IF EXISTS "Users can create their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can view all comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;

-- Drop all likes policies
DROP POLICY IF EXISTS "Users can create their own likes" ON public.likes;
DROP POLICY IF EXISTS "Users can view all likes" ON public.likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON public.likes;
DROP POLICY IF EXISTS "Authenticated users can create likes" ON public.likes;

-- 3. Create clean policies
-- =======================

-- User challenges policies
CREATE POLICY "users_can_create_user_challenges"
ON public.user_challenges
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_user_challenges"
ON public.user_challenges
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "users_can_view_own_user_challenges"
ON public.user_challenges
FOR SELECT
USING (auth.uid() = user_id);

-- Posts policies
CREATE POLICY "users_can_create_posts"
ON public.posts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_view_all_posts"
ON public.posts
FOR SELECT
USING (true);

CREATE POLICY "users_can_update_own_posts"
ON public.posts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "users_can_delete_own_posts"
ON public.posts
FOR DELETE
USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "users_can_create_comments"
ON public.comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_view_all_comments"
ON public.comments
FOR SELECT
USING (true);

CREATE POLICY "users_can_update_own_comments"
ON public.comments
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "users_can_delete_own_comments"
ON public.comments
FOR DELETE
USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "users_can_create_likes"
ON public.likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_view_all_likes"
ON public.likes
FOR SELECT
USING (true);

CREATE POLICY "users_can_delete_own_likes"
ON public.likes
FOR DELETE
USING (auth.uid() = user_id);

-- 4. Verify final policies
-- =======================

SELECT 
    'Final Policy Status' as info,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('user_challenges', 'posts', 'comments', 'likes')
ORDER BY tablename, cmd;

SELECT 
    'Policy Count' as info,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('user_challenges', 'posts', 'comments', 'likes')
GROUP BY tablename
ORDER BY tablename;

SELECT 'Clean commenting setup complete!' as status;
