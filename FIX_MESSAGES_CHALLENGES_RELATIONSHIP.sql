-- Fix the relationship between messages and challenges tables
-- Run this in your Supabase SQL Editor

-- First, check if the foreign key constraint exists
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
  AND tc.table_name='messages' 
  AND kcu.column_name='challenge_id';

-- Drop existing constraint if it exists
ALTER TABLE public.messages 
DROP CONSTRAINT IF EXISTS messages_challenge_id_fkey;

-- Add the foreign key constraint properly
ALTER TABLE public.messages 
ADD CONSTRAINT messages_challenge_id_fkey 
FOREIGN KEY (challenge_id) 
REFERENCES public.challenges(id) 
ON DELETE SET NULL;

-- Verify the constraint was created
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
  AND tc.table_name='messages' 
  AND kcu.column_name='challenge_id';

-- Test the relationship by trying to fetch messages with challenges
SELECT 
    m.id,
    m.content,
    m.challenge_id,
    c.title as challenge_title
FROM public.messages m
LEFT JOIN public.challenges c ON m.challenge_id = c.id
LIMIT 5;

-- Ensure realtime is properly enabled for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Test realtime subscription
SELECT 'Messages-Challenges relationship fixed!' as status;
