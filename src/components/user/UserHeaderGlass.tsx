import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Zap, Activity, Medal, Star } from 'lucide-react';
import UserKpiTiles from './UserKpiTiles';

type UserHeaderGlassProps = {
  avatarUrl?: string;
  username: string;
  level: number;
  levelTitle: string;
  points: number;
  activeChallenges: number;
  pointsToNextLevel: number;
  currentLevelPoints: number;
};

export const UserHeaderGlass: React.FC<UserHeaderGlassProps> = ({
  avatarUrl,
  username,
  level,
  levelTitle,
  points,
  activeChallenges,
  pointsToNextLevel,
  currentLevelPoints,
}) => {
  // Compute progress percentage - points total vs points needed for next level
  const progressPercent = Math.min((points / Math.max(pointsToNextLevel, 1)) * 100, 100);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }
    }
  };

  const progressVariants = {
    hidden: { width: 0 },
    visible: { 
      width: `${progressPercent}%`,
      transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="glass-header-container"
      role="group"
      aria-label="User status"
    >
      {/* Row 1: Avatar + Username + Level Pill */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-14 w-14 border-2 border-white/30">
            <AvatarImage src={avatarUrl} alt={`${username} avatar`} />
            <AvatarFallback className="text-lg font-semibold bg-white/20 text-zinc-900 dark:text-zinc-100">
              {username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[120px]" title={username}>
              {username}
            </h2>
          </div>
        </div>
        
        {/* Level Pill */}
        <div className="glass-level-pill">
          <Star className="h-3 w-3" />
          <span>Level {level} • {levelTitle}</span>
        </div>
      </div>

      {/* Row 2: Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Niveau {level} • {levelTitle}
          </span>
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {points}/{pointsToNextLevel} pts
          </span>
        </div>
        
        <div className="glass-progress-track">
          <motion.div
            variants={progressVariants}
            initial="hidden"
            animate="visible"
            className="glass-progress-fill"
            role="progressbar"
            aria-valuenow={points}
            aria-valuemax={pointsToNextLevel}
            aria-label={`Progress: ${points} of ${pointsToNextLevel} points`}
          />
        </div>
      </div>

      {/* Row 3: KPI Tiles */}
      <UserKpiTiles
        items={[
          { id: 'points', value: points, label: 'Points', icon: <Zap size={18} /> },
          { id: 'active', value: activeChallenges, label: 'Actifs', icon: <Activity size={18} /> },
          { id: 'level', value: level, label: 'Niveau', icon: <Medal size={18} /> },
        ]}
      />
    </motion.div>
  );
};
