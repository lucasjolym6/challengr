-- Fix RLS policy to allow challenge owners to view submissions to their challenges
DROP POLICY IF EXISTS "Users can view their own challenges" ON public.user_challenges;

-- Users can view their own challenges
CREATE POLICY "Users can view their own challenges"
ON public.user_challenges
FOR SELECT
USING (auth.uid() = user_id);

-- Challenge owners can view all submissions to their challenges (including by other users)
CREATE POLICY "Challenge owners can view submissions to their challenges"
ON public.user_challenges
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.challenges
    WHERE challenges.id = user_challenges.challenge_id
    AND challenges.created_by = auth.uid()
  )
);