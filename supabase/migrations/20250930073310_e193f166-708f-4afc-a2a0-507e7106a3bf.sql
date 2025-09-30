-- Update the can_validate_challenge function to check if user is challenge creator OR has completed the challenge
CREATE OR REPLACE FUNCTION public.can_validate_challenge(validator_user_id uuid, challenge_id_param uuid, submission_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  validator_completed_count INTEGER;
  validator_total_completed INTEGER;
  min_required INTEGER;
  is_challenge_creator BOOLEAN;
BEGIN
  -- Cannot validate own submission
  IF validator_user_id = submission_user_id THEN
    RETURN FALSE;
  END IF;
  
  -- Check if validator is the challenge creator
  SELECT EXISTS(
    SELECT 1 FROM public.challenges 
    WHERE id = challenge_id_param AND created_by = validator_user_id
  ) INTO is_challenge_creator;
  
  -- If validator is the challenge creator, they can validate
  IF is_challenge_creator THEN
    RETURN TRUE;
  END IF;
  
  -- Get minimum required challenges from config
  SELECT COALESCE((value::TEXT)::INTEGER, 3) INTO min_required 
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
$$;