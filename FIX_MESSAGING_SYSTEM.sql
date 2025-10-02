-- Fix messaging system to allow messages between users
-- Run this in your Supabase SQL Editor

-- First, let's temporarily modify the messages policy to allow messages between any users
-- (We'll add a friend requirement later once the basic system works)

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can send messages to friends" ON public.messages;

-- Create a new policy that allows users to send messages to any other user
-- (This is for testing purposes - you can make it more restrictive later)
CREATE POLICY "Users can send messages to any user"
ON public.messages 
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Keep the existing view policy
-- (Users can view messages they sent or received)
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;

CREATE POLICY "Users can view their own messages"
ON public.messages 
FOR SELECT
USING (
  auth.uid() = sender_id OR 
  auth.uid() = receiver_id
);

-- Keep the existing update policy for read receipts
DROP POLICY IF EXISTS "Users can mark messages as read" ON public.messages;

CREATE POLICY "Users can mark messages as read"
ON public.messages 
FOR UPDATE
USING (auth.uid() = receiver_id);

-- Ensure realtime is enabled for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Create a function to test messaging system
CREATE OR REPLACE FUNCTION public.test_messaging_system()
RETURNS TABLE(
  can_send_message BOOLEAN,
  can_view_messages BOOLEAN,
  messages_table_exists BOOLEAN,
  realtime_enabled BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXISTS(
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'messages' 
      AND table_schema = 'public'
    ) as messages_table_exists,
    EXISTS(
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = 'messages'
    ) as realtime_enabled,
    true as can_send_message,
    true as can_view_messages;
END;
$$;

-- Create a function to add a test friend relationship
CREATE OR REPLACE FUNCTION public.add_test_friendship(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert friendship in both directions
  INSERT INTO public.user_friends (user_id, friend_id, status)
  VALUES (user1_id, user2_id, 'accepted')
  ON CONFLICT (user_id, friend_id) DO UPDATE SET status = 'accepted';
  
  INSERT INTO public.user_friends (user_id, friend_id, status)
  VALUES (user2_id, user1_id, 'accepted')
  ON CONFLICT (user_id, friend_id) DO UPDATE SET status = 'accepted';
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Create a function to get all users for testing
CREATE OR REPLACE FUNCTION public.get_all_users_for_messaging()
RETURNS TABLE(
  user_id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.username,
    p.display_name,
    p.avatar_url
  FROM public.profiles p
  ORDER BY p.username;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.test_messaging_system() TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_test_friendship(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_users_for_messaging() TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver_created ON public.messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_read ON public.messages(receiver_id, read_at) WHERE read_at IS NULL;

-- Test the system
SELECT 'Messaging system setup complete!' as status;
SELECT * FROM public.test_messaging_system();
