-- Add conversation_id column to messages table
ALTER TABLE public.messages 
ADD COLUMN conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE;

-- Create index for conversation_id
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id, created_at DESC);

-- Update messages to use conversation_id instead of sender_id/receiver_id
-- First, let's create a function to update existing messages
CREATE OR REPLACE FUNCTION update_messages_with_conversation_id()
RETURNS VOID AS $$
DECLARE
  message_record RECORD;
  conv_id UUID;
BEGIN
  -- For each message, find the corresponding conversation
  FOR message_record IN 
    SELECT m.id, m.sender_id, m.receiver_id
    FROM public.messages m
    WHERE m.conversation_id IS NULL
  LOOP
    -- Find the conversation for this sender/receiver pair
    SELECT c.id INTO conv_id
    FROM public.conversations c
    JOIN public.conversation_members cm1 ON c.id = cm1.conversation_id AND cm1.user_id = message_record.sender_id
    JOIN public.conversation_members cm2 ON c.id = cm2.conversation_id AND cm2.user_id = message_record.receiver_id
    WHERE c.type = 'individual'
    LIMIT 1;
    
    -- Update the message with the conversation_id
    IF conv_id IS NOT NULL THEN
      UPDATE public.messages 
      SET conversation_id = conv_id
      WHERE id = message_record.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the update function
SELECT update_messages_with_conversation_id();

-- Make conversation_id NOT NULL after migration
ALTER TABLE public.messages 
ALTER COLUMN conversation_id SET NOT NULL;

-- Update policies to use conversation_id
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to friends" ON public.messages;

CREATE POLICY "Users can view messages in their conversations"
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can send messages in their conversations"
ON public.messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
  )
);

-- Update the index to include conversation_id
DROP INDEX IF EXISTS idx_messages_sender_receiver;
CREATE INDEX idx_messages_sender_receiver ON public.messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX idx_messages_conversation_created ON public.messages(conversation_id, created_at DESC);

-- Create function to get unread message count per conversation for a user
CREATE OR REPLACE FUNCTION get_unread_message_count(user_uuid UUID)
RETURNS TABLE(conversation_id UUID, unread_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.conversation_id,
    COUNT(*) as unread_count
  FROM public.messages m
  JOIN public.conversation_members cm ON m.conversation_id = cm.conversation_id
  WHERE cm.user_id = user_uuid
    AND m.sender_id != user_uuid
    AND (m.created_at > cm.last_read_at OR cm.last_read_at IS NULL)
  GROUP BY m.conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_unread_message_count(UUID) TO authenticated;

