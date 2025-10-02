-- Fix all foreign key relationships causing 400 errors
-- Run this in your Supabase SQL Editor

-- 1. Fix challenges -> challenge_categories relationship
-- ==================================================

-- Check if the relationship exists
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='challenges' 
  AND kcu.column_name='category_id';

-- Drop existing constraint if it exists
ALTER TABLE public.challenges 
DROP CONSTRAINT IF EXISTS challenges_category_id_fkey;

-- Add the foreign key constraint properly
ALTER TABLE public.challenges 
ADD CONSTRAINT challenges_category_id_fkey 
FOREIGN KEY (category_id) 
REFERENCES public.challenge_categories(id) 
ON DELETE SET NULL;

-- 2. Fix user_challenges -> challenges relationship
-- ===============================================

-- Check if the relationship exists
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='user_challenges' 
  AND kcu.column_name='challenge_id';

-- Drop existing constraint if it exists
ALTER TABLE public.user_challenges 
DROP CONSTRAINT IF EXISTS user_challenges_challenge_id_fkey;

-- Add the foreign key constraint properly
ALTER TABLE public.user_challenges 
ADD CONSTRAINT user_challenges_challenge_id_fkey 
FOREIGN KEY (challenge_id) 
REFERENCES public.challenges(id) 
ON DELETE CASCADE;

-- 3. Fix user_challenges -> profiles relationship
-- ==============================================

-- Drop existing constraint if it exists
ALTER TABLE public.user_challenges 
DROP CONSTRAINT IF EXISTS user_challenges_user_id_fkey;

-- Add the foreign key constraint properly
ALTER TABLE public.user_challenges 
ADD CONSTRAINT user_challenges_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;

-- 4. Fix posts -> user_challenges relationship
-- ===========================================

-- Drop existing constraint if it exists
ALTER TABLE public.posts 
DROP CONSTRAINT IF EXISTS posts_user_challenge_id_fkey;

-- Add the foreign key constraint properly
ALTER TABLE public.posts 
ADD CONSTRAINT posts_user_challenge_id_fkey 
FOREIGN KEY (user_challenge_id) 
REFERENCES public.user_challenges(id) 
ON DELETE SET NULL;

-- 5. Fix posts -> profiles relationship
-- ====================================

-- Drop existing constraint if it exists
ALTER TABLE public.posts 
DROP CONSTRAINT IF EXISTS posts_user_id_fkey;

-- Add the foreign key constraint properly
ALTER TABLE public.posts 
ADD CONSTRAINT posts_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;

-- 6. Fix comments -> posts relationship
-- ====================================

-- Drop existing constraint if it exists
ALTER TABLE public.comments 
DROP CONSTRAINT IF EXISTS comments_post_id_fkey;

-- Add the foreign key constraint properly
ALTER TABLE public.comments 
ADD CONSTRAINT comments_post_id_fkey 
FOREIGN KEY (post_id) 
REFERENCES public.posts(id) 
ON DELETE CASCADE;

-- 7. Fix comments -> profiles relationship
-- =======================================

-- Drop existing constraint if it exists
ALTER TABLE public.comments 
DROP CONSTRAINT IF EXISTS comments_user_id_fkey;

-- Add the foreign key constraint properly
ALTER TABLE public.comments 
ADD CONSTRAINT comments_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;

-- 8. Fix messages -> challenges relationship
-- =========================================

-- Drop existing constraint if it exists
ALTER TABLE public.messages 
DROP CONSTRAINT IF EXISTS messages_challenge_id_fkey;

-- Add the foreign key constraint properly
ALTER TABLE public.messages 
ADD CONSTRAINT messages_challenge_id_fkey 
FOREIGN KEY (challenge_id) 
REFERENCES public.challenges(id) 
ON DELETE SET NULL;

-- 9. Fix messages -> profiles relationships
-- ========================================

-- Drop existing constraints if they exist
ALTER TABLE public.messages 
DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;

ALTER TABLE public.messages 
DROP CONSTRAINT IF EXISTS messages_receiver_id_fkey;

-- Add the foreign key constraints properly
ALTER TABLE public.messages 
ADD CONSTRAINT messages_sender_id_fkey 
FOREIGN KEY (sender_id) 
REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;

ALTER TABLE public.messages 
ADD CONSTRAINT messages_receiver_id_fkey 
FOREIGN KEY (receiver_id) 
REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;

-- 10. Verify all relationships
-- ============================

SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 11. Test queries that were failing
-- ==================================

-- Test challenges with categories
SELECT 
    c.id,
    c.title,
    cc.name as category_name,
    cc.color as category_color
FROM challenges c
LEFT JOIN challenge_categories cc ON c.category_id = cc.id
LIMIT 5;

-- Test user_challenges with challenges
SELECT 
    uc.id,
    uc.status,
    c.title as challenge_title
FROM user_challenges uc
LEFT JOIN challenges c ON uc.challenge_id = c.id
LIMIT 5;

-- Test posts with user_challenges
SELECT 
    p.id,
    p.content,
    uc.status as challenge_status
FROM posts p
LEFT JOIN user_challenges uc ON p.user_challenge_id = uc.id
LIMIT 5;

SELECT 'All foreign key relationships fixed!' as status;
