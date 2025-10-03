import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  Users, 
  Zap, 
  Award, 
  ArrowRight, 
  Flame,
  Star,
  Calendar,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserLevelBadge } from '@/components/ui/user-level-badge';
import { LevelProgress } from '@/components/ui/level-progress';
import { DifficultyCircle } from '@/components/ui/difficulty-circle';
import { CommunityActivity } from '@/components/home/CommunityActivity';
import { getLevelInfo, getLevelFromPoints } from '@/lib/levelSystem';

// Import category images
import sportsImg from "@/assets/category-sports.jpg";
import drawingImg from "@/assets/category-drawing.jpg";
import musicImg from "@/assets/category-music.jpg";
import cookingImg from "@/assets/category-cooking.jpg";
import writingImg from "@/assets/category-writing.jpg";
import codingImg from "@/assets/category-coding.jpg";
import gardeningImg from "@/assets/category-gardening.jpg";

interface Profile {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  level: number;
  total_points: number;
}

interface UserChallenge {
  id: string;
  status: string;
  progress_percentage?: number;
  challenges: {
    id: string;
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

interface FeaturedChallenge {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  points_reward: number;
  difficulty_level: number;
  challenge_categories: {
    name: string;
    icon: string;
  };
}


export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeChallenges, setActiveChallenges] = useState<UserChallenge[]>([]);
  const [featuredChallenges, setFeaturedChallenges] = useState<FeaturedChallenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    if (!user) return;
    
