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
  Activity,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserLevelBadge } from '@/components/ui/user-level-badge';
import { LevelProgress } from '@/components/ui/level-progress';
import { DifficultyCircle } from '@/components/ui/difficulty-circle';
import { CommunityActivity } from '@/components/home/CommunityActivity';
import { HeroCard } from '@/components/home/HeroCard';
import { WeeklyKpiCard } from '@/components/home/WeeklyKpiCard';
import { CtaCard } from '@/components/home/CtaCard';
import { getLevelInfo, getLevelFromPoints } from '@/lib/levelSystem';
import { UserHeaderGlass } from '@/components/user/UserHeaderGlass';

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
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [launchedToday, setLaunchedToday] = useState(0);
  const [completedThisWeek, setCompletedThisWeek] = useState(0);
  const [weeklyGoal, setWeeklyGoal] = useState(0);

  useEffect(() => {
    fetchAllData();
  }, [user]);

  const fetchAllData = async () => {
    try {
      await Promise.all([
        user ? fetchProfile() : Promise.resolve(),
        user ? fetchActiveChallenges() : Promise.resolve(),
        fetchFeaturedChallenges(),
        fetchCommunityStats()
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

  const fetchRecentActivities = async () => {
    const { data, error } = await supabase
      .from('user_challenges')
      .select(`
        id,
        status,
        created_at,
        challenges!inner (
          title,
          challenge_categories!inner (
            name
          )
        ),
        profiles!inner (
          username,
          display_name,
          avatar_url
        )
      `)
      .in('status', ['completed', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(6);

    if (data && !error) {
      const activities = data.map(item => ({
        id: item.id,
        username: item.profiles.display_name || item.profiles.username,
        avatar_url: item.profiles.avatar_url,
        action: item.status === 'completed' ? 'completed' : 'started',
        challenge_title: item.challenges.title,
        category: item.challenges.challenge_categories.name,
        created_at: item.created_at
      }));
      setRecentActivities(activities);
    }
  };

  // Generate consistent daily numbers based on date (same for all users)
  const generateDailyConsistentNumber = (baseRange: number, maxRange: number, seed: string): number => {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD
    const combinedSeed = `${dateString}-${seed}`;
    
    // Simple hash function to generate consistent number
    let hash = 0;
    for (let i = 0; i < combinedSeed.length; i++) {
      const char = combinedSeed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return baseRange + (Math.abs(hash) % (maxRange - baseRange + 1));
  };

  const fetchCommunityStats = async () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    // Launched today (5-18 range) - consistent for all users
    const launchedTodayValue = generateDailyConsistentNumber(5, 18, 'launched');
    setLaunchedToday(launchedTodayValue);
    
    // Weekly progressive logic - consistent for all users
    const baseWeekly = 20;
    const dailyIncrease = generateDailyConsistentNumber(5, 18, 'weekly-increase');
    const weeklyTotal = Math.min(baseWeekly + (dayOfWeek * dailyIncrease), 85);
    setCompletedThisWeek(weeklyTotal);
    
    // Weekly goal (71-97 range, changes each week) - consistent for all users
    const weekNumber = Math.floor(today.getTime() / (7 * 24 * 60 * 60 * 1000)); // Week number since epoch
    const goalSeed = weekNumber % 27; // Cycle through 27 different goals
    const weeklyGoalValue = 71 + goalSeed; // 71 to 97
    setWeeklyGoal(weeklyGoalValue);
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
      {/* Section 1: User Status - iOS 26 Glass Header */}
      <div className="relative bg-gradient-to-br from-orange-500/20 via-orange-400/15 to-orange-300/10 border-b border-border/40 -mt-20 pt-20">
        {user ? (
          <UserHeaderGlass
            avatarUrl={profile?.avatar_url}
            username={profile?.display_name || profile?.username || 'User'}
            level={profile?.total_points ? getLevelFromPoints(profile.total_points) : 1}
            levelTitle={getLevelInfo(profile?.total_points ? getLevelFromPoints(profile.total_points) : 1).title}
            points={profile?.total_points || 0}
            activeChallenges={activeChallenges.length}
            currentLevelPoints={profile?.total_points ? profile.total_points - getLevelInfo(getLevelFromPoints(profile.total_points)).pointsRequired : 0}
            pointsToNextLevel={getLevelInfo(profile?.total_points ? getLevelFromPoints(profile.total_points) : 1).pointsForNextLevel}
          />
        ) : (
          <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                Bienvenue sur Challengr
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                Rejoignez une communauté de passionnés et relevez des défis incroyables. 
                Créez un compte gratuit pour commencer votre aventure !
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => navigate('/auth')}
                  size="lg"
                  className="h-12 px-8 font-semibold shadow-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 rounded-full"
                >
                  Créer un compte gratuit
                </Button>
                <Button 
                  onClick={() => navigate('/challenges')}
                  variant="outline"
                  size="lg"
                  className="h-12 px-8 font-semibold rounded-full"
                >
                  Explorer les défis
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 space-y-8">
        
        {/* Section 1.5: Active Challenges or Welcome Message */}
        {user && activeChallenges.length > 0 ? (
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
        ) : !user && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-primary" />
              <h2 className="text-xl md:text-2xl font-bold">Commencez votre aventure</h2>
            </div>
            <div className="bg-gradient-to-r from-orange-50 to-pink-50 border border-orange-200 rounded-2xl p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Relevez des défis passionnants</h3>
                <p className="text-muted-foreground mb-4">
                  Créez un compte gratuit pour commencer des défis, gagner des points et rejoindre une communauté de passionnés !
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={() => navigate('/auth')}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                  >
                    Créer un compte gratuit
                  </Button>
                  <Button 
                    onClick={() => navigate('/challenges')}
                    variant="outline"
                  >
                    Voir tous les défis
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 2: Community Activity */}
        <div className="space-y-4 sm:space-y-5">
          <HeroCard today={launchedToday} deltaPct={launchedToday > 10 ? 15 : 0} />
          <WeeklyKpiCard value={completedThisWeek} weeklyGoal={weeklyGoal} />
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

        {/* Section 4: CTA Navigation - Bottom of page */}
        <div className="mt-6 sm:mt-7 grid gap-3">
          <CtaCard
            icon={<Trophy className="w-5 h-5" />}
            title="Explore Challenges"
            subtitle="Discover new ways to push your limits"
            href="/challenges"
          />
          <CtaCard
            icon={<Sparkles className="w-5 h-5" />}
            title="Community Feed"
            subtitle="See what others are achieving"
            href="/community"
          />
        </div>

      </div>
    </div>
  );
}