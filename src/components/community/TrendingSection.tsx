import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  Flame, 
  Users, 
  Clock,
  ChevronRight,
  Hash
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSpring, animated } from '@react-spring/web';

interface TrendingItem {
  id: string;
  type: 'hashtag' | 'challenge' | 'user';
  title: string;
  subtitle?: string;
  metric: number;
  metricType: 'posts' | 'users' | 'engagement';
  avatar?: string;
  color?: string;
  change: number; // percentage change
}

const TrendingSection: React.FC = () => {
  const { toast } = useToast();
  const [trendingItems, setTrendingItems] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [animation, setAnimation] = useSpring(() => ({
    opacity: 1,
    transform: 'translateY(0px)',
  }));

  useEffect(() => {
    fetchTrendingData();
  }, []);

  const fetchTrendingData = async () => {
    try {
      setLoading(true);

      // Fetch trending hashtags
      const { data: hashtagData } = await supabase
        .from('posts')
        .select('hashtags')
        .not('hashtags', 'is', null)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Count hashtag occurrences
      const hashtagCounts: Record<string, number> = {};
      hashtagData?.forEach(post => {
        post.hashtags?.forEach(hashtag => {
          hashtagCounts[hashtag] = (hashtagCounts[hashtag] || 0) + 1;
        });
      });

      const trendingHashtags = Object.entries(hashtagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([hashtag, count], index) => ({
          id: `hashtag-${hashtag}`,
          type: 'hashtag' as const,
          title: hashtag,
          metric: count,
          metricType: 'posts' as const,
          change: Math.floor(Math.random() * 50) + 10, // Mock data
          color: ['#FF6B6B', '#4ECDC4', '#45B7D1'][index],
        }));

      // Fetch trending challenges
      const { data: challengeData } = await supabase
        .from('challenges')
        .select(`
          id,
          title,
          challenge_categories (color),
          user_challenges (id),
          posts (id, likes_count, comments_count)
        `)
        .eq('is_active', true)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const trendingChallenges = challengeData
        ?.map(challenge => {
          const participantCount = challenge.user_challenges?.length || 0;
          const engagement = challenge.posts?.reduce((sum, post) => 
            sum + (post.likes_count || 0) + (post.comments_count || 0), 0) || 0;
          
          return {
            id: `challenge-${challenge.id}`,
            type: 'challenge' as const,
            title: challenge.title,
            metric: participantCount,
            metricType: 'users' as const,
            color: challenge.challenge_categories?.color || '#FF6B6B',
            change: Math.floor(Math.random() * 100) + 20,
          };
        })
        .sort((a, b) => b.metric - a.metric)
        .slice(0, 3) || [];

      // Fetch trending users (most active)
      const { data: userData } = await supabase
        .from('profiles')
        .select(`
          user_id,
          username,
          avatar_url,
          posts (id, likes_count, comments_count)
        `)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const trendingUsers = userData
        ?.map(user => {
          const engagement = user.posts?.reduce((sum, post) => 
            sum + (post.likes_count || 0) + (post.comments_count || 0), 0) || 0;
          
          return {
            id: `user-${user.user_id}`,
            type: 'user' as const,
            title: user.username,
            subtitle: `${engagement} engagement`,
            metric: engagement,
            metricType: 'engagement' as const,
            avatar: user.avatar_url,
            change: Math.floor(Math.random() * 80) + 15,
          };
        })
        .sort((a, b) => b.metric - a.metric)
        .slice(0, 2) || [];

      const allTrending = [...trendingHashtags, ...trendingChallenges, ...trendingUsers]
        .sort((a, b) => b.change - a.change)
        .slice(0, 6);

      setTrendingItems(allTrending);

      // Animate in
      setAnimation.start({
        opacity: 0,
        transform: 'translateY(20px)',
      });
      setTimeout(() => {
        setAnimation.start({
          opacity: 1,
          transform: 'translateY(0px)',
        });
      }, 100);

    } catch (error) {
      console.error('Error fetching trending data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les tendances",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getMetricLabel = (item: TrendingItem) => {
    switch (item.metricType) {
      case 'posts': return `${item.metric} posts`;
      case 'users': return `${item.metric} users`;
      case 'engagement': return `${item.metric} engagement`;
      default: return `${item.metric}`;
    }
  };

  const getIcon = (item: TrendingItem) => {
    switch (item.type) {
      case 'hashtag': return <Hash className="w-4 h-4" />;
      case 'challenge': return <Flame className="w-4 h-4" />;
      case 'user': return <Users className="w-4 h-4" />;
      default: return <TrendingUp className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-2xl p-4 animate-pulse">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-5 h-5 bg-gray-200 rounded"></div>
          <div className="h-5 bg-gray-200 rounded w-24"></div>
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-12"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <animated.div style={animation} className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-gray-900">Trending Now</h3>
        </div>
        <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700">
          View all
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      <div className="space-y-3">
        {trendingItems.map((item, index) => (
          <div key={item.id} className="flex items-center justify-between group cursor-pointer hover:bg-white/50 rounded-xl p-2 -m-2 transition-colors">
            <div className="flex items-center space-x-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                style={{ backgroundColor: item.color || '#FF6B6B' }}
              >
                {item.avatar ? (
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={item.avatar} alt={item.title} />
                    <AvatarFallback className="text-xs">
                      {item.title.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  getIcon(item)
                )}
              </div>
              
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900 text-sm">
                    {item.type === 'hashtag' ? `#${item.title}` : item.title}
                  </span>
                  <Badge 
                    variant="secondary" 
                    className="text-xs bg-green-100 text-green-700"
                  >
                    +{item.change}%
                  </Badge>
                </div>
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  {getIcon(item)}
                  <span>{getMetricLabel(item)}</span>
                </div>
                {item.subtitle && (
                  <p className="text-xs text-gray-500">{item.subtitle}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-1 text-xs text-gray-400 group-hover:text-gray-600">
              <TrendingUp className="w-3 h-3" />
              <span>#{index + 1}</span>
            </div>
          </div>
        ))}
      </div>

      {trendingItems.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No trending data available</p>
        </div>
      )}
    </animated.div>
  );
};

export default TrendingSection;
