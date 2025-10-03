-- Simple script to enable public commenting
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

-- 2. Create missing policies only
-- ==============================

-- User challenges policies
DO $$
BEGIN
    -- Check and create INSERT policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_challenges' 
        AND cmd = 'INSERT'
        AND policyname LIKE '%create%'
    ) THEN
        CREATE POLICY "Authenticated users can create user_challenges"
        ON public.user_challenges
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);
        RAISE NOTICE 'Created user_challenges INSERT policy';
    END IF;
    
    -- Check and create UPDATE policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_challenges' 
        AND cmd = 'UPDATE'
        AND policyname LIKE '%update%'
    ) THEN
        CREATE POLICY "Users can update their own user_challenges"
        ON public.user_challenges
        FOR UPDATE
        USING (auth.uid() = user_id);
        RAISE NOTICE 'Created user_challenges UPDATE policy';
    END IF;
    
    -- Check and create SELECT policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_challenges' 
        AND cmd = 'SELECT'
        AND policyname LIKE '%view%'
    ) THEN
        CREATE POLICY "Users can view their own user_challenges"
        ON public.user_challenges
        FOR SELECT
        USING (auth.uid() = user_id);
        RAISE NOTICE 'Created user_challenges SELECT policy';
    END IF;
END $$;

-- Posts policies
DO $$
BEGIN
    -- Check and create INSERT policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'posts' 
        AND cmd = 'INSERT'
        AND policyname LIKE '%create%'
    ) THEN
        CREATE POLICY "Authenticated users can create posts"
        ON public.posts
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);
        RAISE NOTICE 'Created posts INSERT policy';
    END IF;
    
    -- Check and create SELECT policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'posts' 
        AND cmd = 'SELECT'
        AND policyname LIKE '%view all%'
    ) THEN
        CREATE POLICY "Users can view all posts"
        ON public.posts
        FOR SELECT
        USING (true);
        RAISE NOTICE 'Created posts SELECT policy';
    END IF;
END $$;

-- Comments policies
DO $$
BEGIN
    -- Check and create INSERT policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'comments' 
        AND cmd = 'INSERT'
        AND policyname LIKE '%create%'
    ) THEN
        CREATE POLICY "Authenticated users can create comments"
        ON public.comments
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);
        RAISE NOTICE 'Created comments INSERT policy';
    END IF;
    
    -- Check and create SELECT policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'comments' 
        AND cmd = 'SELECT'
        AND policyname LIKE '%view all%'
    ) THEN
        CREATE POLICY "Users can view all comments"
        ON public.comments
        FOR SELECT
        USING (true);
        RAISE NOTICE 'Created comments SELECT policy';
    END IF;
END $$;

-- 3. Final verification
-- ====================

SELECT 
    'Final Policy Status' as info,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('user_challenges', 'posts', 'comments', 'likes')
GROUP BY tablename
ORDER BY tablename;

SELECT 'Commenting setup complete!' as status;
