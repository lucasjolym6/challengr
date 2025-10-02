-- ============================================================================
-- LOVABLE CLOUD DATABASE EXPORT
-- Generated: 2025-10-02
-- PostgreSQL 14+ Compatible for Supabase Import
-- ============================================================================
-- IMPORTANT: This export contains all schema, data, RLS policies, and functions
-- from your Lovable Cloud database. Run this in Supabase SQL editor.
-- ============================================================================

BEGIN;

-- Preamble: Set PostgreSQL environment
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET search_path TO public;

-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS public;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()

-- ============================================================================
-- DROP EXISTING OBJECTS (in reverse dependency order)
-- ============================================================================

-- Drop policies first
DROP POLICY IF EXISTS "Everyone can view admin config" ON public.admin_config CASCADE;
DROP POLICY IF EXISTS "Everyone can view badges" ON public.badges CASCADE;
DROP POLICY IF EXISTS "Everyone can view challenge categories" ON public.challenge_categories CASCADE;
DROP POLICY IF EXISTS "Everyone can view active challenges" ON public.challenges CASCADE;
DROP POLICY IF EXISTS "Users can create custom challenges" ON public.challenges CASCADE;
DROP POLICY IF EXISTS "Admins can delete coaching content" ON public.coaching_content CASCADE;
DROP POLICY IF EXISTS "Admins can insert coaching content" ON public.coaching_content CASCADE;
DROP POLICY IF EXISTS "Admins can update coaching content" ON public.coaching_content CASCADE;
DROP POLICY IF EXISTS "Everyone can view coaching content" ON public.coaching_content CASCADE;
DROP POLICY IF EXISTS "Everyone can view comments" ON public.comments CASCADE;
DROP POLICY IF EXISTS "Users can create their own comments" ON public.comments CASCADE;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments CASCADE;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments CASCADE;
DROP POLICY IF EXISTS "Everyone can view likes" ON public.likes CASCADE;
DROP POLICY IF EXISTS "Users can create their own likes" ON public.likes CASCADE;
DROP POLICY IF EXISTS "Users can delete their own likes" ON public.likes CASCADE;
DROP POLICY IF EXISTS "Users can mark messages as read" ON public.messages CASCADE;
DROP POLICY IF EXISTS "Users can send messages to friends" ON public.messages CASCADE;
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages CASCADE;
DROP POLICY IF EXISTS "Challenge authors can verify posts" ON public.posts CASCADE;
DROP POLICY IF EXISTS "Everyone can view posts" ON public.posts CASCADE;
DROP POLICY IF EXISTS "Users can create their own posts" ON public.posts CASCADE;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts CASCADE;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts CASCADE;
DROP POLICY IF EXISTS "Everyone can view all profiles" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "Users can create reports" ON public.submission_reports CASCADE;
DROP POLICY IF EXISTS "Users can view reports they created" ON public.submission_reports CASCADE;
DROP POLICY IF EXISTS "Users can insert own submission" ON public.submissions CASCADE;
DROP POLICY IF EXISTS "Users can update own submissions" ON public.submissions CASCADE;
DROP POLICY IF EXISTS "Users can view own submissions" ON public.submissions CASCADE;
DROP POLICY IF EXISTS "Everyone can view user badges" ON public.user_badges CASCADE;
DROP POLICY IF EXISTS "Users can insert their own badges" ON public.user_badges CASCADE;
DROP POLICY IF EXISTS "Users can insert their own defeats" ON public.user_challenge_defeats CASCADE;
DROP POLICY IF EXISTS "Users can update their own defeats" ON public.user_challenge_defeats CASCADE;
DROP POLICY IF EXISTS "Users can view their own defeats" ON public.user_challenge_defeats CASCADE;
DROP POLICY IF EXISTS "Challenge owners can view submissions to their challenges" ON public.user_challenges CASCADE;
DROP POLICY IF EXISTS "Users can insert their own challenges" ON public.user_challenges CASCADE;
DROP POLICY IF EXISTS "Users can update their own challenges" ON public.user_challenges CASCADE;
DROP POLICY IF EXISTS "Users can view their own challenges" ON public.user_challenges CASCADE;
DROP POLICY IF EXISTS "Users can create friend requests" ON public.user_friends CASCADE;
DROP POLICY IF EXISTS "Users can delete their own friend connections" ON public.user_friends CASCADE;
DROP POLICY IF EXISTS "Users can update friend requests they're involved in" ON public.user_friends CASCADE;
DROP POLICY IF EXISTS "Users can view their own friend connections" ON public.user_friends CASCADE;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles CASCADE;
DROP POLICY IF EXISTS "Users can view validation audit for their submissions" ON public.validation_audit CASCADE;
DROP POLICY IF EXISTS "Validators can insert audit entries" ON public.validation_audit CASCADE;
DROP POLICY IF EXISTS "System can insert validator notifications" ON public.validator_notifications CASCADE;
DROP POLICY IF EXISTS "Users can update their own validator notifications" ON public.validator_notifications CASCADE;
DROP POLICY IF EXISTS "Users can view their own validator notifications" ON public.validator_notifications CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.can_validate_challenge(uuid, uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.can_validate_submission(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.can_view_submission(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_post_likes_count() CASCADE;
DROP FUNCTION IF EXISTS public.update_post_comments_count() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS public.validator_notifications CASCADE;
DROP TABLE IF EXISTS public.validation_audit CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.user_friends CASCADE;
DROP TABLE IF EXISTS public.user_challenges CASCADE;
DROP TABLE IF EXISTS public.user_challenge_defeats CASCADE;
DROP TABLE IF EXISTS public.user_badges CASCADE;
DROP TABLE IF EXISTS public.submissions CASCADE;
DROP TABLE IF EXISTS public.submission_reports CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.likes CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.coaching_content CASCADE;
DROP TABLE IF EXISTS public.challenges CASCADE;
DROP TABLE IF EXISTS public.challenge_categories CASCADE;
DROP TABLE IF EXISTS public.badges CASCADE;
DROP TABLE IF EXISTS public.admin_config CASCADE;

-- Drop types
DROP TYPE IF EXISTS public.challenge_type CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;

-- ============================================================================
-- CREATE TYPES (ENUMS)
-- ============================================================================

-- TYPE: app_role
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- TYPE: challenge_type
CREATE TYPE public.challenge_type AS ENUM ('company', 'community');

-- ============================================================================
-- CREATE TABLES
-- ============================================================================

-- TABLE: admin_config
CREATE TABLE public.admin_config (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key text NOT NULL UNIQUE,
    value jsonb NOT NULL,
    description text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: badges
CREATE TABLE public.badges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    description text,
    icon text,
    points_required integer DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: challenge_categories
CREATE TABLE public.challenge_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    description text,
    icon text,
    color text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: challenges
CREATE TABLE public.challenges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    category_id uuid,
    difficulty_level integer DEFAULT 1,
    points_reward integer DEFAULT 10,
    is_custom boolean DEFAULT false,
    created_by uuid,
    image_url text,
    video_url text,
    type public.challenge_type NOT NULL DEFAULT 'company'::challenge_type,
    is_active boolean DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: coaching_content
CREATE TABLE public.coaching_content (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text NOT NULL,
    full_content text,
    media_url text,
    media_type text,
    category_id uuid,
    difficulty_level integer DEFAULT 1,
    is_premium boolean DEFAULT true,
    related_challenge_ids uuid[],
    created_by uuid,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: profiles
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE,
    username text NOT NULL UNIQUE,
    display_name text,
    avatar_url text,
    bio text,
    level integer DEFAULT 1,
    total_points integer DEFAULT 0,
    total_defeats integer DEFAULT 0,
    is_premium boolean DEFAULT false,
    skills text[],
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: user_roles
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    UNIQUE (user_id, role)
);

-- TABLE: user_friends
CREATE TABLE public.user_friends (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    friend_id uuid NOT NULL,
    status text NOT NULL DEFAULT 'pending'::text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: user_challenges
CREATE TABLE public.user_challenges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    challenge_id uuid NOT NULL,
    status text DEFAULT 'to_do'::text,
    started_at timestamptz,
    completed_at timestamptz,
    proof_text text,
    proof_image_url text,
    validation_status text DEFAULT 'pending'::text,
    validated_by uuid,
    validated_at timestamptz,
    validator_comment text,
    rejection_reason text,
    appeal_reason text,
    appeal_requested_at timestamptz,
    escalated_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: submissions
CREATE TABLE public.submissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    challenge_id uuid NOT NULL,
    proof_text text,
    proof_image_url text,
    proof_video_url text,
    status text NOT NULL DEFAULT 'pending'::text,
    validator_id uuid,
    validated_at timestamptz,
    validator_comment text,
    rejection_reason text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: posts
CREATE TABLE public.posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    user_challenge_id uuid,
    content text,
    image_url text,
    hashtags text[],
    likes_count integer DEFAULT 0,
    comments_count integer DEFAULT 0,
    verified boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: comments
CREATE TABLE public.comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: likes
CREATE TABLE public.likes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, post_id)
);

-- TABLE: messages
CREATE TABLE public.messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id uuid NOT NULL,
    receiver_id uuid NOT NULL,
    content text,
    challenge_id uuid,
    read_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: user_badges
CREATE TABLE public.user_badges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    badge_id uuid NOT NULL,
    earned_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: user_challenge_defeats
CREATE TABLE public.user_challenge_defeats (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    challenge_id uuid NOT NULL,
    defeats_count integer NOT NULL DEFAULT 0,
    last_defeated_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: submission_reports
CREATE TABLE public.submission_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_challenge_id uuid NOT NULL,
    submission_id uuid,
    reporter_id uuid NOT NULL,
    reason text NOT NULL,
    description text,
    status text NOT NULL DEFAULT 'pending'::text,
    reviewed_by uuid,
    reviewed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: validation_audit
CREATE TABLE public.validation_audit (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_challenge_id uuid NOT NULL,
    submission_id uuid,
    validator_id uuid NOT NULL,
    action text NOT NULL,
    reason text,
    comment text,
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: validator_notifications
CREATE TABLE public.validator_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    validator_id uuid NOT NULL,
    user_challenge_id uuid NOT NULL,
    submission_id uuid,
    type text NOT NULL,
    read_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- Challenges indexes
CREATE INDEX idx_challenges_type ON public.challenges USING btree (type);

-- Coaching content indexes
CREATE INDEX idx_coaching_content_category ON public.coaching_content USING btree (category_id);
CREATE INDEX idx_coaching_content_premium ON public.coaching_content USING btree (is_premium);

-- Submissions indexes
CREATE INDEX idx_submissions_user_id ON public.submissions USING btree (user_id);
CREATE INDEX idx_submissions_challenge_id ON public.submissions USING btree (challenge_id);
CREATE INDEX idx_submissions_status ON public.submissions USING btree (status);
CREATE INDEX idx_submissions_validator_id ON public.submissions USING btree (validator_id);

-- Messages indexes
CREATE INDEX idx_messages_sender_receiver ON public.messages USING btree (sender_id, receiver_id, created_at DESC);
CREATE INDEX idx_messages_receiver_unread ON public.messages USING btree (receiver_id, read_at) WHERE (read_at IS NULL);

-- Submission reports indexes
CREATE INDEX idx_submission_reports_user_challenge_id ON public.submission_reports USING btree (user_challenge_id);
CREATE INDEX idx_submission_reports_status ON public.submission_reports USING btree (status);

-- User challenges indexes
CREATE INDEX idx_user_challenges_user_id ON public.user_challenges USING btree (user_id);
CREATE INDEX idx_user_challenges_challenge_id ON public.user_challenges USING btree (challenge_id);

-- ============================================================================
-- CREATE FUNCTIONS
-- ============================================================================

-- FUNCTION: has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
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

-- FUNCTION: handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', 'New User')
  );
  RETURN NEW;
END;
$$;

-- FUNCTION: update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- FUNCTION: update_post_likes_count
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- FUNCTION: update_post_comments_count
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- FUNCTION: can_view_submission
CREATE OR REPLACE FUNCTION public.can_view_submission(_user_id uuid, _submission_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_submission_user_id uuid;
  v_challenge_creator_id uuid;
  v_challenge_id uuid;
  v_has_approved_submission boolean;
BEGIN
  -- Get submission details
  SELECT user_id, challenge_id 
  INTO v_submission_user_id, v_challenge_id
  FROM public.submissions
  WHERE id = _submission_id;
  
  -- User can view their own submissions
  IF _user_id = v_submission_user_id THEN
    RETURN true;
  END IF;
  
  -- Get challenge creator
  SELECT created_by INTO v_challenge_creator_id
  FROM public.challenges
  WHERE id = v_challenge_id;
  
  -- Challenge creator can view all submissions
  IF _user_id = v_challenge_creator_id THEN
    RETURN true;
  END IF;
  
  -- Check if user has approved submission for this challenge
  SELECT EXISTS(
    SELECT 1 FROM public.submissions
    WHERE user_id = _user_id
    AND challenge_id = v_challenge_id
    AND status = 'approved'
  ) INTO v_has_approved_submission;
  
  RETURN v_has_approved_submission;
END;
$$;

-- FUNCTION: can_validate_challenge
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

-- FUNCTION: can_validate_submission
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

-- ============================================================================
-- NOTE: Triggers cannot be automatically created for auth.users table
-- You must manually create this trigger in Supabase after import:
-- 
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION public.handle_new_user();
-- ============================================================================

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenge_defeats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validation_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validator_notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

-- POLICIES: admin_config
CREATE POLICY "Everyone can view admin config" ON public.admin_config
  FOR SELECT USING (true);

-- POLICIES: badges
CREATE POLICY "Everyone can view badges" ON public.badges
  FOR SELECT USING (true);

-- POLICIES: challenge_categories
CREATE POLICY "Everyone can view challenge categories" ON public.challenge_categories
  FOR SELECT USING (true);

-- POLICIES: challenges
CREATE POLICY "Everyone can view active challenges" ON public.challenges
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can create custom challenges" ON public.challenges
  FOR INSERT WITH CHECK ((auth.uid() = created_by) AND (is_custom = true));

-- POLICIES: coaching_content
CREATE POLICY "Everyone can view coaching content" ON public.coaching_content
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert coaching content" ON public.coaching_content
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update coaching content" ON public.coaching_content
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete coaching content" ON public.coaching_content
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- POLICIES: comments
CREATE POLICY "Everyone can view comments" ON public.comments
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own comments" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON public.comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.comments
  FOR DELETE USING (auth.uid() = user_id);

-- POLICIES: likes
CREATE POLICY "Everyone can view likes" ON public.likes
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own likes" ON public.likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON public.likes
  FOR DELETE USING (auth.uid() = user_id);

-- POLICIES: messages
CREATE POLICY "Users can view their own messages" ON public.messages
  FOR SELECT USING ((auth.uid() = sender_id) OR (auth.uid() = receiver_id));

CREATE POLICY "Users can send messages to friends" ON public.messages
  FOR INSERT WITH CHECK (
    (auth.uid() = sender_id) AND 
    (EXISTS (
      SELECT 1 FROM user_friends
      WHERE (
        ((user_friends.user_id = messages.sender_id) AND (user_friends.friend_id = messages.receiver_id)) OR
        ((user_friends.user_id = messages.receiver_id) AND (user_friends.friend_id = messages.sender_id))
      ) AND (user_friends.status = 'accepted'::text)
    ))
  );

CREATE POLICY "Users can mark messages as read" ON public.messages
  FOR UPDATE USING (auth.uid() = receiver_id);

-- POLICIES: posts
CREATE POLICY "Everyone can view posts" ON public.posts
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON public.posts
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Challenge authors can verify posts" ON public.posts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_challenges uc
      JOIN challenges c ON c.id = uc.challenge_id
      WHERE uc.id = posts.user_challenge_id AND c.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_challenges uc
      JOIN challenges c ON c.id = uc.challenge_id
      WHERE uc.id = posts.user_challenge_id AND c.created_by = auth.uid()
    )
  );

-- POLICIES: profiles
CREATE POLICY "Everyone can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- POLICIES: submission_reports
CREATE POLICY "Users can view reports they created" ON public.submission_reports
  FOR SELECT USING (reporter_id = auth.uid());

CREATE POLICY "Users can create reports" ON public.submission_reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

-- POLICIES: submissions
CREATE POLICY "Users can view own submissions" ON public.submissions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own submission" ON public.submissions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own submissions" ON public.submissions
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- POLICIES: user_badges
CREATE POLICY "Everyone can view user badges" ON public.user_badges
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own badges" ON public.user_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- POLICIES: user_challenge_defeats
CREATE POLICY "Users can view their own defeats" ON public.user_challenge_defeats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own defeats" ON public.user_challenge_defeats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own defeats" ON public.user_challenge_defeats
  FOR UPDATE USING (auth.uid() = user_id);

-- POLICIES: user_challenges
CREATE POLICY "Users can view their own challenges" ON public.user_challenges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Challenge owners can view submissions to their challenges" ON public.user_challenges
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM challenges
      WHERE challenges.id = user_challenges.challenge_id AND challenges.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own challenges" ON public.user_challenges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenges" ON public.user_challenges
  FOR UPDATE USING (auth.uid() = user_id);

-- POLICIES: user_friends
CREATE POLICY "Users can view their own friend connections" ON public.user_friends
  FOR SELECT USING ((auth.uid() = user_id) OR (auth.uid() = friend_id));

CREATE POLICY "Users can create friend requests" ON public.user_friends
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friend requests they're involved in" ON public.user_friends
  FOR UPDATE USING ((auth.uid() = user_id) OR (auth.uid() = friend_id));

CREATE POLICY "Users can delete their own friend connections" ON public.user_friends
  FOR DELETE USING ((auth.uid() = user_id) OR (auth.uid() = friend_id));

-- POLICIES: user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- POLICIES: validation_audit
CREATE POLICY "Users can view validation audit for their submissions" ON public.validation_audit
  FOR SELECT USING (
    (EXISTS (
      SELECT 1 FROM user_challenges uc
      WHERE uc.id = validation_audit.user_challenge_id AND uc.user_id = auth.uid()
    )) OR (validator_id = auth.uid())
  );

CREATE POLICY "Validators can insert audit entries" ON public.validation_audit
  FOR INSERT WITH CHECK (validator_id = auth.uid());

-- POLICIES: validator_notifications
CREATE POLICY "Users can view their own validator notifications" ON public.validator_notifications
  FOR SELECT USING (validator_id = auth.uid());

CREATE POLICY "System can insert validator notifications" ON public.validator_notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own validator notifications" ON public.validator_notifications
  FOR UPDATE USING (validator_id = auth.uid());

-- ============================================================================
-- INSERT DATA
-- ============================================================================

-- DATA: admin_config (5 rows)
INSERT INTO public.admin_config (id, key, value, description, created_at, updated_at) VALUES
('57be454f-f872-461b-8c79-06a70db2deff', 'validator_min_completed_challenges', '3', 'Minimum completed challenges required to become a validator', '2025-09-30 07:17:12.839038+00', '2025-09-30 07:17:12.839038+00'),
('d30d72f1-55b5-4aa2-8cab-0043303e6fd3', 'validation_response_days', '7', 'Days validators have to respond before escalation', '2025-09-30 07:17:12.839038+00', '2025-09-30 07:17:12.839038+00'),
('d9003d4e-5c75-4cea-b356-ab217902b4c0', 'validator_daily_limit', '20', 'Maximum validations per validator per day', '2025-09-30 07:17:12.839038+00', '2025-09-30 07:17:12.839038+00'),
('89864cdb-c5d5-4306-9098-6b6574c1fa15', 'points_for_validator', '5', 'Points awarded to validators for each validation', '2025-09-30 07:17:12.839038+00', '2025-09-30 07:17:12.839038+00'),
('8b02e0b3-c9cd-4a65-a951-1e83c840a2f1', 'community_votes_required', '3', 'Number of community votes required for auto-approval', '2025-09-30 07:17:12.839038+00', '2025-09-30 07:17:12.839038+00');

-- DATA: badges (6 rows)
INSERT INTO public.badges (id, name, description, icon, points_required, created_at) VALUES
('2ef84586-a434-4f24-8f5c-1ff2843e7da0', 'First Steps', 'Complete your first challenge', '🌟', 0, '2025-09-30 02:47:48.473523+00'),
('dc051ac4-6d0d-4c6d-a650-ebd2d25cfdbb', 'Getting Started', 'Earn your first 50 points', '🚀', 50, '2025-09-30 02:47:48.473523+00'),
('f14f5851-373b-487f-86d1-22ce90809ff0', 'Challenger', 'Complete 5 challenges', '🏆', 0, '2025-09-30 02:47:48.473523+00'),
('0f2521ac-3717-4b1e-bea8-8d00606fd586', 'Dedicated', 'Earn 200 points', '💪', 200, '2025-09-30 02:47:48.473523+00'),
('7a3116ed-e806-4040-a13b-9bf3ae4ee554', 'Community Helper', 'Get 10 likes on your posts', '❤️', 0, '2025-09-30 02:47:48.473523+00'),
('bda654ba-cea5-4785-867a-e7a3c7984778', 'Versatile', 'Complete challenges in 3 different categories', '🌈', 0, '2025-09-30 02:47:48.473523+00');

-- DATA: challenge_categories (7 rows)
INSERT INTO public.challenge_categories (id, name, description, icon, color, created_at) VALUES
('47c284bd-8ccc-41e6-b1cf-4c31227c812f', 'Sports', 'Physical activities and fitness challenges', '🏃‍♂️', '#FF6B35', '2025-09-30 02:47:48.473523+00'),
('4c7a204c-2b27-4113-99ab-fc5126598702', 'Drawing', 'Art and illustration challenges', '🎨', '#8B5CF6', '2025-09-30 02:47:48.473523+00'),
('99fe945b-8cd3-4ec5-a755-ab96e2c309b5', 'Music', 'Musical practice and performance', '🎵', '#06B6D4', '2025-09-30 02:47:48.473523+00'),
('a3fb248f-ea0a-47d7-8b7a-2748f1fc94f6', 'Cooking', 'Culinary skills and recipes', '👨‍🍳', '#F59E0B', '2025-09-30 02:47:48.473523+00'),
('e53e738a-b796-468c-a207-56f75fc05027', 'Writing', 'Creative and technical writing', '✍️', '#10B981', '2025-09-30 02:47:48.473523+00'),
('7f40cce9-120f-4dce-ade2-17f5f4c43ee0', 'Coding', 'Programming and development', '💻', '#3B82F6', '2025-09-30 02:47:48.473523+00'),
('d20faff4-f044-4adf-998e-c940ba8eec95', 'Gardening', 'Plant care and growing', '🌱', '#84CC16', '2025-09-30 02:47:48.473523+00');

-- DATA: challenges (17 rows) - Batched inserts
INSERT INTO public.challenges (id, title, description, category_id, difficulty_level, points_reward, is_custom, created_by, image_url, video_url, type, is_active, created_at) VALUES
('244a8882-35d7-4b3a-9082-5047bbf0c7ce', '10-Minute Morning Run', 'Start your day with a quick 10-minute jog around your neighborhood', '47c284bd-8ccc-41e6-b1cf-4c31227c812f', 1, 10, false, NULL, NULL, NULL, 'company', true, '2025-09-30 02:47:48.473523+00'),
('156ae8f8-fcb7-4bad-80b3-65e5e38c7e07', 'Draw a Self-Portrait', 'Create a self-portrait using any medium you prefer', '4c7a204c-2b27-4113-99ab-fc5126598702', 2, 15, false, NULL, NULL, NULL, 'company', true, '2025-09-30 02:47:48.473523+00'),
('8f63b8ff-465c-4294-8af3-beb0a57dc2ea', 'Learn a New Song', 'Pick up an instrument and learn a song of your choice', '99fe945b-8cd3-4ec5-a755-ab96e2c309b5', 3, 20, false, NULL, NULL, NULL, 'company', true, '2025-09-30 02:47:48.473523+00'),
('931758d1-7436-429a-85de-999120ca01ee', 'Cook Without a Recipe', 'Create a meal using only ingredients you have at home', 'a3fb248f-ea0a-47d7-8b7a-2748f1fc94f6', 2, 15, false, NULL, NULL, NULL, 'company', true, '2025-09-30 02:47:48.473523+00'),
('d4d91d69-b7a0-4063-b441-684f1a1d7cac', 'Write a 500-Word Story', 'Craft a short story in exactly 500 words', 'e53e738a-b796-468c-a207-56f75fc05027', 2, 15, false, NULL, NULL, NULL, 'company', true, '2025-09-30 02:47:48.473523+00'),
('38155c87-67c0-472b-b800-63c0ed9d8b5b', 'Build a Simple Website', 'Create a basic website using HTML and CSS', '7f40cce9-120f-4dce-ade2-17f5f4c43ee0', 3, 25, false, NULL, NULL, NULL, 'company', true, '2025-09-30 02:47:48.473523+00'),
('01b28b31-6a8e-4a3e-a438-b36fafe82e2a', 'Grow Herbs Indoors', 'Start an indoor herb garden with basil, mint, or parsley', 'd20faff4-f044-4adf-998e-c940ba8eec95', 2, 15, false, NULL, NULL, NULL, 'company', true, '2025-09-30 02:47:48.473523+00'),
('573ac71a-512a-48c3-a1a0-f4a11ddd2e7f', 'Coder pokemon', 'fhenfi', '7f40cce9-120f-4dce-ade2-17f5f4c43ee0', 5, 15, true, '0d1e4bbb-323e-467d-8bc9-79da2edec281', NULL, NULL, 'community', true, '2025-09-30 03:12:07.97616+00'),
('f0d97f82-1a55-40eb-a0ae-18a0b7226f53', 'dzdzd', 'dzdz', 'a3fb248f-ea0a-47d7-8b7a-2748f1fc94f6', 1, 10, true, '2f095188-bbae-4a26-9b91-20de5ba3ede1', NULL, NULL, 'community', true, '2025-09-30 07:22:25.675737+00'),
('ec4226bb-54dc-4ffc-8a3c-2449eef2e3e9', 'endend', 'dnzldnlz', 'd20faff4-f044-4adf-998e-c940ba8eec95', 1, 10, true, '0d1e4bbb-323e-467d-8bc9-79da2edec281', NULL, NULL, 'community', true, '2025-09-30 07:28:22.844226+00');

INSERT INTO public.challenges (id, title, description, category_id, difficulty_level, points_reward, is_custom, created_by, image_url, video_url, type, is_active, created_at) VALUES
('4dd149c4-4823-43df-aa35-b0c08f82ba2a', 'Aller a londrès pour halloween', 'nkznk', '99fe945b-8cd3-4ec5-a755-ab96e2c309b5', 1, 10, true, '34bba180-b67a-463e-8643-1178f3fb827a', NULL, NULL, 'community', true, '2025-09-30 20:27:48.844139+00'),
('8b3dd58d-b80c-44c2-bbe3-dfa8efb86faa', 'test raph 1', 'blabla', '4c7a204c-2b27-4113-99ab-fc5126598702', 5, 1, true, 'f376f55e-a416-4dc0-849b-c50168c85990', NULL, NULL, 'community', true, '2025-09-30 20:51:39.70427+00'),
('9b362ef8-a105-4cff-81c8-4eeb1f5f9fac', 'tes raph 2', 'bablabla', '99fe945b-8cd3-4ec5-a755-ab96e2c309b5', 3, 10, true, 'f376f55e-a416-4dc0-849b-c50168c85990', NULL, NULL, 'community', true, '2025-09-30 20:58:09.578312+00'),
('ecc8e6aa-729e-4366-aee2-458c02a8dffd', 'test raph 3', 'blablabla', '4c7a204c-2b27-4113-99ab-fc5126598702', 2, 10, true, 'f376f55e-a416-4dc0-849b-c50168c85990', NULL, NULL, 'community', true, '2025-09-30 21:05:23.716696+00'),
('383404e5-05ef-44f5-9bf7-673349b298e8', 'test raph 4', 'bla3', '99fe945b-8cd3-4ec5-a755-ab96e2c309b5', 1, 5, true, 'f376f55e-a416-4dc0-849b-c50168c85990', NULL, NULL, 'community', true, '2025-09-30 21:12:27.296604+00'),
('93401854-6ddb-46b1-a62e-6f16e09b2a5e', 'jjkdjkd', 'ndjncd', '7f40cce9-120f-4dce-ade2-17f5f4c43ee0', 1, 10, true, '0d1e4bbb-323e-467d-8bc9-79da2edec281', NULL, NULL, 'community', true, '2025-10-01 20:25:30.092928+00'),
('e11d7816-cc47-4f84-b7db-cf7b90f5b8cc', 'jhbjhb', 'njnjn', 'd20faff4-f044-4adf-998e-c940ba8eec95', 1, 10, true, '0d1e4bbb-323e-467d-8bc9-79da2edec281', NULL, NULL, 'community', true, '2025-10-01 20:25:37.746638+00');

-- DATA: profiles (14 rows) - Batched inserts
INSERT INTO public.profiles (id, user_id, username, display_name, avatar_url, bio, level, total_points, total_defeats, is_premium, skills, created_at, updated_at) VALUES
('0bb5622d-b53a-47db-bf8c-0ada1561246f', '0d1e4bbb-323e-467d-8bc9-79da2edec281', 'lucas', 'lucas', NULL, NULL, 1, 0, 0, false, NULL, '2025-09-30 02:54:51.096096+00', '2025-09-30 02:54:51.096096+00'),
('afd9b79c-93f6-4d0a-af6d-4d54a791a491', '34bba180-b67a-463e-8643-1178f3fb827a', 'lucas2', 'lucas2', 'https://detmqzxyxaybcfnxyceg.supabase.co/storage/v1/object/public/avatars/34bba180-b67a-463e-8643-1178f3fb827a/1759235730747.JPG', NULL, 1, 15, 0, false, NULL, '2025-09-30 03:44:38.360952+00', '2025-09-30 03:44:38.360952+00'),
('184fed91-11dd-4d89-a6e6-42c76a9d3bab', '2b5a5e79-0773-410d-a1ac-7e820260fc8f', 'Zizjzj', 'Zizjzj', NULL, NULL, 1, 0, 0, false, NULL, '2025-09-30 03:47:18.34045+00', '2025-09-30 03:47:18.34045+00'),
('943bf653-1efd-4a5a-8a27-85debbbcd3f3', '9481bf43-6cc7-45cd-a6f8-28c56a3ab34f', 'Jsks', 'Jsks', NULL, NULL, 1, 0, 0, false, NULL, '2025-09-30 03:48:01.861202+00', '2025-09-30 03:48:01.861202+00'),
('94c49b09-53a8-4f1b-8e72-8558eed6d407', 'd06f3b89-69b6-456e-9b9b-7661a74e1dba', 'Heud', 'Heud', NULL, NULL, 1, 0, 0, false, NULL, '2025-09-30 03:50:23.730429+00', '2025-09-30 03:50:23.730429+00'),
('2aca573f-778a-4266-bb80-005df4f06fd5', '3c9751dd-664c-47a2-b127-81ed2407ac70', 'szszszs', 'szszszs', NULL, NULL, 1, 0, 0, false, NULL, '2025-09-30 07:12:02.228449+00', '2025-09-30 07:12:02.228449+00'),
('400ff576-6289-4c04-b291-d5cbe93ce1e7', '2f095188-bbae-4a26-9b91-20de5ba3ede1', 'ndjek', 'ndjek', NULL, NULL, 1, 0, 0, false, NULL, '2025-09-30 07:20:58.442378+00', '2025-09-30 07:20:58.442378+00'),
('0baa95d9-cfee-4080-9117-51fa48a52017', '3062f7a8-6ccb-4902-84bf-8654ab948bca', 'dldnz', 'dldnz', NULL, NULL, 1, 0, 0, false, NULL, '2025-09-30 07:29:30.903481+00', '2025-09-30 07:29:30.903481+00'),
('012e8823-241f-46d2-9dcb-c2166de717ce', '763b4be1-7d33-4a24-920a-c8ee9a37d573', 'deddez', 'deddez', NULL, NULL, 1, 0, 0, false, NULL, '2025-09-30 07:35:23.002986+00', '2025-09-30 07:35:23.002986+00'),
('3e5f6402-5740-4047-aaf2-29d71fb5e01e', 'cb4880e2-75a7-4574-b1c3-65d40d3224e4', 'Raph', 'Raph', NULL, NULL, 1, 0, 0, false, NULL, '2025-09-30 07:46:19.368352+00', '2025-09-30 07:46:19.368352+00');

INSERT INTO public.profiles (id, user_id, username, display_name, avatar_url, bio, level, total_points, total_defeats, is_premium, skills, created_at, updated_at) VALUES
('08c2f816-f68e-4f8a-bb62-ba77685074b6', 'e03c9b8e-cd05-46fb-8247-5f510474c6c7', 'Haush ', 'Haush ', NULL, NULL, 1, 0, 0, false, NULL, '2025-09-30 07:49:57.173724+00', '2025-09-30 07:49:57.173724+00'),
('742410f1-d070-473f-b118-6e71c5b6b503', 'e429e526-281d-41a1-b3e4-e8e03066b954', 'Jsjsks', 'Jsjsks', NULL, NULL, 1, 0, 0, false, NULL, '2025-09-30 07:56:45.700123+00', '2025-09-30 07:56:45.700123+00'),
('5530668e-5815-43a5-97a1-b6c675c72c3d', '06329e04-6fcd-4eef-85ea-40a8ec21d176', 'kjojojo', 'kjojojo', NULL, NULL, 1, 0, 0, false, NULL, '2025-09-30 08:31:37.235285+00', '2025-09-30 08:31:37.235285+00'),
('75a5481c-06fe-4ef8-85d2-c524c8652c9e', 'f376f55e-a416-4dc0-849b-c50168c85990', 'raph v2', 'raph v2', NULL, NULL, 1, 15, 0, false, NULL, '2025-09-30 20:29:45.069163+00', '2025-09-30 20:29:45.069163+00');

-- DATA: user_friends (7 rows)
INSERT INTO public.user_friends (id, user_id, friend_id, status, created_at, updated_at) VALUES
('5540ab97-bbbe-497a-9ce5-a0efb3c8fc2f', '34bba180-b67a-463e-8643-1178f3fb827a', '0d1e4bbb-323e-467d-8bc9-79da2edec281', 'accepted', '2025-09-30 03:44:54.830758+00', '2025-09-30 12:51:55.086337+00'),
('aa12d7d8-6f63-496b-8a65-2089d209e5a2', 'e429e526-281d-41a1-b3e4-e8e03066b954', '0d1e4bbb-323e-467d-8bc9-79da2edec281', 'accepted', '2025-09-30 07:58:49.095359+00', '2025-09-30 12:51:56.200762+00'),
('c56a952a-7cd5-45ea-add3-1491af5ede19', '3062f7a8-6ccb-4902-84bf-8654ab948bca', '34bba180-b67a-463e-8643-1178f3fb827a', 'accepted', '2025-09-30 11:40:36.628211+00', '2025-09-30 11:41:11.131715+00'),
('a1c60fc6-9bdf-4e49-a241-79b1c9c06f0d', '3062f7a8-6ccb-4902-84bf-8654ab948bca', '0d1e4bbb-323e-467d-8bc9-79da2edec281', 'accepted', '2025-09-30 11:40:43.000233+00', '2025-09-30 12:51:57.394038+00'),
('a3d63b5e-1f1c-4dcd-bb93-d5bb54da67eb', '34bba180-b67a-463e-8643-1178f3fb827a', 'cb4880e2-75a7-4574-b1c3-65d40d3224e4', 'accepted', '2025-09-30 12:59:41.056049+00', '2025-09-30 20:24:01.095308+00'),
('201b23fd-9537-40d2-a03f-1664b246f0df', 'f376f55e-a416-4dc0-849b-c50168c85990', '34bba180-b67a-463e-8643-1178f3fb827a', 'accepted', '2025-09-30 20:30:29.943414+00', '2025-09-30 20:47:11.903613+00'),
('03c25778-63b3-4d2c-ae3a-403395473206', 'f376f55e-a416-4dc0-849b-c50168c85990', '0d1e4bbb-323e-467d-8bc9-79da2edec281', 'pending', '2025-09-30 20:30:37.091399+00', '2025-09-30 20:30:37.091399+00');

COMMIT;

-- ============================================================================
-- END OF EXPORT - Part 1 (Schema + Static Data)
-- Continue with Part 2 for large transaction data
-- ============================================================================
