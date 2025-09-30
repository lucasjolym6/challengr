-- Create challenge type enum
CREATE TYPE public.challenge_type AS ENUM ('company', 'community');

-- Add type column to challenges table
ALTER TABLE public.challenges 
ADD COLUMN type public.challenge_type NOT NULL DEFAULT 'community';

-- Update existing challenges based on is_custom field
-- Assuming is_custom = false means company challenges
UPDATE public.challenges 
SET type = CASE 
  WHEN is_custom = true THEN 'community'::public.challenge_type
  ELSE 'company'::public.challenge_type
END;

-- Create index for better query performance
CREATE INDEX idx_challenges_type ON public.challenges(type);