import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface CoachingFormData {
  title: string;
  description: string;
  full_content: string;
  media_url: string;
  media_type: 'image' | 'video' | '';
  category_id: string;
  difficulty_level: number;
  is_premium: boolean;
}

export const AdminCoachingManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CoachingFormData>({
    title: '',
    description: '',
    full_content: '',
    media_url: '',
    media_type: '',
    category_id: '',
    difficulty_level: 1,
    is_premium: true,
  });

  const { data: categories } = useQuery({
    queryKey: ['challenge-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenge_categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: coachingContent } = useQuery({
    queryKey: ['coaching-content-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coaching_content')
        .select('*, challenge_categories(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CoachingFormData) => {
      const { error } = await supabase.from('coaching_content').insert({
        ...data,
        media_type: data.media_type || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching-content-admin'] });
      toast.success('Coaching content created successfully');
      resetForm();
      setOpen(false);
    },
    onError: () => {
      toast.error('Failed to create coaching content');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CoachingFormData }) => {
      const { error } = await supabase
        .from('coaching_content')
        .update({
          ...data,
          media_type: data.media_type || null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching-content-admin'] });
      toast.success('Coaching content updated successfully');
      resetForm();
      setOpen(false);
    },
    onError: () => {
      toast.error('Failed to update coaching content');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('coaching_content')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching-content-admin'] });
      toast.success('Coaching content deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete coaching content');
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      full_content: '',
      media_url: '',
      media_type: '',
      category_id: '',
      difficulty_level: 1,
      is_premium: true,
    });
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (content: any) => {
    setFormData({
      title: content.title,
      description: content.description,
      full_content: content.full_content || '',
      media_url: content.media_url || '',
      media_type: content.media_type || '',
      category_id: content.category_id || '',
      difficulty_level: content.difficulty_level,
      is_premium: content.is_premium,
    });
    setEditingId(content.id);
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Coaching Content</h2>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Content
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Edit Coaching Content' : 'Create Coaching Content'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description (Preview) *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label htmlFor="full_content">Full Content</Label>
                <Textarea
                  id="full_content"
                  value={formData.full_content}
                  onChange={(e) => setFormData({ ...formData, full_content: e.target.value })}
                  rows={6}
                  placeholder="Enter the full tutorial content here..."
                />
              </div>

              <div>
                <Label htmlFor="media_url">Media URL</Label>
                <Input
                  id="media_url"
                  value={formData.media_url}
                  onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label htmlFor="media_type">Media Type</Label>
                <Select
                  value={formData.media_type}
                  onValueChange={(value) => setFormData({ ...formData, media_type: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select media type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select
                  value={formData.difficulty_level.toString()}
                  onValueChange={(value) => setFormData({ ...formData, difficulty_level: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Beginner</SelectItem>
                    <SelectItem value="2">Easy</SelectItem>
                    <SelectItem value="3">Medium</SelectItem>
                    <SelectItem value="4">Hard</SelectItem>
                    <SelectItem value="5">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_premium"
                  checked={formData.is_premium}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_premium: checked })}
                />
                <Label htmlFor="is_premium">Premium Content (Locked for non-premium users)</Label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingId ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {coachingContent?.map((content) => (
          <Card key={content.id}>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span className="line-clamp-1">{content.title}</span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(content)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(content.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {content.description}
              </p>
              <div className="flex gap-2 text-xs">
                {content.is_premium && (
                  <span className="text-primary">Premium</span>
                )}
                {content.challenge_categories?.name && (
                  <span className="text-muted-foreground">
                    {content.challenge_categories.name}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
