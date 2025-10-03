import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, Rocket, Clock } from 'lucide-react';

interface ActivityItem {
  id: string;
  username: string;
  avatar_url?: string;
  action: 'completed' | 'started';
  challenge_title: string;
  category: string;
  created_at: string;
}

interface RecentActivityListProps {
  items: ActivityItem[];
}

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return '1 day ago';
  return `${diffInDays} days ago`;
}

function getStatusChip(action: 'completed' | 'started') {
  if (action === 'completed') {
    return (
      <div className="flex items-center gap-1 bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full text-[11px] font-medium">
        <CheckCircle className="w-3 h-3" />
        <span>Completed</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-1 bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full text-[11px] font-medium">
      <Rocket className="w-3 h-3" />
      <span>Started</span>
    </div>
  );
}

function getCategoryIcon(category: string): string {
  const categoryMap: { [key: string]: string } = {
    'coding': '💻',
    'cooking': '👨‍🍳',
    'drawing': '🎨',
    'gardening': '🌱',
    'music': '🎵',
    'sports': '⚽',
    'writing': '✍️'
  };
  return categoryMap[category.toLowerCase()] || '📝';
}

export const RecentActivityList: React.FC<RecentActivityListProps> = ({ items }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  if (items.length === 0) {
    return (
      <div className="glass-lite rounded-2xl p-6 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center">
          <span className="text-2xl">📱</span>
        </div>
        <div className="text-[14px] text-zinc-700 dark:text-zinc-300 font-medium">
          Community updates will appear here
        </div>
        <div className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-1">
          Stay tuned for the latest activity
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-3"
    >
      {items.map((item) => (
        <motion.div
          key={item.id}
          variants={itemVariants}
          className="glass-lite rounded-2xl p-4 sm:p-5"
        >
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <Avatar className="w-11 h-11 ring-1 ring-white/40">
                <AvatarImage src={item.avatar_url || undefined} alt="" />
                <AvatarFallback className="bg-white/20 text-zinc-900 dark:text-zinc-100 font-medium">
                  {item.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Primary line */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {item.username}
                </span>
                {getStatusChip(item.action)}
              </div>

              {/* Secondary line */}
              <div className="text-[14px] text-zinc-700 dark:text-zinc-300 mb-2">
                {item.action === 'completed' ? 'completed' : 'started'} challenge{' '}
                <span className="font-medium">"{item.challenge_title}"</span>
              </div>

              {/* Meta row */}
              <div className="flex items-center gap-2">
                {/* Category pill */}
                <div className="chip px-2.5 py-1 text-[11px] font-medium">
                  <span className="mr-1">{getCategoryIcon(item.category)}</span>
                  {item.category}
                </div>

                {/* Time */}
                <div className="flex items-center gap-1 text-[12px] text-zinc-500 dark:text-zinc-400">
                  <Clock className="w-3 h-3" />
                  <span>{formatTimeAgo(item.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};
