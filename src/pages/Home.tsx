import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Target, TrendingUp, Users, Zap, Award, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Import category images
import sportsImg from "@/assets/category-sports.jpg";
import drawingImg from "@/assets/category-drawing.jpg";
import musicImg from "@/assets/category-music.jpg";
import cookingImg from "@/assets/category-cooking.jpg";
import writingImg from "@/assets/category-writing.jpg";
import codingImg from "@/assets/category-coding.jpg";
import gardeningImg from "@/assets/category-gardening.jpg";

interface Profile {
  username: string;
  display_name: string;
  level: number;
  total_points: number;
}

interface UserChallenge {
  id: string;
  status: string;
  challenges: {
    title: string;
    description: string;
    image_url: string | null;
    points_reward: number;
    difficulty_level: number;
    category_id: string;
    challenge_categories: {
      name: string;
      icon: string;
    };
  };
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeChallenges, setActiveChallenges] = useState<UserChallenge[]>([]);
  const [stats, setStats] = useState({
    completed: 0,
    inProgress: 0,
    points: 0
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchActiveChallenges();
      fetchStats();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('username, display_name, level, total_points')
      .eq('user_id', user.id)
      .single();

    if (data && !error) {
      setProfile(data);
    }
  };

  const fetchActiveChallenges = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_challenges')
      .select(`
        id,
        status,
        challenges (
          title,
          description,
          image_url,
          points_reward,
          difficulty_level,
          category_id,
          challenge_categories (
            name,
            icon
          )
        )
      `)
      .eq('user_id', user.id)
      .in('status', ['in_progress', 'to_do'])
      .limit(3);

    if (data && !error) {
      setActiveChallenges(data);
    }
  };

  const fetchStats = async () => {
    if (!user) return;

    const { data: completedData } = await supabase
      .from('user_challenges')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'completed');

    const { data: inProgressData } = await supabase
      .from('user_challenges')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'in_progress');

    setStats({
      completed: completedData?.length || 0,
      inProgress: inProgressData?.length || 0,
      points: profile?.total_points || 0
    });
  };

  const getCategoryVariant = (categoryName: string) => {
    const variants: Record<string, any> = {
      'Sports': 'sports',
      'Drawing': 'drawing',
      'Music': 'music',
      'Cooking': 'cooking',
      'Writing': 'writing',
      'Coding': 'coding',
      'Gardening': 'gardening'
    };
    return variants[categoryName] || 'default';
  };

  const getStatusVariant = (status: string) => {
    const variants: Record<string, any> = {
      'to_do': 'to-do',
      'in_progress': 'in-progress',
      'completed': 'completed'
    };
    return variants[status] || 'default';
  };

  const getCategoryImage = (categoryName: string): string => {
    const categoryImages: { [key: string]: string } = {
      'Sports': sportsImg,
      'Drawing': drawingImg,
      'Music': musicImg,
      'Cooking': cookingImg,
      'Writing': writingImg,
      'Coding': codingImg,
      'Gardening': gardeningImg
    };
    return categoryImages[categoryName] || sportsImg;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Strava-style */}
      <div className="relative bg-gradient-to-br from-primary/10 via-background to-accent/10 border-b border-border/40">
        <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-2">
                Welcome back, {profile?.display_name || profile?.username}
              </h1>
              <p className="text-base md:text-lg text-muted-foreground">
                Track your progress and achieve your goals
              </p>
            </div>

            {/* Stats Row - Strava style */}
            <div className="grid grid-cols-4 gap-4 max-w-4xl">
              <div className="text-center p-4 rounded-lg bg-background/50 backdrop-blur-sm border border-border/40">
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">{stats.completed}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Completed</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-background/50 backdrop-blur-sm border border-border/40">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">{stats.inProgress}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Active</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-background/50 backdrop-blur-sm border border-border/40">
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">{profile?.total_points || 0}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Points</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-background/50 backdrop-blur-sm border border-border/40">
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">{profile?.level || 1}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Level</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 space-y-8">
        {/* Active Challenges - Activity Feed Style */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-primary" />
              <h2 className="text-xl md:text-2xl font-bold">Active Challenges</h2>
            </div>
            {activeChallenges.length > 0 && (
              <Button variant="ghost" onClick={() => navigate('/challenges')} className="text-sm">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>

          {activeChallenges.length > 0 ? (
            <div className="space-y-4">
              {activeChallenges.map((userChallenge) => (
                <Card key={userChallenge.id} className="overflow-hidden hover:shadow-lg transition-all border-border/40">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      {/* Image Section */}
                      <div className="relative w-full md:w-48 h-48 md:h-auto overflow-hidden bg-muted flex-shrink-0">
                        <img 
                          src={userChallenge.challenges.image_url || getCategoryImage(userChallenge.challenges.challenge_categories?.name || '')} 
                          alt={userChallenge.challenges.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-background/90 backdrop-blur-sm text-foreground border-0">
                            {userChallenge.challenges.challenge_categories?.name}
                          </Badge>
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="flex-1 p-5 md:p-6 space-y-4">
                        <div>
                          <h3 className="text-xl md:text-2xl font-bold mb-2">{userChallenge.challenges.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {userChallenge.challenges.description}
                          </p>
                        </div>

                        {/* Progress Section */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-semibold">In Progress</span>
                          </div>
                          <Progress value={60} className="h-2" />
                        </div>

                        {/* Stats & Action */}
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Award className="w-4 h-4 text-primary" />
                              <span className="font-semibold">{userChallenge.challenges.points_reward} pts</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Target className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Level {userChallenge.challenges.difficulty_level}</span>
                            </div>
                          </div>
                          <Button onClick={() => navigate('/challenges')} size="sm" className="font-semibold">
                            Continue
                            <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2">
              <CardContent className="text-center py-12">
                <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="text-lg font-semibold mb-2">No active challenges</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Start your first challenge and begin your journey
                </p>
                <Button size="lg" onClick={() => navigate('/challenges')} className="h-11 px-8 font-semibold">
                  Browse Challenges
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="group hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer" onClick={() => navigate('/challenges')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Trophy className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">Explore Challenges</h3>
                  <p className="text-sm text-muted-foreground">
                    Discover new ways to push your limits
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer" onClick={() => navigate('/community')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">Community Feed</h3>
                  <p className="text-sm text-muted-foreground">
                    See what others are achieving
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}