-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create user_friends table for friend connections
CREATE TABLE public.user_friends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT user_friends_status_check CHECK (status IN ('pending', 'accepted', 'declined')),
  CONSTRAINT user_friends_different_users CHECK (user_id != friend_id),
  CONSTRAINT user_friends_unique_pair UNIQUE (user_id, friend_id)
);

-- Enable RLS
ALTER TABLE public.user_friends ENABLE ROW LEVEL SECURITY;

-- Create policies for user_friends
CREATE POLICY "Users can view their own friend connections" 
ON public.user_friends 
FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friend requests" 
ON public.user_friends 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friend requests they're involved in" 
ON public.user_friends 
FOR UPDATE 
USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their own friend connections" 
ON public.user_friends 
FOR DELETE 
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Add indexes for better performance
CREATE INDEX idx_user_friends_user_id ON public.user_friends(user_id);
CREATE INDEX idx_user_friends_friend_id ON public.user_friends(friend_id);
CREATE INDEX idx_user_friends_status ON public.user_friends(status);

-- Add media columns to challenges table
ALTER TABLE public.challenges 
ADD COLUMN image_url TEXT,
ADD COLUMN video_url TEXT;

-- Add validation columns to user_challenges table
ALTER TABLE public.user_challenges 
ADD COLUMN validation_status TEXT DEFAULT 'pending',
ADD COLUMN validated_by UUID,
ADD COLUMN validated_at TIMESTAMP WITH TIME ZONE,
ADD CONSTRAINT user_challenges_validation_status_check CHECK (validation_status IN ('pending', 'approved', 'rejected'));

-- Create index for validation queries
CREATE INDEX idx_user_challenges_validation_status ON public.user_challenges(validation_status);
CREATE INDEX idx_user_challenges_validated_by ON public.user_challenges(validated_by);

-- Create trigger for automatic timestamp updates on user_friends
CREATE TRIGGER update_user_friends_updated_at
BEFORE UPDATE ON public.user_friends
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage buckets for media uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('challenge-media', 'challenge-media', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('user-uploads', 'user-uploads', true);

-- Create policies for challenge media storage
CREATE POLICY "Anyone can view challenge media" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'challenge-media');

CREATE POLICY "Users can upload challenge media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'challenge-media' AND auth.uid() IS NOT NULL);

-- Create policies for user uploads storage
CREATE POLICY "Users can view all user uploads" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'user-uploads');

CREATE POLICY "Users can upload their own files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'user-uploads' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);