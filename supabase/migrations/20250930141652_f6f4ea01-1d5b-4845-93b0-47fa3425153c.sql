-- Drop and recreate the INSERT policy for public role
DROP POLICY IF EXISTS "Users can create their own submissions" ON public.submissions;

CREATE POLICY "Users can create their own submissions"
ON public.submissions
FOR INSERT
TO public
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);