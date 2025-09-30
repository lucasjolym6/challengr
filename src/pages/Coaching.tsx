import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CoachingCard } from '@/components/coaching/CoachingCard';
import { CoachingDetailDialog } from '@/components/coaching/CoachingDetailDialog';
import { AdminCoachingManager } from '@/components/coaching/AdminCoachingManager';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { UpgradePremiumButton } from '@/components/premium/UpgradePremiumButton';
import { Loader2, GraduationCap, Shield, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const Coaching = () => {
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  
  const { data: premiumStatus, isLoading: premiumLoading } = usePremiumStatus();

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

  const { data: coachingContent, isLoading } = useQuery({
    queryKey: ['coaching-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coaching_content')
        .select('*, challenge_categories(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filteredContent = coachingContent?.filter(content => {
    const categoryMatch = selectedCategory === 'all' || content.category_id === selectedCategory;
    const difficultyMatch = selectedDifficulty === 'all' || content.difficulty_level === parseInt(selectedDifficulty);
    return categoryMatch && difficultyMatch;
  });

  const handleCardClick = (content: any) => {
    setSelectedContent(content);
    setDialogOpen(true);
  };

  if (premiumLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent flex items-center gap-2">
            <GraduationCap className="w-8 h-8" />
            Tuto & Coaching
          </h1>
          <p className="text-muted-foreground">
            Learn new skills and get expert guidance to master your challenges
          </p>
        </div>
        {!premiumStatus?.isPremium && (
          <UpgradePremiumButton size="lg" />
        )}
      </div>

      <Tabs defaultValue="content" className="space-y-6">
        <TabsList>
          <TabsTrigger value="content" className="gap-2">
            <GraduationCap className="w-4 h-4" />
            Tutorials
          </TabsTrigger>
          {premiumStatus?.isAdmin && (
            <TabsTrigger value="admin" className="gap-2">
              <Shield className="w-4 h-4" />
              Admin
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="content" className="space-y-6">
          {/* Filters */}
          <div className="flex gap-4 flex-wrap">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="1">Beginner</SelectItem>
                <SelectItem value="2">Easy</SelectItem>
                <SelectItem value="3">Medium</SelectItem>
                <SelectItem value="4">Hard</SelectItem>
                <SelectItem value="5">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Premium Status Banner */}
          {premiumStatus?.isPremium ? (
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm font-medium flex items-center gap-2">
                <Crown className="w-4 h-4" />
                <Badge variant="default">Premium Member</Badge>
                You have full access to all tutorials and coaching content
              </p>
            </div>
          ) : (
            <div className="p-4 bg-muted border rounded-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="font-medium mb-1">Unlock Full Access</p>
                  <p className="text-sm text-muted-foreground">
                    Upgrade to premium to unlock all tutorials, coaching content, and exclusive features
                  </p>
                </div>
                <UpgradePremiumButton />
              </div>
            </div>
          )}

          {/* Content Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : filteredContent && filteredContent.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredContent.map((content) => (
                <CoachingCard
                  key={content.id}
                  id={content.id}
                  title={content.title}
                  description={content.description}
                  mediaUrl={content.media_url}
                  mediaType={content.media_type as 'image' | 'video' | undefined}
                  isPremium={content.is_premium}
                  userIsPremium={premiumStatus?.isPremium ?? false}
                  categoryName={content.challenge_categories?.name}
                  difficultyLevel={content.difficulty_level}
                  onClick={() => handleCardClick(content)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No coaching content available yet. Check back soon!</p>
            </div>
          )}
        </TabsContent>

        {premiumStatus?.isAdmin && (
          <TabsContent value="admin">
            <AdminCoachingManager />
          </TabsContent>
        )}
      </Tabs>

      <CoachingDetailDialog
        content={selectedContent}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        userIsPremium={premiumStatus?.isPremium ?? false}
        categoryName={selectedContent?.challenge_categories?.name}
      />
    </div>
  );
};

export default Coaching;
