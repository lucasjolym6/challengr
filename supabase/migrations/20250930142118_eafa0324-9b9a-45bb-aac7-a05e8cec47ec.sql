-- Add foreign key from submissions to profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'submissions_user_id_fkey_profiles'
  ) THEN
    ALTER TABLE public.submissions
    ADD CONSTRAINT submissions_user_id_fkey_profiles
    FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;
END $$;

-- Fix user_challenges INSERT policy to work properly
DROP POLICY IF EXISTS "Users can insert their own challenges" ON public.user_challenges;

CREATE POLICY "Users can insert their own challenges"
ON public.user_challenges
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);