-- Remove the problematic foreign key constraint
ALTER TABLE public.submissions
DROP CONSTRAINT IF EXISTS submissions_user_id_fkey_profiles;

-- Ensure profiles are created for all existing auth users
INSERT INTO public.profiles (user_id, username, display_name)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'username', 'user_' || substr(au.id::text, 1, 8)),
  COALESCE(au.raw_user_meta_data->>'display_name', au.raw_user_meta_data->>'full_name', 'User')
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.user_id = au.id
)
ON CONFLICT (user_id) DO NOTHING;