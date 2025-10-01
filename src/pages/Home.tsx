import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { 
  Trophy, 
  Target, 
  Users, 
  TrendingUp,
  Zap,
  Medal,
  Star
} from 'lucide-react';

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
    category_id: string;
    challenge_categories: {
      name: string;
      icon: string;
    };
  };
}

export default function Home() {
  const { user } = useAuth();
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

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in max-w-2xl mx-auto md:max-w-none">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">
          Welcome back, {profile?.display_name || profile?.username || 'Challenger'}!
        </h1>
        <p className="text-sm text-muted-foreground">
          Ready to take on challenges today?
        </p>
      </div>

      {/* Stats Cards - Mobile optimized */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="hover-lift">
          <CardContent className="p-3 text-center">
            <Trophy className="h-6 w-6 text-primary mx-auto mb-1" />
            <div className="text-xl font-bold">{stats.completed}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        
        <Card className="hover-lift">
          <CardContent className="p-3 text-center">
            <Target className="h-6 w-6 text-accent mx-auto mb-1" />
            <div className="text-xl font-bold">{stats.inProgress}</div>
            <div className="text-xs text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        
        <Card className="hover-lift">
          <CardContent className="p-3 text-center">
            <Star className="h-6 w-6 text-secondary mx-auto mb-1" />
            <div className="text-xl font-bold">{profile?.total_points || 0}</div>
            <div className="text-xs text-muted-foreground">Points</div>
          </CardContent>
        </Card>
        
        <Card className="hover-lift">
          <CardContent className="p-3 text-center">
            <Medal className="h-6 w-6 text-success mx-auto mb-1" />
            <div className="text-xl font-bold">{profile?.level || 1}</div>
            <div className="text-xs text-muted-foreground">Level</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Challenges - Feed style */}
      {activeChallenges.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Your Active Challenges
          </h2>
          {activeChallenges.map((userChallenge) => (
            <Card key={userChallenge.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-3xl flex-shrink-0">
                    {userChallenge.challenges.challenge_categories?.icon || '🎯'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold mb-1 leading-tight">{userChallenge.challenges.title}</h3>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <Badge variant="outline" className="text-xs">
                        {userChallenge.challenges.challenge_categories?.name}
                      </Badge>
                      <Badge 
                        variant={userChallenge.status === 'completed' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {userChallenge.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <Button variant="default" size="sm" className="w-full" asChild>
                      <Link to="/challenges">Continue Challenge</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeChallenges.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Target className="h-16 w-16 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h3 className="text-lg font-bold mb-2">No active challenges</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start your challenge journey today!
            </p>
            <Button variant="default" size="lg" className="w-full md:w-auto" asChild>
              <Link to="/challenges">Browse Challenges</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions - Full width on mobile */}
      <div className="grid md:grid-cols-2 gap-3">
        <Link to="/challenges" className="block">
          <Card className="hover-lift cursor-pointer">
            <CardContent className="p-4 text-center">
              <Trophy className="h-10 w-10 text-primary mx-auto mb-2" />
              <h3 className="text-base font-bold mb-1">Browse Challenges</h3>
              <p className="text-xs text-muted-foreground">
                Discover new challenges
              </p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/community" className="block">
          <Card className="hover-lift cursor-pointer">
            <CardContent className="p-4 text-center">
              <Users className="h-10 w-10 text-secondary mx-auto mb-2" />
              <h3 className="text-base font-bold mb-1">Join Community</h3>
              <p className="text-xs text-muted-foreground">
                Share your progress
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}