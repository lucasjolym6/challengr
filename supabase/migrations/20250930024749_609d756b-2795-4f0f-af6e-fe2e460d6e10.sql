-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  skills TEXT[],
  level INTEGER DEFAULT 1,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create challenge categories table
CREATE TABLE public.challenge_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create challenges table
CREATE TABLE public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.challenge_categories(id),
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  points_reward INTEGER DEFAULT 10,
  is_custom BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(user_id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user challenges (progress tracking)
CREATE TABLE public.user_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'to_do' CHECK (status IN ('to_do', 'in_progress', 'completed')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  proof_text TEXT,
  proof_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

-- Create posts table for sharing challenge results
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  user_challenge_id UUID REFERENCES public.user_challenges(id) ON DELETE CASCADE,
  content TEXT,
  image_url TEXT,
  hashtags TEXT[],
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create likes table
CREATE TABLE public.likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Create comments table
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create badges table
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  points_required INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user badges (earned badges)
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for challenge categories (public read)
CREATE POLICY "Everyone can view challenge categories" ON public.challenge_categories FOR SELECT USING (true);

-- RLS Policies for challenges
CREATE POLICY "Everyone can view active challenges" ON public.challenges FOR SELECT USING (is_active = true);
CREATE POLICY "Users can create custom challenges" ON public.challenges FOR INSERT WITH CHECK (auth.uid() = created_by AND is_custom = true);

-- RLS Policies for user challenges
CREATE POLICY "Users can view their own challenges" ON public.user_challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own challenges" ON public.user_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own challenges" ON public.user_challenges FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for posts
CREATE POLICY "Everyone can view posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users can create their own posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for likes
CREATE POLICY "Everyone can view likes" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Users can create their own likes" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for comments
CREATE POLICY "Everyone can view comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can create their own comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for badges (public read)
CREATE POLICY "Everyone can view badges" ON public.badges FOR SELECT USING (true);

-- RLS Policies for user badges
CREATE POLICY "Everyone can view user badges" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "Users can insert their own badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert default challenge categories
INSERT INTO public.challenge_categories (name, description, icon, color) VALUES
('Sports', 'Physical activities and fitness challenges', '🏃‍♂️', '#FF6B35'),
('Drawing', 'Art and illustration challenges', '🎨', '#8B5CF6'),
('Music', 'Musical practice and performance', '🎵', '#06B6D4'),
('Cooking', 'Culinary skills and recipes', '👨‍🍳', '#F59E0B'),
('Writing', 'Creative and technical writing', '✍️', '#10B981'),
('Coding', 'Programming and development', '💻', '#3B82F6'),
('Gardening', 'Plant care and growing', '🌱', '#84CC16');

-- Insert sample challenges
INSERT INTO public.challenges (title, description, category_id, difficulty_level, points_reward) VALUES
('10-Minute Morning Run', 'Start your day with a quick 10-minute jog around your neighborhood', 
 (SELECT id FROM public.challenge_categories WHERE name = 'Sports'), 1, 10),
('Draw a Self-Portrait', 'Create a self-portrait using any medium you prefer', 
 (SELECT id FROM public.challenge_categories WHERE name = 'Drawing'), 2, 15),
('Learn a New Song', 'Pick up an instrument and learn a song of your choice', 
 (SELECT id FROM public.challenge_categories WHERE name = 'Music'), 3, 20),
('Cook Without a Recipe', 'Create a meal using only ingredients you have at home', 
 (SELECT id FROM public.challenge_categories WHERE name = 'Cooking'), 2, 15),
('Write a 500-Word Story', 'Craft a short story in exactly 500 words', 
 (SELECT id FROM public.challenge_categories WHERE name = 'Writing'), 2, 15),
('Build a Simple Website', 'Create a basic website using HTML and CSS', 
 (SELECT id FROM public.challenge_categories WHERE name = 'Coding'), 3, 25),
('Grow Herbs Indoors', 'Start an indoor herb garden with basil, mint, or parsley', 
 (SELECT id FROM public.challenge_categories WHERE name = 'Gardening'), 2, 15);

-- Insert sample badges
INSERT INTO public.badges (name, description, icon, points_required) VALUES
('First Steps', 'Complete your first challenge', '🌟', 0),
('Getting Started', 'Earn your first 50 points', '🚀', 50),
('Challenger', 'Complete 5 challenges', '🏆', 0),
('Dedicated', 'Earn 200 points', '💪', 200),
('Community Helper', 'Get 10 likes on your posts', '❤️', 0),
('Versatile', 'Complete challenges in 3 different categories', '🌈', 0);

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', 'New User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create functions to update counters
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for counters
CREATE TRIGGER update_likes_count
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();

CREATE TRIGGER update_comments_count
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();