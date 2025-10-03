-- =====================================================
-- UPDATE LEVEL SYSTEM FOR CHALLENGR
-- =====================================================
-- This script updates the level system to be based on points
-- Levels: 1(0-49), 2(50-99), 3(100-199), 4(200-599), 5(600-1199)
--         6(1200-2399), 7(2400-4799), 8(4800-9599), 9(9600-19199), 10(19200+)

-- 1. Create function to calculate level from points
CREATE OR REPLACE FUNCTION public.calculate_level_from_points(total_points INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  CASE 
    WHEN total_points >= 19200 THEN RETURN 10;  -- Godlike
    WHEN total_points >= 9600 THEN RETURN 9;   -- Mythic
    WHEN total_points >= 4800 THEN RETURN 8;   -- Elite
    WHEN total_points >= 2400 THEN RETURN 7;   -- Legend
    WHEN total_points >= 1200 THEN RETURN 6;   -- Champion
    WHEN total_points >= 600 THEN RETURN 5;    -- Master
    WHEN total_points >= 200 THEN RETURN 4;    -- Expert
    WHEN total_points >= 100 THEN RETURN 3;    -- Pro
    WHEN total_points >= 50 THEN RETURN 2;     -- Rookie
    ELSE RETURN 1;                             -- Novice
  END CASE;
END;
$$;

-- 2. Create function to update user level when points change
CREATE OR REPLACE FUNCTION public.update_user_level_on_points_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Calculate new level based on total_points
  NEW.level = public.calculate_level_from_points(NEW.total_points);
  
  -- Update updated_at timestamp
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- 3. Create trigger to automatically update level when total_points changes
DROP TRIGGER IF EXISTS trigger_update_user_level ON public.profiles;
CREATE TRIGGER trigger_update_user_level
  BEFORE UPDATE OF total_points ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_level_on_points_change();

-- 4. Update existing users' levels based on their current points
UPDATE public.profiles 
SET level = public.calculate_level_from_points(total_points)
WHERE level != public.calculate_level_from_points(total_points);

-- 5. Create function to add points to a user (for challenge completion)
CREATE OR REPLACE FUNCTION public.add_user_points(
  user_uuid UUID,
  points_to_add INTEGER
)
RETURNS TABLE(new_total_points INTEGER, new_level INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_points INTEGER;
  new_points INTEGER;
  calculated_level INTEGER;
BEGIN
  -- Get current points
  SELECT total_points INTO current_points
  FROM public.profiles
  WHERE user_id = user_uuid;
  
  -- Calculate new total
  new_points := COALESCE(current_points, 0) + points_to_add;
  
  -- Calculate new level
  calculated_level := public.calculate_level_from_points(new_points);
  
  -- Update the user's profile
  UPDATE public.profiles
  SET 
    total_points = new_points,
    level = calculated_level,
    updated_at = NOW()
  WHERE user_id = user_uuid;
  
  -- Return the new values
  RETURN QUERY SELECT new_points, calculated_level;
END;
$$;

-- 6. Create function to calculate challenge points based on difficulty
CREATE OR REPLACE FUNCTION public.calculate_challenge_points(
  difficulty_level INTEGER,
  base_points INTEGER DEFAULT 10
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  multiplier DECIMAL;
BEGIN
  -- Difficulty multipliers: [1, 1.2, 1.5, 2, 3] for levels 1-5
  CASE difficulty_level
    WHEN 1 THEN multiplier := 1.0;
    WHEN 2 THEN multiplier := 1.2;
    WHEN 3 THEN multiplier := 1.5;
    WHEN 4 THEN multiplier := 2.0;
    WHEN 5 THEN multiplier := 3.0;
    ELSE multiplier := 1.0;
  END CASE;
  
  RETURN ROUND(base_points * multiplier);
END;
$$;

-- 7. Create function to complete a challenge and award points
CREATE OR REPLACE FUNCTION public.complete_challenge_and_award_points(
  user_uuid UUID,
  challenge_uuid UUID
)
RETURNS TABLE(
  points_earned INTEGER,
  new_total_points INTEGER,
  new_level INTEGER,
  level_up BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  old_level INTEGER;
  new_level INTEGER;
  new_total INTEGER;
  challenge_points INTEGER;
  challenge_difficulty INTEGER;
BEGIN
  -- Get current level
  SELECT level INTO old_level
  FROM public.profiles
  WHERE user_id = user_uuid;
  
  -- Get challenge difficulty
  SELECT difficulty_level INTO challenge_difficulty
  FROM public.challenges
  WHERE id = challenge_uuid;
  
  -- Calculate points for this challenge
  challenge_points := public.calculate_challenge_points(challenge_difficulty);
  
  -- Add points and update level
  SELECT new_total_points, new_level INTO new_total, new_level
  FROM public.add_user_points(user_uuid, challenge_points);
  
  -- Update the user_challenges record
  UPDATE public.user_challenges
  SET 
    status = 'completed',
    completed_at = NOW()
  WHERE user_id = user_uuid AND challenge_id = challenge_uuid;
  
  -- Return results
  RETURN QUERY SELECT 
    challenge_points,
    new_total,
    new_level,
    (new_level > old_level) as level_up;
END;
$$;

-- 8. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.calculate_level_from_points(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_user_points(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_challenge_points(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_challenge_and_award_points(UUID, UUID) TO authenticated;

-- 9. Create a view for level information
CREATE OR REPLACE VIEW public.user_level_info AS
SELECT 
  p.user_id,
  p.username,
  p.display_name,
  p.total_points,
  p.level,
  CASE p.level
    WHEN 1 THEN 'Novice'
    WHEN 2 THEN 'Rookie'
    WHEN 3 THEN 'Pro'
    WHEN 4 THEN 'Expert'
    WHEN 5 THEN 'Master'
    WHEN 6 THEN 'Champion'
    WHEN 7 THEN 'Legend'
    WHEN 8 THEN 'Elite'
    WHEN 9 THEN 'Mythic'
    WHEN 10 THEN 'Godlike'
    ELSE 'Unknown'
  END as level_title,
  CASE p.level
    WHEN 1 THEN '⭐'
    WHEN 2 THEN '⭐'
    WHEN 3 THEN '⭐⭐'
    WHEN 4 THEN '⭐⭐⭐'
    WHEN 5 THEN '⭐⭐⭐⭐'
    WHEN 6 THEN '🏆'
    WHEN 7 THEN '👑'
    WHEN 8 THEN '💎'
    WHEN 9 THEN '🔥'
    WHEN 10 THEN '⚡'
    ELSE '⭐'
  END as level_icon,
  -- Calculate progress to next level
  CASE 
    WHEN p.level = 10 THEN 100.0
    WHEN p.level = 9 THEN LEAST(100.0, ((p.total_points - 9600.0) / (19200.0 - 9600.0)) * 100.0)
    WHEN p.level = 8 THEN LEAST(100.0, ((p.total_points - 4800.0) / (9600.0 - 4800.0)) * 100.0)
    WHEN p.level = 7 THEN LEAST(100.0, ((p.total_points - 2400.0) / (4800.0 - 2400.0)) * 100.0)
    WHEN p.level = 6 THEN LEAST(100.0, ((p.total_points - 1200.0) / (2400.0 - 1200.0)) * 100.0)
    WHEN p.level = 5 THEN LEAST(100.0, ((p.total_points - 600.0) / (1200.0 - 600.0)) * 100.0)
    WHEN p.level = 4 THEN LEAST(100.0, ((p.total_points - 200.0) / (600.0 - 200.0)) * 100.0)
    WHEN p.level = 3 THEN LEAST(100.0, ((p.total_points - 100.0) / (200.0 - 100.0)) * 100.0)
    WHEN p.level = 2 THEN LEAST(100.0, ((p.total_points - 50.0) / (100.0 - 50.0)) * 100.0)
    WHEN p.level = 1 THEN LEAST(100.0, ((p.total_points - 0.0) / (50.0 - 0.0)) * 100.0)
    ELSE 0.0
  END as progress_to_next_level,
  -- Calculate points needed for next level
  CASE 
    WHEN p.level = 10 THEN 0
    WHEN p.level = 9 THEN 19200 - p.total_points
    WHEN p.level = 8 THEN 9600 - p.total_points
    WHEN p.level = 7 THEN 4800 - p.total_points
    WHEN p.level = 6 THEN 2400 - p.total_points
    WHEN p.level = 5 THEN 1200 - p.total_points
    WHEN p.level = 4 THEN 600 - p.total_points
    WHEN p.level = 3 THEN 200 - p.total_points
    WHEN p.level = 2 THEN 100 - p.total_points
    WHEN p.level = 1 THEN 50 - p.total_points
    ELSE 0
  END as points_to_next_level
FROM public.profiles p;

-- 10. Grant permissions on the view
GRANT SELECT ON public.user_level_info TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES (OPTIONAL - RUN TO TEST)
-- =====================================================

-- Test level calculation function
-- SELECT level, calculate_level_from_points(level * 100) as calculated_level 
-- FROM generate_series(1, 10) as level;

-- Test points calculation for different difficulties
-- SELECT difficulty, calculate_challenge_points(difficulty) as points
-- FROM generate_series(1, 5) as difficulty;

-- View current user levels
-- SELECT username, total_points, level, level_title, level_icon, progress_to_next_level
-- FROM public.user_level_info
-- ORDER BY total_points DESC
-- LIMIT 10;
