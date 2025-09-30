-- Add defeats counter to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_defeats integer DEFAULT 0;

-- Add defeat count tracking per challenge
CREATE TABLE IF NOT EXISTS public.user_challenge_defeats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  defeats_count integer NOT NULL DEFAULT 0,
  last_defeated_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

-- Enable RLS
ALTER TABLE public.user_challenge_defeats ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own defeats"
ON public.user_challenge_defeats
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own defeats"
ON public.user_challenge_defeats
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own defeats"
ON public.user_challenge_defeats
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_challenge_defeats_updated_at
BEFORE UPDATE ON public.user_challenge_defeats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();