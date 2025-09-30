-- Create submissions table
CREATE TABLE public.submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  proof_text text,
  proof_image_url text,
  proof_video_url text,
  validator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  validator_comment text,
  rejection_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  validated_at timestamp with time zone,
  UNIQUE(user_id, challenge_id)
);

-- Enable RLS
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for submissions
CREATE POLICY "Users can view their own submissions" 
ON public.submissions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own submissions" 
ON public.submissions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own submissions" 
ON public.submissions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Challenge creators can view submissions for their challenges"
ON public.submissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.challenges c 
    WHERE c.id = submissions.challenge_id 
    AND c.created_by = auth.uid()
  )
);

CREATE POLICY "Qualified validators can view submissions"
ON public.submissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.submissions s2
    WHERE s2.challenge_id = submissions.challenge_id
    AND s2.user_id = auth.uid()
    AND s2.status = 'approved'
  )
);

-- Create indexes
CREATE INDEX idx_submissions_challenge_id ON public.submissions(challenge_id);
CREATE INDEX idx_submissions_user_id ON public.submissions(user_id);
CREATE INDEX idx_submissions_status ON public.submissions(status);
CREATE INDEX idx_submissions_validator_id ON public.submissions(validator_id);

-- Add trigger for updated_at
CREATE TRIGGER update_submissions_updated_at
BEFORE UPDATE ON public.submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check if user can validate submissions
CREATE OR REPLACE FUNCTION public.can_validate_submission(validator_user_id uuid, submission_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  submission_record RECORD;
  is_challenge_creator BOOLEAN;
  has_approved_submission BOOLEAN;
  min_required INTEGER;
  validator_total_completed INTEGER;
BEGIN
  -- Get submission details
  SELECT s.user_id, s.challenge_id INTO submission_record
  FROM public.submissions s
  WHERE s.id = submission_id_param;
  
  -- Cannot validate own submission
  IF validator_user_id = submission_record.user_id THEN
    RETURN FALSE;
  END IF;
  
  -- Check if validator is the challenge creator
  SELECT EXISTS(
    SELECT 1 FROM public.challenges 
    WHERE id = submission_record.challenge_id AND created_by = validator_user_id
  ) INTO is_challenge_creator;
  
  -- If validator is the challenge creator, they can validate
  IF is_challenge_creator THEN
    RETURN TRUE;
  END IF;
  
  -- Check if validator has an approved submission for this challenge
  SELECT EXISTS(
    SELECT 1 FROM public.submissions s
    WHERE s.user_id = validator_user_id 
    AND s.challenge_id = submission_record.challenge_id 
    AND s.status = 'approved'
  ) INTO has_approved_submission;
  
  -- Get minimum required challenges from config
  SELECT COALESCE((value::TEXT)::INTEGER, 3) INTO min_required 
  FROM public.admin_config 
  WHERE key = 'validator_min_completed_challenges';
  
  -- Check validator's total approved submissions
  SELECT COUNT(*) INTO validator_total_completed
  FROM public.submissions s
  WHERE s.user_id = validator_user_id 
  AND s.status = 'approved';
  
  -- Must have approved submission for this challenge AND meet minimum threshold
  RETURN (has_approved_submission AND validator_total_completed >= min_required);
END;
$$;

-- Update validation_audit table to reference submissions instead of user_challenges
ALTER TABLE public.validation_audit 
DROP CONSTRAINT IF EXISTS validation_audit_user_challenge_id_fkey;

ALTER TABLE public.validation_audit 
ADD COLUMN submission_id uuid REFERENCES public.submissions(id) ON DELETE CASCADE;

-- Update validator_notifications to reference submissions
ALTER TABLE public.validator_notifications 
ADD COLUMN submission_id uuid REFERENCES public.submissions(id) ON DELETE CASCADE;

-- Update submission_reports to reference submissions directly
ALTER TABLE public.submission_reports 
DROP CONSTRAINT IF EXISTS submission_reports_user_challenge_id_fkey;

ALTER TABLE public.submission_reports 
ADD COLUMN submission_id uuid REFERENCES public.submissions(id) ON DELETE CASCADE;