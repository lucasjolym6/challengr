import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Upload, Image, Video } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

interface CreateChallengeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onChallengeCreated: () => void;
  categories: Category[];
}

export const CreateChallengeDialog: React.FC<CreateChallengeDialogProps> = ({
  isOpen,
  onClose,
  onChallengeCreated,
  categories
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    difficulty_level: 1,
    points_reward: 10
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const uploadFile = async (file: File, bucket: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsSubmitting(true);

    try {
      let imageUrl = null;
      let videoUrl = null;

      // Upload image if selected
      if (imageFile) {
        imageUrl = await uploadFile(imageFile, 'challenge-media');
        if (!imageUrl) {
          toast({
            title: "Error",
            description: "Failed to upload image",
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Upload video if selected
      if (videoFile) {
        videoUrl = await uploadFile(videoFile, 'challenge-media');
        if (!videoUrl) {
          toast({
            title: "Error", 
            description: "Failed to upload video",
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }
      }

      const { error } = await supabase
        .from('challenges')
        .insert([
          {
            ...formData,
            created_by: user.id,
            is_custom: true,
            image_url: imageUrl,
            video_url: videoUrl
          }
        ]);

      if (error) {
        console.error('Error creating challenge:', error);
        toast({
          title: "Error",
          description: "Failed to create challenge",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Challenge created successfully!"
      });
      onChallengeCreated();
      onClose();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category_id: '',
        difficulty_level: 1,
        points_reward: 10
      });
      setImageFile(null);
      setVideoFile(null);
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast({
        title: "Error",
        description: "Failed to create challenge",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Challenge</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Challenge Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter challenge title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description & Rules</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the challenge, objectives, time limits, required materials, and conditions..."
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={formData.category_id} 
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty (1-5)</Label>
              <Select 
                value={formData.difficulty_level.toString()} 
                onValueChange={(value) => setFormData({ ...formData, difficulty_level: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Beginner</SelectItem>
                  <SelectItem value="2">2 - Easy</SelectItem>
                  <SelectItem value="3">3 - Medium</SelectItem>
                  <SelectItem value="4">4 - Hard</SelectItem>
                  <SelectItem value="5">5 - Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="points">Points Reward</Label>
              <Input
                id="points"
                type="number"
                min="1"
                max="100"
                value={formData.points_reward}
                onChange={(e) => setFormData({ ...formData, points_reward: parseInt(e.target.value) || 10 })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label>Media Attachments</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="image" className="flex items-center gap-2">
                  <Image size={16} />
                  Challenge Image
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="flex-1"
                  />
                  {imageFile && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setImageFile(null)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                {imageFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {imageFile.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="video" className="flex items-center gap-2">
                  <Video size={16} />
                  Tutorial Video
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="video"
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    className="flex-1"
                  />
                  {videoFile && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setVideoFile(null)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                {videoFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {videoFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Challenge'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};