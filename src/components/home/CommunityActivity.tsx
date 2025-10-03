import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { HeroStat } from './HeroStat';
import { KPIGrid } from './KPIGrid';
import { SocialCarousel } from './SocialCarousel';
import { getDailyKPIs } from '@/lib/kpiStore';

interface SocialActivity {
  id: string;
  user: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  action: 'completed' | 'started' | 'milestone';
  challenge_title: string;
  category_name: string;
  category_icon: string;
  time_ago: string;
}

export const CommunityActivity: React.FC = () => {
  const { user } = useAuth();
  const [kpis, setKpis] = useState({
    challengesLaunchedToday: 0,
    challengesCompletedThisWeek: 0,
    streaksContinuedToday: 0,
    validationRateToday: 0
  });
  const [activities, setActivities] = useState<SocialActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadKPIs();
      fetchRecentActivities();
    }
  }, [user]);

  const loadKPIs = () => {
    const dailyKPIs = getDailyKPIs();
    setKpis(dailyKPIs);
    setLoading(false);
  };

  const fetchRecentActivities = async () => {
    try {
      // Fetch recent user_challenges with profiles and challenges
      const { data, error } = await supabase
        .from('user_challenges')
        .select(`
          id,
          status,
          updated_at,
          profiles!user_challenges_user_id_fkey (
            username,
            display_name,
            avatar_url
          ),
          challenges!user_challenges_challenge_id_fkey (
            title,
            challenge_categories!challenges_category_id_fkey (
              name,
              icon
            )
          )
        `)
        .in('status', ['completed', 'in_progress'])
        .order('updated_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching activities:', error);
        return;
      }

      if (data) {
        const transformedActivities: SocialActivity[] = data.map((item) => ({
          id: item.id,
          user: {
            username: item.profiles?.username || 'Unknown',
            display_name: item.profiles?.display_name,
            avatar_url: item.profiles?.avatar_url
          },
          action: item.status === 'completed' ? 'completed' : 'started',
          challenge_title: item.challenges?.title || 'Unknown Challenge',
          category_name: item.challenges?.challenge_categories?.name || 'General',
          category_icon: item.challenges?.challenge_categories?.icon || '🎯',
          time_ago: formatTimeAgo(item.updated_at)
        }));

        setActivities(transformedActivities);
      }
    } catch (error) {
      console.error('Error in fetchRecentActivities:', error);
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Stat */}
      <HeroStat
        number={kpis.streaksContinuedToday}
        label="🔥 streaks continued today"
        subtitle="Proof that Challengr is alive, every single day"
        icon={<Flame className="w-8 h-8 text-white" />}
      />

      {/* KPI Grid */}
      <KPIGrid kpis={kpis} />

      {/* Social Micro-Feed */}
      {activities.length > 0 && (
        <SocialCarousel activities={activities} />
      )}
    </div>
  );
};
