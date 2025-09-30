-- Drop existing problematic policies
DROP POLICY IF EXISTS "Challenge creators can view submissions for their challenges" ON public.submissions;
DROP POLICY IF EXISTS "Qualified validators can view submissions" ON public.submissions;
DROP POLICY IF EXISTS "Users can create their own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Users can update their own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Users can view their own submissions" ON public.submissions;

-- Create security definer function to check if user can view a submission
CREATE OR REPLACE FUNCTION public.can_view_submission(_user_id uuid, _submission_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_submission_user_id uuid;
  v_challenge_creator_id uuid;
  v_challenge_id uuid;
  v_has_approved_submission boolean;
BEGIN
  -- Get submission details
  SELECT user_id, challenge_id 
  INTO v_submission_user_id, v_challenge_id
  FROM public.submissions
  WHERE id = _submission_id;
  
  -- User can view their own submissions
  IF _user_id = v_submission_user_id THEN
    RETURN true;
  END IF;
  
  -- Get challenge creator
  SELECT created_by INTO v_challenge_creator_id
  FROM public.challenges
  WHERE id = v_challenge_id;
  
  -- Challenge creator can view all submissions
  IF _user_id = v_challenge_creator_id THEN
    RETURN true;
  END IF;
  
  -- Check if user has approved submission for this challenge
  SELECT EXISTS(
    SELECT 1 FROM public.submissions
    WHERE user_id = _user_id
    AND challenge_id = v_challenge_id
    AND status = 'approved'
  ) INTO v_has_approved_submission;
  
  RETURN v_has_approved_submission;
END;
$$;

-- Create new RLS policies using the security definer function
CREATE POLICY "Users can view submissions they have access to"
ON public.submissions
FOR SELECT
USING (public.can_view_submission(auth.uid(), id));

CREATE POLICY "Users can create their own submissions"
ON public.submissions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own submissions"
ON public.submissions
FOR UPDATE
USING (auth.uid() = user_id);

-- Allow challenge creators and validators to update submissions
CREATE POLICY "Validators can update submissions"
ON public.submissions
FOR UPDATE
USING (
  public.can_view_submission(auth.uid(), id) 
  AND auth.uid() != user_id
);