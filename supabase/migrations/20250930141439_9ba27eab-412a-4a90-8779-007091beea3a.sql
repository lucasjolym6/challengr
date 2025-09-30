-- Add foreign key constraint from submissions to auth.users if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'submissions_user_id_fkey' 
    AND table_name = 'submissions'
  ) THEN
    ALTER TABLE public.submissions
    ADD CONSTRAINT submissions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key constraint from submissions to challenges if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'submissions_challenge_id_fkey' 
    AND table_name = 'submissions'
  ) THEN
    ALTER TABLE public.submissions
    ADD CONSTRAINT submissions_challenge_id_fkey 
    FOREIGN KEY (challenge_id) REFERENCES public.challenges(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Drop and recreate the INSERT policy with simpler logic
DROP POLICY IF EXISTS "Users can create their own submissions" ON public.submissions;

CREATE POLICY "Users can create their own submissions"
ON public.submissions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());