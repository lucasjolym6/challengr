-- COMPLETE DATABASE SETUP FOR CHALLENGR
-- Run this entire script in your Supabase SQL Editor

-- ========================================
-- 1. CREATE CHALLENGE_CATEGORIES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.challenge_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.challenge_categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY IF NOT EXISTS "Everyone can view challenge categories" 
ON public.challenge_categories 
FOR SELECT 
USING (true);

CREATE POLICY IF NOT EXISTS "Admin can manage categories" 
ON public.challenge_categories 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Insert default categories
INSERT INTO public.challenge_categories (name, icon, color, description) VALUES
  ('Sports', '🏃‍♂️', '#FF6B6B', 'Physical activities and sports challenges'),
  ('Drawing', '🎨', '#4ECDC4', 'Art and creative drawing challenges'),
  ('Music', '🎵', '#45B7D1', 'Music and sound-related challenges'),
  ('Cooking', '👨‍🍳', '#96CEB4', 'Culinary and cooking challenges'),
  ('Writing', '✍️', '#FFEAA7', 'Writing and literature challenges'),
  ('Coding', '💻', '#DDA0DD', 'Programming and coding challenges'),
  ('Gardening', '🌱', '#98D8C8', 'Gardening and plant care challenges')
ON CONFLICT (name) DO NOTHING;

-- ========================================
-- 2. CREATE SUBMISSIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  proof_text TEXT,
  proof_image_url TEXT,
  proof_video_url TEXT,
  validator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  validator_comment TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  validated_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, challenge_id)
);

-- Enable RLS
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for submissions
CREATE POLICY IF NOT EXISTS "Users can view their own submissions" 
ON public.submissions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can create their own submissions" 
ON public.submissions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own submissions" 
ON public.submissions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Challenge creators can view submissions for their challenges"
ON public.submissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.challenges c 
    WHERE c.id = submissions.challenge_id 
    AND c.created_by = auth.uid()
  )
);

CREATE POLICY IF NOT EXISTS "Qualified validators can view submissions"
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
CREATE INDEX IF NOT EXISTS idx_submissions_challenge_id ON public.submissions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON public.submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_validator_id ON public.submissions(validator_id);

-- ========================================
-- 3. FIX FOREIGN KEY CONSTRAINTS
-- ========================================

-- Fix challenges table foreign key
ALTER TABLE public.challenges 
DROP CONSTRAINT IF EXISTS challenges_category_id_fkey;

ALTER TABLE public.challenges 
ADD CONSTRAINT challenges_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES public.challenge_categories(id);

-- Fix user_challenges table foreign key
ALTER TABLE public.user_challenges 
DROP CONSTRAINT IF EXISTS user_challenges_user_id_fkey;

ALTER TABLE public.user_challenges 
ADD CONSTRAINT user_challenges_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- ========================================
-- 4. CREATE SAMPLE DATA
-- ========================================

-- Create sample challenges if none exist
DO $$
DECLARE
  sports_cat_id UUID;
  drawing_cat_id UUID;
  coding_cat_id UUID;
  admin_user_id UUID;
BEGIN
  -- Get category IDs
  SELECT id INTO sports_cat_id FROM public.challenge_categories WHERE name = 'Sports' LIMIT 1;
  SELECT id INTO drawing_cat_id FROM public.challenge_categories WHERE name = 'Drawing' LIMIT 1;
  SELECT id INTO coding_cat_id FROM public.challenge_categories WHERE name = 'Coding' LIMIT 1;
  
  -- Get admin user ID (first user)
  SELECT user_id INTO admin_user_id FROM public.profiles LIMIT 1;
  
  -- Insert sample challenges only if none exist
  IF NOT EXISTS (SELECT 1 FROM public.challenges LIMIT 1) THEN
    INSERT INTO public.challenges (title, description, category_id, difficulty_level, points_reward, type, is_active, created_by) VALUES
      ('Run 5K', 'Complete a 5 kilometer run in under 30 minutes. Take a photo at the finish line.', sports_cat_id, 3, 50, 'community', true, admin_user_id),
      ('Draw a Portrait', 'Create a portrait drawing of someone you know. Share your artwork.', drawing_cat_id, 2, 30, 'community', true, admin_user_id),
      ('Build a React Component', 'Create a reusable React component with TypeScript and proper styling.', coding_cat_id, 3, 60, 'community', true, admin_user_id),
      ('Learn a New Song', 'Learn to play or sing a complete song on your instrument of choice.', drawing_cat_id, 2, 40, 'community', true, admin_user_id),
      ('Write a Short Story', 'Write a creative short story of at least 500 words.', drawing_cat_id, 2, 35, 'community', true, admin_user_id);
  END IF;
END $$;

-- ========================================
-- 5. VERIFICATION
-- ========================================

-- Check that everything was created successfully
SELECT 'Categories created:' as info, COUNT(*) as count FROM public.challenge_categories;
SELECT 'Challenges created:' as info, COUNT(*) as count FROM public.challenges;
SELECT 'Submissions table exists:' as info, CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'submissions') THEN 'YES' ELSE 'NO' END;

-- Show sample data
SELECT 'Sample categories:' as info;
SELECT name, icon, color FROM public.challenge_categories LIMIT 5;

SELECT 'Sample challenges:' as info;
SELECT c.title, cc.name as category FROM public.challenges c 
LEFT JOIN public.challenge_categories cc ON c.category_id = cc.id 
LIMIT 5;
