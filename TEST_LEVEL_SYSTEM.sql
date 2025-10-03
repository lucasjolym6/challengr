-- =====================================================
-- TEST LEVEL SYSTEM
-- =====================================================
-- Run this script to test the level system functionality

-- 1. Test level calculation function
SELECT 
  'Level Calculation Test' as test_name,
  level,
  CASE 
    WHEN level = 1 THEN '0-49'
    WHEN level = 2 THEN '50-99'
    WHEN level = 3 THEN '100-199'
    WHEN level = 4 THEN '200-599'
    WHEN level = 5 THEN '600-1199'
    WHEN level = 6 THEN '1200-2399'
    WHEN level = 7 THEN '2400-4799'
    WHEN level = 8 THEN '4800-9599'
    WHEN level = 9 THEN '9600-19199'
    WHEN level = 10 THEN '19200+'
  END as points_range,
  calculate_level_from_points(level * 100) as calculated_level
FROM generate_series(1, 10) as level;

-- 2. Test challenge points calculation
SELECT 
  'Challenge Points Test' as test_name,
  difficulty,
  calculate_challenge_points(difficulty) as points_earned
FROM generate_series(1, 5) as difficulty;

-- 3. Test specific point values
SELECT 
  'Specific Points Test' as test_name,
  points,
  calculate_level_from_points(points) as level,
  CASE calculate_level_from_points(points)
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
  END as level_title
FROM (VALUES (0), (25), (50), (75), (100), (150), (200), (400), (600), (900), (1200), (1800), (2400), (3600), (4800), (7200), (9600), (14400), (19200), (25000)) as test_points(points);

-- 4. View current user levels (if any users exist)
SELECT 
  'Current Users Test' as test_name,
  username,
  total_points,
  level,
  level_title,
  progress_to_next_level,
  points_to_next_level
FROM public.user_level_info
ORDER BY total_points DESC
LIMIT 5;

-- 5. Test adding points to a user (replace 'test-user-id' with actual user ID)
-- SELECT * FROM public.add_user_points('test-user-id'::UUID, 50);

-- 6. Test completing a challenge (replace IDs with actual IDs)
-- SELECT * FROM public.complete_challenge_and_award_points('test-user-id'::UUID, 'test-challenge-id'::UUID);
