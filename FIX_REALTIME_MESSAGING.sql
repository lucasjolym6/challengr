-- Fix realtime messaging system
-- Run this in your Supabase SQL Editor

-- 1. Ensure messages table is in the realtime publication
-- ========================================================

-- Check current realtime publication tables
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
ORDER BY tablename;

-- Add messages table to realtime publication if not already there
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 2. Check and fix RLS policies for messages table
-- ===============================================

-- List current policies on messages table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'messages';

-- Ensure we have the right policies for realtime to work
-- Users can view their own messages
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;

CREATE POLICY "Users can view their own messages"
ON public.messages 
FOR SELECT
USING (
  auth.uid() = sender_id OR 
  auth.uid() = receiver_id
);

-- Users can send messages to any user (for testing - you can make this more restrictive later)
DROP POLICY IF EXISTS "Users can send messages to any user" ON public.messages;

CREATE POLICY "Users can send messages to any user"
ON public.messages 
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Users can update their own received messages (for read receipts)
DROP POLICY IF EXISTS "Users can mark messages as read" ON public.messages;

CREATE POLICY "Users can mark messages as read"
ON public.messages 
FOR UPDATE
USING (auth.uid() = receiver_id);

-- 3. Enable realtime for related tables
-- ====================================

-- Add other tables that might be needed for realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_friends;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- 4. Create a function to test realtime connectivity
-- ==================================================

CREATE OR REPLACE FUNCTION public.test_realtime_message(
  test_receiver_id UUID,
  test_content TEXT DEFAULT 'Test message'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  message_id UUID;
BEGIN
  -- Insert a test message
  INSERT INTO public.messages (sender_id, receiver_id, content)
  VALUES (auth.uid(), test_receiver_id, test_content)
  RETURNING id INTO message_id;
  
  RETURN message_id;
END;
$$;

-- Grant permission to use the test function
GRANT EXECUTE ON FUNCTION public.test_realtime_message(UUID, TEXT) TO authenticated;

-- 5. Create indexes for better realtime performance
-- ================================================

-- Index for messages queries
CREATE INDEX IF NOT EXISTS idx_messages_realtime_sender 
ON public.messages(sender_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_realtime_receiver 
ON public.messages(receiver_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_realtime_conversation 
ON public.messages(sender_id, receiver_id, created_at DESC);

-- 6. Verify realtime configuration
-- ================================

-- Check if realtime is enabled
SELECT 
    'Realtime Configuration Check' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND tablename = 'messages'
        ) THEN '✅ Messages table is in realtime publication'
        ELSE '❌ Messages table is NOT in realtime publication'
    END as status;

-- Check RLS policies
SELECT 
    'RLS Policies Check' as check_type,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'messages';

-- Test message insertion (replace with actual user IDs for testing)
-- SELECT public.test_realtime_message('your-friend-user-id-here', 'Realtime test message');

SELECT 'Realtime messaging configuration complete!' as status;
SELECT 'Make sure to test with actual user IDs' as note;
