-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Add premium status to profiles
ALTER TABLE public.profiles ADD COLUMN is_premium BOOLEAN DEFAULT false;

-- Create coaching_content table
CREATE TABLE public.coaching_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  full_content TEXT,
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'video')),
  category_id UUID REFERENCES public.challenge_categories(id),
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
  is_premium BOOLEAN DEFAULT true,
  related_challenge_ids UUID[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coaching_content ENABLE ROW LEVEL SECURITY;

-- Everyone can view coaching content
CREATE POLICY "Everyone can view coaching content"
ON public.coaching_content
FOR SELECT
USING (true);

-- Admins can insert coaching content
CREATE POLICY "Admins can insert coaching content"
ON public.coaching_content
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update coaching content
CREATE POLICY "Admins can update coaching content"
ON public.coaching_content
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete coaching content
CREATE POLICY "Admins can delete coaching content"
ON public.coaching_content
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_coaching_content_updated_at
BEFORE UPDATE ON public.coaching_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_coaching_content_category ON public.coaching_content(category_id);
CREATE INDEX idx_coaching_content_premium ON public.coaching_content(is_premium);