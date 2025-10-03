import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Play, 
  CheckCircle, 
  Clock,
  Zap,
  Target
} from 'lucide-react';

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

interface SocialCarouselProps {
  activities: SocialActivity[];
}

const ActivityIcon = ({ action }: { action: string }) => {
  switch (action) {
    case 'completed':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'started':
      return <Play className="w-4 h-4 text-blue-600" />;
    case 'milestone':
      return <Trophy className="w-4 h-4 text-yellow-600" />;
    default:
      return <Zap className="w-4 h-4 text-gray-600" />;
  }
};

const ActivityItem: React.FC<{ activity: SocialActivity; index: number }> = ({ 
  activity, 
  index 
}) => {
  const actionText = {
    completed: 'terminé',
    started: 'commencé',
    milestone: 'milestone'
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="flex-shrink-0"
    >
      <div className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-4 w-80 shadow-lg hover:shadow-xl hover:bg-white transition-all duration-300">
        <div className="flex items-start gap-3">
          {/* User Avatar */}
          <Avatar className="w-12 h-12 border-2 border-white shadow-md">
            <AvatarImage src={activity.user.avatar_url || undefined} />
            <AvatarFallback className="text-sm font-bold bg-gradient-to-br from-blue-400 to-purple-400 text-white">
              {activity.user.display_name?.charAt(0) || activity.user.username?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {/* User Name */}
            <div className="mb-2">
              <span className="font-bold text-gray-900 text-base">
                {activity.user.display_name || activity.user.username}
              </span>
            </div>

            {/* Action + Challenge Title */}
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-1">
                <ActivityIcon action={activity.action} />
                <span className="text-gray-700 text-sm font-medium">
                  a {actionText[activity.action as keyof typeof actionText]}
                </span>
              </div>
              <div className="text-sm font-semibold text-gray-800 line-clamp-2 leading-tight">
                "{activity.challenge_title}"
              </div>
            </div>

            {/* Category Badge + Time */}
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700 font-medium">
                {activity.category_name}
              </Badge>
              <span className="text-xs text-gray-500 flex items-center gap-1 font-medium">
                <Clock className="w-3 h-3" />
                {activity.time_ago}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const SocialCarousel: React.FC<SocialCarouselProps> = ({ activities }) => {
  if (activities.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        <Target className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
      </div>

      <div className="relative -mx-4 px-4">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 pb-2" style={{ scrollSnapType: 'x mandatory' }}>
            {activities.map((activity, index) => (
              <div key={activity.id} style={{ scrollSnapAlign: 'start' }}>
                <ActivityItem activity={activity} index={index} />
              </div>
            ))}
          </div>
        </div>

        {/* Gradient fade edges - collés aux bords */}
        <div className="absolute top-0 left-0 w-12 h-full bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none z-10" />
        <div className="absolute top-0 right-0 w-12 h-full bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none z-10" />
      </div>
    </motion.div>
  );
};
