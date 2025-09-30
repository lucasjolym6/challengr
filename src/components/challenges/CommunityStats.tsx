import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Trophy, Medal, Award, TrendingUp, Users, Crown } from "lucide-react";

interface LeaderboardUser {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  total_points: number;
  level: number;
  completed_challenges: number;
}

interface BadgeData {
  id: string;
  name: string;
  description: string;
  icon: string;
  points_required: number;
  earned?: boolean;
}

const CommunityStats: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardUser[]>([]);
  const [userBadges, setUserBadges] = useState<BadgeData[]>([]);
  const [availableBadges, setAvailableBadges] = useState<BadgeData[]>([]);
  const [userStats, setUserStats] = useState({
    rank: 0,
    totalPoints: 0,
    completedChallenges: 0,
    level: 1
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommunityData();
  }, [user]);

  const fetchCommunityData = async () => {
    try {
      // Fetch global leaderboard
      const { data: leaderboardData, error: leaderboardError } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url, total_points, level')
        .order('total_points', { ascending: false })
        .limit(10);

      if (leaderboardError) throw leaderboardError;

      // Fetch user's completed challenges count for each user
      const leaderboardWithChallenges = await Promise.all(
        (leaderboardData || []).map(async (user) => {
          const { count } = await supabase
            .from('user_challenges')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.user_id)
            .eq('status', 'completed');

          return {
            ...user,
            completed_challenges: count || 0
          };
        })
      );

      setGlobalLeaderboard(leaderboardWithChallenges);

      // Fetch badges
      const { data: badgesData, error: badgesError } = await supabase
        .from('badges')
        .select('*')
        .order('points_required', { ascending: true });

      if (badgesError) throw badgesError;

      if (user) {
        // Fetch user's earned badges
        const { data: userBadgesData, error: userBadgesError } = await supabase
          .from('user_badges')
          .select('badge_id')
          .eq('user_id', user.id);

        if (userBadgesError) throw userBadgesError;

        const earnedBadgeIds = new Set(userBadgesData?.map(ub => ub.badge_id) || []);
        
        const badgesWithEarnedStatus = (badgesData || []).map(badge => ({
          ...badge,
          earned: earnedBadgeIds.has(badge.id)
        }));

        setUserBadges(badgesWithEarnedStatus.filter(b => b.earned));
        setAvailableBadges(badgesWithEarnedStatus.filter(b => !b.earned));

        // Get user's rank and stats
        const userRank = leaderboardWithChallenges.findIndex(u => u.user_id === user.id) + 1;
        const userData = leaderboardWithChallenges.find(u => u.user_id === user.id);
        
        setUserStats({
          rank: userRank,
          totalPoints: userData?.total_points || 0,
          completedChallenges: userData?.completed_challenges || 0,
          level: userData?.level || 1
        });
      }

    } catch (error) {
      console.error('Error fetching community data:', error);
      toast({
        title: "Error",
        description: "Failed to load community data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Award className="w-5 h-5 text-orange-500" />;
      default: return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold">#{rank}</span>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="w-48 h-6 bg-muted rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="w-32 h-4 bg-muted rounded"></div>
                    <div className="w-24 h-3 bg-muted rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Stats Overview */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Your Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <div className="text-2xl font-bold text-primary">{userStats.rank || 'Unranked'}</div>
                <p className="text-sm text-muted-foreground">Global Rank</p>
              </div>
              <div className="text-center p-4 bg-success/10 rounded-lg">
                <div className="text-2xl font-bold text-success">{userStats.totalPoints}</div>
                <p className="text-sm text-muted-foreground">Total Points</p>
              </div>
              <div className="text-center p-4 bg-accent/10 rounded-lg">
                <div className="text-2xl font-bold text-accent">{userStats.completedChallenges}</div>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
              <div className="text-center p-4 bg-secondary/10 rounded-lg">
                <div className="text-2xl font-bold">{userStats.level}</div>
                <p className="text-sm text-muted-foreground">Level</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="leaderboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Global Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {globalLeaderboard.map((player, index) => (
                  <div 
                    key={player.user_id} 
                    className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                      player.user_id === user?.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-center w-8">
                      {getRankIcon(index + 1)}
                    </div>
                    
                    <Avatar>
                      <AvatarImage src={player.avatar_url || undefined} />
                      <AvatarFallback>
                        {player.display_name?.charAt(0) || player.username?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <p className="font-semibold">{player.display_name || player.username}</p>
                      <p className="text-sm text-muted-foreground">
                        {player.completed_challenges} challenges completed
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold text-primary">{player.total_points} pts</p>
                      <p className="text-sm text-muted-foreground">Level {player.level}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {globalLeaderboard.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No players on the leaderboard yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="badges" className="space-y-4">
          {/* Earned Badges */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Your Badges ({userBadges.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userBadges.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userBadges.map((badge) => (
                    <div 
                      key={badge.id}
                      className="flex items-center gap-3 p-4 bg-success/10 border border-success/20 rounded-lg"
                    >
                      <div className="text-2xl">{badge.icon}</div>
                      <div>
                        <p className="font-semibold">{badge.name}</p>
                        <p className="text-sm text-muted-foreground">{badge.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No badges earned yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Complete challenges to earn your first badge!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Badges */}
          <Card>
            <CardHeader>
              <CardTitle>Available Badges</CardTitle>
            </CardHeader>
            <CardContent>
              {availableBadges.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableBadges.map((badge) => (
                    <div 
                      key={badge.id}
                      className="flex items-center gap-3 p-4 bg-muted/30 border border-muted rounded-lg opacity-75"
                    >
                      <div className="text-2xl grayscale">{badge.icon}</div>
                      <div>
                        <p className="font-semibold">{badge.name}</p>
                        <p className="text-sm text-muted-foreground">{badge.description}</p>
                        <Badge variant="outline" className="mt-1">
                          {badge.points_required} points required
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">All badges earned!</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Congratulations on collecting all available badges!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommunityStats;