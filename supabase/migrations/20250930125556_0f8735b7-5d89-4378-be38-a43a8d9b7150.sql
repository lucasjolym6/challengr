-- Create messages table for friend chat
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT different_users CHECK (sender_id != receiver_id)
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages they sent or received
CREATE POLICY "Users can view their own messages"
ON public.messages FOR SELECT
USING (
  auth.uid() = sender_id OR 
  auth.uid() = receiver_id
);

-- Users can send messages to their friends
CREATE POLICY "Users can send messages to friends"
ON public.messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.user_friends
    WHERE (
      (user_id = sender_id AND friend_id = receiver_id) OR
      (user_id = receiver_id AND friend_id = sender_id)
    ) AND status = 'accepted'
  )
);

-- Users can update their own sent messages (for read receipts)
CREATE POLICY "Users can mark messages as read"
ON public.messages FOR UPDATE
USING (auth.uid() = receiver_id);

-- Create index for faster queries
CREATE INDEX idx_messages_sender_receiver ON public.messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX idx_messages_receiver_unread ON public.messages(receiver_id, read_at) WHERE read_at IS NULL;

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;