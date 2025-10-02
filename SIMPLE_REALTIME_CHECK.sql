-- Simple script to check and fix realtime messaging
-- Run this in your Supabase SQL Editor

-- 1. Check current realtime configuration
-- ======================================

SELECT 
    'Current Realtime Tables' as info,
    schemaname,
    tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
ORDER BY tablename;

-- 2. Check RLS policies on messages table
-- ======================================

SELECT 
    'Messages Table Policies' as info,
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'messages';

-- 3. Test if we can insert a message (replace with actual user IDs)
-- ================================================================

-- This will help us test if the messaging system works
-- Replace 'your-user-id-here' with actual user IDs for testing
/*
INSERT INTO public.messages (sender_id, receiver_id, content)
VALUES ('your-user-id-here', 'your-friend-user-id-here', 'Test realtime message')
RETURNING id, created_at;
*/

-- 4. Check if messages table has proper structure
-- ==============================================

SELECT 
    'Messages Table Structure' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Verify foreign key relationships
-- ==================================

SELECT 
    'Foreign Key Relationships' as info,
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
  AND tc.table_name = 'messages'
ORDER BY kcu.column_name;

-- 6. Final status check
-- =====================

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND tablename = 'messages'
        ) THEN '✅ Messages table is in realtime publication'
        ELSE '❌ Messages table is NOT in realtime publication'
    END as realtime_status,
    
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'messages' 
            AND cmd = 'SELECT'
        ) THEN '✅ Messages table has SELECT policies'
        ELSE '❌ Messages table missing SELECT policies'
    END as rls_status,
    
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'messages' 
            AND cmd = 'INSERT'
        ) THEN '✅ Messages table has INSERT policies'
        ELSE '❌ Messages table missing INSERT policies'
    END as insert_status;

SELECT 'Realtime configuration check complete!' as status;
SELECT 'If you see any ❌, you may need to run the full FIX_REALTIME_MESSAGING.sql script' as note;
