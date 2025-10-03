-- Create conversations table for individual and group chats
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT, -- NULL for individual chats, set for group chats
  type TEXT NOT NULL DEFAULT 'individual', -- 'individual' or 'group'
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT conversation_type_check CHECK (type IN ('individual', 'group'))
);

-- Create conversation_members table
CREATE TABLE public.conversation_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- Create group_conversation_settings table for group-specific settings
CREATE TABLE public.group_conversation_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  allow_member_invites BOOLEAN DEFAULT true,
  only_admins_can_send_messages BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(conversation_id)
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_conversation_settings ENABLE ROW LEVEL SECURITY;

-- Policies for conversations
CREATE POLICY "Users can view conversations they are members of"
ON public.conversations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update conversations they created"
ON public.conversations FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete conversations they created"
ON public.conversations FOR DELETE
USING (auth.uid() = created_by);

-- Policies for conversation_members
CREATE POLICY "Users can view conversation members for their conversations"
ON public.conversation_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_members cm
    WHERE cm.conversation_id = conversation_id AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can add members to conversations they created"
ON public.conversation_members FOR INSERT
WITH CHECK (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = conversation_id AND created_by = auth.uid()
  )
);

CREATE POLICY "Users can update their own conversation membership"
ON public.conversation_members FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can leave conversations"
ON public.conversation_members FOR DELETE
USING (auth.uid() = user_id);

-- Policies for group_conversation_settings
CREATE POLICY "Users can view group settings for their conversations"
ON public.group_conversation_settings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = conversations.id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update group settings for conversations they created"
ON public.group_conversation_settings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = conversation_id AND created_by = auth.uid()
  )
);

CREATE POLICY "Users can create group settings for conversations they created"
ON public.group_conversation_settings FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = conversation_id AND created_by = auth.uid()
  )
);

-- Create indexes for better performance
CREATE INDEX idx_conversations_created_by ON public.conversations(created_by);
CREATE INDEX idx_conversations_type ON public.conversations(type);
CREATE INDEX idx_conversation_members_conversation_id ON public.conversation_members(conversation_id);
CREATE INDEX idx_conversation_members_user_id ON public.conversation_members(user_id);
CREATE INDEX idx_conversation_members_last_read ON public.conversation_members(user_id, last_read_at);

-- Enable realtime for conversations
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_members;

-- Create function to automatically create group settings when creating a group conversation
CREATE OR REPLACE FUNCTION create_group_settings()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'group' THEN
    INSERT INTO public.group_conversation_settings (conversation_id)
    VALUES (NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_group_settings_trigger
  AFTER INSERT ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION create_group_settings();

-- Create function to migrate existing individual conversations to the new system
CREATE OR REPLACE FUNCTION migrate_existing_conversations()
RETURNS VOID AS $$
DECLARE
  message_record RECORD;
  conversation_id UUID;
  user1_id UUID;
  user2_id UUID;
BEGIN
  -- Get all unique pairs of users who have exchanged messages
  FOR message_record IN 
    SELECT DISTINCT 
      LEAST(sender_id, receiver_id) as user1_id,
      GREATEST(sender_id, receiver_id) as user2_id
    FROM public.messages
    WHERE sender_id IS NOT NULL AND receiver_id IS NOT NULL
  LOOP
    user1_id := message_record.user1_id;
    user2_id := message_record.user2_id;
    
    -- Create conversation for this pair
    INSERT INTO public.conversations (type, created_by)
    VALUES ('individual', user1_id)
    RETURNING id INTO conversation_id;
    
    -- Add both users as members
    INSERT INTO public.conversation_members (conversation_id, user_id)
    VALUES (conversation_id, user1_id), (conversation_id, user2_id);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the migration function
SELECT migrate_existing_conversations();

