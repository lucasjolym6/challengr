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
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Welcome back, {profile?.display_name || profile?.username || 'Challenger'}! 👋
        </h1>
        <p className="text-muted-foreground text-lg">
          Ready to take on some challenges today?
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="hover-lift">
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold text-primary">{stats.completed}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        
        <Card className="hover-lift">
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 text-accent mx-auto mb-2" />
            <div className="text-2xl font-bold text-accent">{stats.inProgress}</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        
        <Card className="hover-lift">
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 text-secondary mx-auto mb-2" />
            <div className="text-2xl font-bold text-secondary">{profile?.total_points || 0}</div>
            <div className="text-sm text-muted-foreground">Points</div>
          </CardContent>
        </Card>
        
        <Card className="hover-lift">
          <CardContent className="p-4 text-center">
            <Medal className="h-8 w-8 text-success mx-auto mb-2" />
            <div className="text-2xl font-bold text-success">{profile?.level || 1}</div>
            <div className="text-sm text-muted-foreground">Level</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Challenges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Your Active Challenges
          </CardTitle>
          <CardDescription>
            Keep the momentum going with these challenges
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeChallenges.length > 0 ? (
            <div className="space-y-3">
              {activeChallenges.map((userChallenge) => (
                <div
                  key={userChallenge.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {userChallenge.challenges.challenge_categories?.icon || '🎯'}
                    </span>
                    <div>
                      <h4 className="font-medium">{userChallenge.challenges.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={getCategoryVariant(userChallenge.challenges.challenge_categories?.name)}>
                          {userChallenge.challenges.challenge_categories?.name}
                        </Badge>
                        <Badge variant={getStatusVariant(userChallenge.status)}>
                          {userChallenge.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/challenges">View</Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No active challenges</h3>
              <p className="text-muted-foreground mb-4">
                Start your challenge journey today!
              </p>
              <Button variant="gradient" size="lg" asChild>
                <Link to="/challenges">Browse Challenges</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link to="/challenges" className="block">
          <Card className="hover-lift cursor-pointer">
            <CardContent className="p-6 text-center">
              <Trophy className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Browse Challenges</h3>
              <p className="text-muted-foreground">
                Discover new challenges across different categories
              </p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/community" className="block">
          <Card className="hover-lift cursor-pointer">
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-secondary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Join Community</h3>
              <p className="text-muted-foreground">
                Share your progress and get inspired by others
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}