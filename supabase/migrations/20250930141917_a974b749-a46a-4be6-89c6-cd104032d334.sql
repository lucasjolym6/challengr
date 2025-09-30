-- Fix submissions RLS policies to allow proper submission creation
DROP POLICY IF EXISTS "Users can create their own submissions" ON public.submissions;

-- Allow authenticated users to insert their own submissions
CREATE POLICY "Users can create their own submissions"
ON public.submissions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Update SELECT policy to be more permissive for viewing
DROP POLICY IF EXISTS "Users can view submissions they have access to" ON public.submissions;

CREATE POLICY "Users can view submissions they have access to"
ON public.submissions
FOR SELECT
TO authenticated
USING (
  -- User can view their own submissions
  auth.uid() = user_id
  OR
  -- Challenge creator can view all submissions for their challenges
  EXISTS (
    SELECT 1 FROM public.challenges c
    WHERE c.id = submissions.challenge_id
    AND c.created_by = auth.uid()
  )
  OR
  -- Users with approved submissions can view other pending submissions for that challenge
  EXISTS (
    SELECT 1 FROM public.submissions s
    WHERE s.user_id = auth.uid()
    AND s.challenge_id = submissions.challenge_id
    AND s.status = 'approved'
  )
);