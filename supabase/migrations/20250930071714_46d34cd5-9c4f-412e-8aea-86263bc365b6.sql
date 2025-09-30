-- Create admin configuration table
CREATE TABLE public.admin_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default configuration values
INSERT INTO public.admin_config (key, value, description) VALUES
('validator_min_completed_challenges', '3', 'Minimum completed challenges required to become a validator'),
('validation_response_days', '7', 'Days validators have to respond before escalation'),
('validator_daily_limit', '20', 'Maximum validations per validator per day'),
('points_for_validator', '5', 'Points awarded to validators for each validation'),
('community_votes_required', '3', 'Number of community votes required for auto-approval');

-- Create validation audit log table
CREATE TABLE public.validation_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_challenge_id UUID NOT NULL REFERENCES public.user_challenges(id) ON DELETE CASCADE,
  validator_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'requested_edits', 'escalated')),
  reason TEXT,
  comment TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create validator notifications table
CREATE TABLE public.validator_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_challenge_id UUID NOT NULL REFERENCES public.user_challenges(id) ON DELETE CASCADE,
  validator_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('new_submission', 'reminder', 'escalation')),
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reports table for flagging submissions
CREATE TABLE public.submission_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_challenge_id UUID NOT NULL REFERENCES public.user_challenges(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validation_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validator_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin_config (admins only for now, but readable by all)
CREATE POLICY "Everyone can view admin config" 
ON public.admin_config FOR SELECT USING (true);

-- RLS policies for validation_audit (viewable by submitter and validator)
CREATE POLICY "Users can view validation audit for their submissions" 
ON public.validation_audit FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_challenges uc 
    WHERE uc.id = validation_audit.user_challenge_id 
    AND uc.user_id = auth.uid()
  ) 
  OR validator_id = auth.uid()
);

CREATE POLICY "Validators can insert audit entries" 
ON public.validation_audit FOR INSERT 
WITH CHECK (validator_id = auth.uid());

-- RLS policies for validator_notifications
CREATE POLICY "Users can view their own validator notifications" 
ON public.validator_notifications FOR SELECT 
USING (validator_id = auth.uid());

CREATE POLICY "System can insert validator notifications" 
ON public.validator_notifications FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own validator notifications" 
ON public.validator_notifications FOR UPDATE 
USING (validator_id = auth.uid());

-- RLS policies for submission_reports
CREATE POLICY "Users can view reports they created" 
ON public.submission_reports FOR SELECT 
USING (reporter_id = auth.uid());

CREATE POLICY "Users can create reports" 
ON public.submission_reports FOR INSERT 
WITH CHECK (reporter_id = auth.uid());

-- Add indexes for performance
CREATE INDEX idx_validation_audit_user_challenge_id ON public.validation_audit(user_challenge_id);
CREATE INDEX idx_validation_audit_validator_id ON public.validation_audit(validator_id);
CREATE INDEX idx_validation_audit_created_at ON public.validation_audit(created_at);
CREATE INDEX idx_validator_notifications_validator_id ON public.validator_notifications(validator_id);
CREATE INDEX idx_validator_notifications_read_at ON public.validator_notifications(read_at);
CREATE INDEX idx_submission_reports_user_challenge_id ON public.submission_reports(user_challenge_id);
CREATE INDEX idx_submission_reports_status ON public.submission_reports(status);

-- Add triggers for timestamp updates
CREATE TRIGGER update_admin_config_updated_at
BEFORE UPDATE ON public.admin_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update user_challenges table to add more validation fields
ALTER TABLE public.user_challenges 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS validator_comment TEXT,
ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS appeal_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS appeal_reason TEXT;

-- Function to check if user can validate a challenge
CREATE OR REPLACE FUNCTION public.can_validate_challenge(
  validator_user_id UUID,
  challenge_id_param UUID,
  submission_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  validator_completed_count INTEGER;
  validator_total_completed INTEGER;
  min_required INTEGER;
BEGIN
  -- Cannot validate own submission
  IF validator_user_id = submission_user_id THEN
    RETURN FALSE;
  END IF;
  
  -- Get minimum required challenges from config
  SELECT (value::TEXT)::INTEGER INTO min_required 
  FROM public.admin_config 
  WHERE key = 'validator_min_completed_challenges';
  
  -- Check if validator has completed this specific challenge
  SELECT COUNT(*) INTO validator_completed_count
  FROM public.user_challenges uc
  WHERE uc.user_id = validator_user_id 
    AND uc.challenge_id = challenge_id_param 
    AND uc.status = 'completed' 
    AND uc.validation_status = 'approved';
  
  -- Check validator's total completed challenges
  SELECT COUNT(*) INTO validator_total_completed
  FROM public.user_challenges uc
  WHERE uc.user_id = validator_user_id 
    AND uc.status = 'completed' 
    AND uc.validation_status = 'approved';
  
  -- Must have completed this challenge at least once AND meet minimum threshold
  RETURN (validator_completed_count > 0 AND validator_total_completed >= min_required);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;