    try {
      await Promise.all([
        fetchProfile(),
        fetchActiveChallenges(),
        fetchFeaturedChallenges()
      ]);
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, avatar_url, level, total_points')
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
        challenges!user_challenges_challenge_id_fkey (
          id,
          title,
          description,
          image_url,
          points_reward,
          difficulty_level,
          category_id,
          challenge_categories!challenges_category_id_fkey (
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

  const fetchFeaturedChallenges = async () => {
    const { data, error } = await supabase
      .from('challenges')
      .select(`
        id,
        title,
        description,
        image_url,
        points_reward,
        difficulty_level,
        challenge_categories!challenges_category_id_fkey (
          name,
          icon
        )
      `)
      .eq('is_active', true)
      .eq('is_featured', true)
      .limit(3);

    if (data && !error) {
      setFeaturedChallenges(data);
    }
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


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Section 1: User Status (Mobile-Optimized Header) */}
      <div className="relative bg-gradient-to-br from-primary/10 via-background to-accent/10 border-b border-border/40">
        <div className="px-4 py-6 md:px-6 md:py-8">
          <div className="space-y-4">
            {/* User Profile Header - Mobile Optimized */}
            <div className="flex items-start gap-3">
              <Avatar className="h-16 w-16 border-3 border-primary/20 flex-shrink-0">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-lg font-bold bg-primary/10">
                  {profile?.display_name?.charAt(0) || profile?.username?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                {/* Name and Level Badge */}
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-xl font-bold truncate">
                    {profile?.display_name || profile?.username || 'User'}
              </h1>
            </div>

                {/* Level Progress - NEW FORMAT: 30/20 pts */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <UserLevelBadge totalPoints={profile?.total_points || 0} size="lg" />
                  </div>
                  <LevelProgress totalPoints={profile?.total_points || 0} size="sm" showDetails={true} />
                </div>
              </div>
            </div>

            {/* Personal KPIs - Mobile Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg bg-background/70 backdrop-blur-sm border border-border/40">
                <div className="text-xl font-bold text-primary mb-1">
                  {profile?.total_points || 0}
                </div>
                <div className="text-xs text-muted-foreground font-medium">
                  Points
                </div>
              </div>
              
              <div className="text-center p-3 rounded-lg bg-background/70 backdrop-blur-sm border border-border/40">
                <div className="text-xl font-bold text-foreground mb-1">
                  {activeChallenges.length}
                </div>
                <div className="text-xs text-muted-foreground font-medium">
                  Actifs
                </div>
              </div>
              
              <div className="text-center p-3 rounded-lg bg-background/70 backdrop-blur-sm border border-border/40">
                <div className="text-xl font-bold text-foreground mb-1">
                  {profile?.total_points ? getLevelFromPoints(profile.total_points) : 1}
                </div>
                <div className="text-xs text-muted-foreground font-medium">
                  Niveau
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 space-y-8">
        
        {/* Section 1.5: Active Challenges */}
        {activeChallenges.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Activity className="w-6 h-6 text-primary" />
              <h2 className="text-xl md:text-2xl font-bold">Active Challenges</h2>
            </div>
              <Button variant="ghost" onClick={() => navigate('/challenges')} className="text-sm">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
          </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeChallenges.map((userChallenge) => (
                <Card key={userChallenge.id} className="overflow-hidden hover:shadow-lg transition-all border-border/40 group">
                  <CardContent className="p-0">
                    <div className="relative">
                      <div className="h-32 overflow-hidden bg-muted">
                        <img 
                          src={userChallenge.challenges.image_url || getCategoryImage(userChallenge.challenges.challenge_categories?.name || '')} 
                          alt={userChallenge.challenges.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-background/90 backdrop-blur-sm text-foreground border-0">
                            {userChallenge.challenges.challenge_categories?.name}
                          </Badge>
                        </div>
                      </div>

                      <div className="p-4 space-y-3">
                        <div>
                          <h3 className="font-bold text-lg mb-1 line-clamp-2">
                            {userChallenge.challenges.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {userChallenge.challenges.description}
                          </p>
                        </div>

                          <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <DifficultyCircle level={userChallenge.challenges.difficulty_level} size="sm" />
                            <span className="text-muted-foreground">
                              Level {userChallenge.challenges.difficulty_level}
                            </span>
                          </div>
                            <div className="flex items-center gap-1">
                              <Award className="w-4 h-4 text-primary" />
                              <span className="font-semibold">{userChallenge.challenges.points_reward} pts</span>
                          </div>
                        </div>

                        <Button 
                          onClick={() => navigate('/challenges')} 
                          size="sm" 
                          className="w-full font-semibold"
                        >
                          Go to Challenge
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Section 2: Community Activity */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-primary" />
            <h2 className="text-xl md:text-2xl font-bold">Community Activity</h2>
          </div>

          <CommunityActivity />
        </div>

        {/* Section 3: Featured Challenges */}
        {featuredChallenges.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Star className="w-6 h-6 text-primary" />
                <h2 className="text-xl md:text-2xl font-bold">Featured Challenges</h2>
              </div>
              <Button variant="ghost" onClick={() => navigate('/challenges')} className="text-sm">
                Browse All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredChallenges.map((challenge) => (
                <Card key={challenge.id} className="overflow-hidden hover:shadow-xl transition-all border-border/40 group">
                  <CardContent className="p-0">
                    <div className="relative">
                      <div className="h-48 overflow-hidden bg-muted">
                        <img 
                          src={challenge.image_url || getCategoryImage(challenge.challenge_categories?.name || '')} 
                          alt={challenge.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-background/90 backdrop-blur-sm text-foreground border-0">
                            {challenge.challenge_categories?.name}
                          </Badge>
                        </div>
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-primary/90 backdrop-blur-sm text-primary-foreground border-0">
                            <Star className="w-3 h-3 mr-1 fill-current" />
                            Featured
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="p-5 space-y-4">
                        <div>
                          <h3 className="font-bold text-xl mb-2 line-clamp-2">
                            {challenge.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {challenge.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <DifficultyCircle level={challenge.difficulty_level} size="sm" />
                            <span className="text-sm text-muted-foreground">
                              Level {challenge.difficulty_level}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Award className="w-4 h-4 text-primary" />
                            <span className="font-semibold">{challenge.points_reward} pts</span>
                          </div>
                        </div>

                        <Button 
                          onClick={() => navigate('/challenges')} 
                          size="sm" 
                          className="w-full font-semibold"
                        >
                          Join Challenge
                          <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
                      </div>
                    </div>
              </CardContent>
            </Card>
              ))}
            </div>
          </div>
          )}

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