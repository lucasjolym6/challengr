-- Add verified column to posts table
ALTER TABLE public.posts ADD COLUMN verified boolean DEFAULT false NOT NULL;

-- Update existing posts to be verified (so they remain visible)
UPDATE public.posts SET verified = true;

-- Create policy for challenge authors to verify posts
CREATE POLICY "Challenge authors can verify posts"
ON public.posts
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_challenges uc
    JOIN public.challenges c ON c.id = uc.challenge_id
    WHERE uc.id = posts.user_challenge_id
    AND c.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_challenges uc
    JOIN public.challenges c ON c.id = uc.challenge_id
    WHERE uc.id = posts.user_challenge_id
    AND c.created_by = auth.uid()
  )
);