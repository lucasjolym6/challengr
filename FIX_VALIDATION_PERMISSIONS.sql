-- Fix validation permissions for user_challenges table
-- Run this in your Supabase SQL Editor

-- Drop existing policies that might be blocking validators
DROP POLICY IF EXISTS "Users can update their own challenges" ON public.user_challenges;
DROP POLICY IF EXISTS "Users can view their own challenges" ON public.user_challenges;

-- Create new policies that allow validators to update user_challenges
CREATE POLICY "Users can view their own challenges"
ON public.user_challenges
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenges"
ON public.user_challenges
FOR UPDATE
USING (auth.uid() = user_id);

-- Allow validators to update user_challenges for validation purposes
CREATE POLICY "Validators can update user_challenges for validation"
ON public.user_challenges
FOR UPDATE
USING (
  -- Validators can update if they have an approved submission for the same challenge
  EXISTS (
    SELECT 1 FROM public.submissions s
    WHERE s.challenge_id = user_challenges.challenge_id
    AND s.user_id = auth.uid()
    AND s.status = 'approved'
  )
  OR
  -- Challenge creators can validate submissions for their challenges
  EXISTS (
    SELECT 1 FROM public.challenges c
    WHERE c.id = user_challenges.challenge_id
    AND c.created_by = auth.uid()
  )
);

-- Allow validators to insert user_challenges if needed
CREATE POLICY "Validators can insert user_challenges for validation"
ON public.user_challenges
FOR INSERT
WITH CHECK (
  -- Validators can insert if they have an approved submission for the same challenge
  EXISTS (
    SELECT 1 FROM public.submissions s
    WHERE s.challenge_id = user_challenges.challenge_id
    AND s.user_id = auth.uid()
    AND s.status = 'approved'
  )
  OR
  -- Challenge creators can insert for their challenges
  EXISTS (
    SELECT 1 FROM public.challenges c
    WHERE c.id = user_challenges.challenge_id
    AND c.created_by = auth.uid()
  )
  OR
  -- Users can insert their own challenges
  auth.uid() = user_challenges.user_id
);

-- Also ensure submissions table has proper validator update permissions
DROP POLICY IF EXISTS "Users can update their own submissions" ON public.submissions;

CREATE POLICY "Users can update their own submissions"
ON public.submissions
FOR UPDATE
USING (auth.uid() = user_id);

-- Allow validators to update submission status
CREATE POLICY "Validators can update submissions for validation"
ON public.submissions
FOR UPDATE
USING (
  -- Validators can update if they have an approved submission for the same challenge
  EXISTS (
    SELECT 1 FROM public.submissions s
    WHERE s.challenge_id = submissions.challenge_id
    AND s.user_id = auth.uid()
    AND s.status = 'approved'
  )
  OR
  -- Challenge creators can validate submissions for their challenges
  EXISTS (
    SELECT 1 FROM public.challenges c
    WHERE c.id = submissions.challenge_id
    AND c.created_by = auth.uid()
  )
);

-- Allow validators to update posts for verification
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;

CREATE POLICY "Users can update their own posts"
ON public.posts
FOR UPDATE
USING (auth.uid() = user_id);

-- Allow validators to update posts for verification purposes
CREATE POLICY "Validators can update posts for verification"
ON public.posts
FOR UPDATE
USING (
  -- Validators can update posts if they can validate the related user_challenge
  EXISTS (
    SELECT 1 FROM public.user_challenges uc
    JOIN public.challenges c ON c.id = uc.challenge_id
    WHERE uc.id = posts.user_challenge_id
    AND (
      -- Validator is challenge creator
      c.created_by = auth.uid()
      OR
      -- Validator has approved submission for this challenge
      EXISTS (
        SELECT 1 FROM public.submissions s
        WHERE s.challenge_id = uc.challenge_id
        AND s.user_id = auth.uid()
        AND s.status = 'approved'
      )
    )
  )
);

-- Create a function to check if user can validate (for debugging)
CREATE OR REPLACE FUNCTION public.debug_can_validate(user_id_param UUID, challenge_id_param UUID)
RETURNS TABLE(
  is_challenge_creator BOOLEAN,
  has_approved_submission BOOLEAN,
  can_validate BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXISTS(
      SELECT 1 FROM public.challenges 
      WHERE id = challenge_id_param AND created_by = user_id_param
    ) as is_challenge_creator,
    EXISTS(
      SELECT 1 FROM public.submissions s
      WHERE s.challenge_id = challenge_id_param
      AND s.user_id = user_id_param
      AND s.status = 'approved'
    ) as has_approved_submission,
    (
      EXISTS(
        SELECT 1 FROM public.challenges 
        WHERE id = challenge_id_param AND created_by = user_id_param
      )
      OR
      EXISTS(
        SELECT 1 FROM public.submissions s
        WHERE s.challenge_id = challenge_id_param
        AND s.user_id = user_id_param
        AND s.status = 'approved'
      )
    ) as can_validate;
END;
$$;
