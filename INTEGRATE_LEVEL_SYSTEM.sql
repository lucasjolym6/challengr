-- =====================================================
-- INTEGRATE LEVEL SYSTEM WITH EXISTING CHALLENGES
-- =====================================================
-- This script integrates the new level system with existing challenges

-- 1. Update existing challenges to have proper points_reward based on difficulty
UPDATE public.challenges 
SET points_reward = public.calculate_challenge_points(difficulty_level)
WHERE points_reward IS NULL OR points_reward = 10;

-- 2. Create a function to automatically award points when a challenge is completed
CREATE OR REPLACE FUNCTION public.handle_challenge_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  challenge_difficulty INTEGER;
  points_to_award INTEGER;
  old_level INTEGER;
  new_level INTEGER;
BEGIN
  -- Only process when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Get challenge difficulty
    SELECT difficulty_level INTO challenge_difficulty
    FROM public.challenges
    WHERE id = NEW.challenge_id;
    
    -- Calculate points to award
    points_to_award := public.calculate_challenge_points(challenge_difficulty);
    
    -- Get current level
    SELECT level INTO old_level
    FROM public.profiles
    WHERE user_id = NEW.user_id;
    
    -- Add points and update level
    SELECT new_level INTO new_level
    FROM public.add_user_points(NEW.user_id, points_to_award);
    
    -- Log the completion (optional - for analytics)
    INSERT INTO public.challenge_completions_log (
      user_id,
      challenge_id,
      points_awarded,
      old_level,
      new_level,
      completed_at
    ) VALUES (
      NEW.user_id,
      NEW.challenge_id,
      points_to_award,
      old_level,
      new_level,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Create log table for challenge completions (optional)
CREATE TABLE IF NOT EXISTS public.challenge_completions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  points_awarded INTEGER NOT NULL,
  old_level INTEGER NOT NULL,
  new_level INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on the log table
ALTER TABLE public.challenge_completions_log ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own completion logs
CREATE POLICY "Users can view their own completion logs"
ON public.challenge_completions_log
FOR SELECT
USING (auth.uid() = user_id);

-- 4. Create trigger to automatically award points on challenge completion
DROP TRIGGER IF EXISTS trigger_award_points_on_completion ON public.user_challenges;
CREATE TRIGGER trigger_award_points_on_completion
  AFTER UPDATE OF status ON public.user_challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_challenge_completion();

-- 5. Award points for existing completed challenges (one-time migration)
DO $$
DECLARE
  completion_record RECORD;
  points_to_award INTEGER;
BEGIN
  -- Loop through all existing completed challenges
  FOR completion_record IN 
    SELECT uc.user_id, uc.challenge_id, c.difficulty_level
    FROM public.user_challenges uc
    JOIN public.challenges c ON uc.challenge_id = c.id
    WHERE uc.status = 'completed'
  LOOP
    -- Calculate points for this completion
    points_to_award := public.calculate_challenge_points(completion_record.difficulty_level);
    
    -- Award points (this will also update the level)
    PERFORM public.add_user_points(completion_record.user_id, points_to_award);
  END LOOP;
  
  RAISE NOTICE 'Awarded points for % existing completed challenges', 
    (SELECT COUNT(*) FROM public.user_challenges WHERE status = 'completed');
END $$;

-- 6. Create a view for leaderboard with level information
CREATE OR REPLACE VIEW public.leaderboard_with_levels AS
SELECT 
  uli.*,
  COALESCE(completed_count.count, 0) as completed_challenges,
  ROW_NUMBER() OVER (ORDER BY uli.total_points DESC) as rank
FROM public.user_level_info uli
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) as count
  FROM public.user_challenges
  WHERE status = 'completed'
  GROUP BY user_id
) completed_count ON uli.user_id = completed_count.user_id
ORDER BY uli.total_points DESC;

-- Grant permissions on the leaderboard view
GRANT SELECT ON public.leaderboard_with_levels TO authenticated;

-- 7. Create function to get user's recent level ups
CREATE OR REPLACE FUNCTION public.get_user_recent_level_ups(user_uuid UUID, limit_count INTEGER DEFAULT 5)
RETURNS TABLE(
  old_level INTEGER,
  new_level INTEGER,
  points_awarded INTEGER,
  challenge_title TEXT,
  completed_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ccl.old_level,
    ccl.new_level,
    ccl.points_awarded,
    c.title as challenge_title,
    ccl.completed_at
  FROM public.challenge_completions_log ccl
  JOIN public.challenges c ON ccl.challenge_id = c.id
  WHERE ccl.user_id = user_uuid
    AND ccl.old_level < ccl.new_level  -- Only level ups
  ORDER BY ccl.completed_at DESC
  LIMIT limit_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_recent_level_ups(UUID, INTEGER) TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check current leaderboard
-- SELECT username, total_points, level, level_title, completed_challenges, rank
-- FROM public.leaderboard_with_levels
-- ORDER BY rank
-- LIMIT 10;

-- Check level distribution
-- SELECT level, level_title, COUNT(*) as user_count
-- FROM public.user_level_info
-- GROUP BY level, level_title
-- ORDER BY level;

-- Check recent level ups for a specific user (replace with actual user ID)
-- SELECT * FROM public.get_user_recent_level_ups('your-user-id'::UUID);
