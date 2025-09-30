-- Drop the restrictive SELECT policy on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Allow everyone to view all profiles (needed for community features)
CREATE POLICY "Everyone can view all profiles"
ON public.profiles
FOR SELECT
USING (true);

-- Keep the update policy restrictive (users can only update their own profile)
-- This policy already exists and is correct

-- Ensure profiles INSERT policy exists for new users
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (user_id = auth.uid());