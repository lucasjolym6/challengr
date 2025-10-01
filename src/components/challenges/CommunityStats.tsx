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
      <div className="fixed top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
        <div className="w-[75vw] max-w-md h-[50vh] bg-gradient-to-br from-orange-50 via-white to-pink-50 rounded-3xl shadow-2xl p-6 animate-pulse">
          <div className="flex flex-col h-full">
            <div className="w-32 h-6 bg-muted rounded mb-4"></div>
            <div className="space-y-3 flex-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-1">
                    <div className="w-24 h-3 bg-muted rounded"></div>
                    <div className="w-16 h-2 bg-muted rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
      <div className="w-[75vw] max-w-md h-[50vh] bg-gradient-to-br from-orange-50 via-white to-pink-50 rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex flex-col h-full p-6">
          {/* Header with User Stats */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-orange-500" />
                Leaderboard
              </h2>
            </div>
            
            {user && userStats.rank > 0 && (
              <div className="bg-gradient-to-r from-orange-100 to-pink-100 rounded-2xl p-3 mb-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center font-bold text-orange-600">
                      #{userStats.rank}
                    </div>
                    <span className="font-semibold text-gray-700">Your Rank</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-orange-600">{userStats.totalPoints} pts</div>
                    <div className="text-xs text-gray-600">Level {userStats.level}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Leaderboard List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {globalLeaderboard.slice(0, 5).map((player, index) => (
              <div 
                key={player.user_id} 
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  player.user_id === user?.id 
                    ? 'bg-gradient-to-r from-orange-200 to-pink-200 shadow-md' 
                    : 'bg-white/70 hover:bg-white/90'
                }`}
              >
                <div className="flex items-center justify-center w-8 h-8">
                  {getRankIcon(index + 1)}
                </div>
                
                <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                  <AvatarImage src={player.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-orange-400 to-pink-400 text-white text-sm font-semibold">
                    {player.display_name?.charAt(0) || player.username?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800 truncate">
                    {player.display_name || player.username}
                  </p>
                  <p className="text-xs text-gray-600">
                    {player.completed_challenges} challenges
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="font-bold text-sm text-orange-600">{player.total_points}</p>
                  <p className="text-xs text-gray-500">Lvl {player.level}</p>
                </div>
              </div>
            ))}
            
            {globalLeaderboard.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No players yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, rgb(251, 146, 60), rgb(244, 114, 182));
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, rgb(249, 115, 22), rgb(236, 72, 153));
        }
      `}</style>
    </div>
  );
};

export default CommunityStats;