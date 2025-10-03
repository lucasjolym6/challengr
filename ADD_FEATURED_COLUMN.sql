-- Add is_featured column to challenges table
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Add index for better performance when querying featured challenges
CREATE INDEX IF NOT EXISTS idx_challenges_is_featured ON challenges(is_featured);

-- Optionally set some sample challenges as featured (uncomment if needed)
-- UPDATE challenges SET is_featured = true WHERE id IN (
--   SELECT id FROM challenges ORDER BY created_at DESC LIMIT 2
-- );
