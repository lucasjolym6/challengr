-- =====================================================
-- QUICK LEVEL FIX - Update user levels immediately
-- =====================================================
-- Run this script to immediately fix user levels based on points

-- 1. Create the level calculation function if it doesn't exist
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
    ELSE RETURN 1;                             -- Novice (0-49 points)
  END CASE;
END;
$$;

-- 2. Update all user levels immediately
UPDATE public.profiles 
SET 
  level = public.calculate_level_from_points(COALESCE(total_points, 0)),
  updated_at = NOW()
WHERE level != public.calculate_level_from_points(COALESCE(total_points, 0));

-- 3. Verify the update
SELECT 
  username,
  total_points,
  level,
  CASE level
    WHEN 1 THEN 'Novice (0-49 pts)'
    WHEN 2 THEN 'Rookie (50-99 pts)'
    WHEN 3 THEN 'Pro (100-199 pts)'
    WHEN 4 THEN 'Expert (200-599 pts)'
    WHEN 5 THEN 'Master (600-1199 pts)'
    WHEN 6 THEN 'Champion (1200-2399 pts)'
    WHEN 7 THEN 'Legend (2400-4799 pts)'
    WHEN 8 THEN 'Elite (4800-9599 pts)'
    WHEN 9 THEN 'Mythic (9600-19199 pts)'
    WHEN 10 THEN 'Godlike (19200+ pts)'
  END as level_description
FROM public.profiles
ORDER BY total_points DESC;
